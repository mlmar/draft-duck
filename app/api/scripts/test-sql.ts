import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const migrationPath = resolve(scriptDir, '../../../supabase/migrations/202611060001_yahoo_comparison_sessions.sql');
const migration = await readFile(migrationPath, 'utf8');
const container = `draft-duck-yahoo-sql-${process.pid}-${randomUUID().slice(0, 8)}`;
const password = randomUUID();
let started = false;

function runDocker(args: string[], input?: string, timeout = 15_000): string {
    const result = spawnSync('docker', args, {
        input,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout
    });
    if (result.error) throw new Error(`Docker is required for SQL tests: ${result.error.message}`);
    if (result.status !== 0) {
        const detail = result.stderr.trim() || result.stdout.trim() || `exit status ${result.status}`;
        throw new Error(`Docker command failed: ${detail}`);
    }
    return result.stdout.trim();
}

function psql(sql: string, expectPermissionDenied = false): Promise<string> {
    return new Promise((resolveOutput, reject) => {
        const child = spawn('docker', [
            'exec',
            '-i',
            container,
            'psql',
            '-X',
            '-qAt',
            '-v',
            'ON_ERROR_STOP=1',
            '-U',
            'postgres',
            '-d',
            'postgres'
        ]);
        let output = '';
        let error = '';
        let timedOut = false;
        const timeout = setTimeout(() => {
            timedOut = true;
            child.kill('SIGKILL');
        }, 10_000);
        child.stdout.setEncoding('utf8').on('data', (chunk: string) => (output += chunk));
        child.stderr.setEncoding('utf8').on('data', (chunk: string) => (error += chunk));
        child.on('error', (problem) => {
            clearTimeout(timeout);
            reject(problem);
        });
        child.on('close', (code) => {
            clearTimeout(timeout);
            if (timedOut) reject(new Error('psql command exceeded its 10 second timeout.'));
            else if (expectPermissionDenied && code !== 0 && error.toLowerCase().includes('permission denied')) {
                resolveOutput(error.trim());
            } else if (code === 0 && !expectPermissionDenied) resolveOutput(output.trim());
            else reject(new Error(`psql failed: ${error.trim() || `exit status ${code}`}`));
        });
        child.stdin.end(sql);
    });
}

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

function uuid(): string {
    return randomUUID();
}

async function expectScalar(sql: string, expected: string, message: string): Promise<void> {
    const actual = await psql(sql);
    assert(actual === expected, `${message}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
}

async function concurrentScalar(sql: string): Promise<string> {
    const output = await psql(sql);
    const values = output.split('\n').filter(Boolean);
    assert(values.length === 1, `Expected one scalar SQL result, got ${JSON.stringify(output)}`);
    return values[0]!;
}

function removeContainer(): boolean {
    if (!started) return true;
    const result = spawnSync('docker', ['rm', '--force', container], { encoding: 'utf8', timeout: 10_000 });
    started = false;
    if (result.status === 0) return true;
    const detail = result.stderr?.trim() || result.stdout?.trim() || `exit status ${result.status}`;
    console.error(`Could not remove test container ${container}: ${detail}`);
    return false;
}

process.once('SIGINT', () => {
    removeContainer();
    process.exit(130);
});
process.once('SIGTERM', () => {
    removeContainer();
    process.exit(143);
});

try {
    runDocker(
        ['run', '--detach', '--rm', '--name', container, '--env', `POSTGRES_PASSWORD=${password}`, 'postgres:17'],
        undefined,
        30_000
    );
    started = true;

    let ready = false;
    const deadline = Date.now() + 30_000;
    while (!ready && Date.now() < deadline) {
        try {
            runDocker(['exec', container, 'pg_isready', '-U', 'postgres', '-d', 'postgres']);
            ready = true;
        } catch {
            await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
        }
    }
    assert(ready, 'PostgreSQL container did not become ready within 30 seconds.');

    await psql(`
        create role anon nologin;
        create role authenticated nologin;
        create role service_role nologin bypassrls;
        create schema draft_duck;
    `);
    await psql(migration);

    const signatures = [
        'draft_duck.yahoo_create_attempt(uuid,text,timestamptz)',
        'draft_duck.yahoo_bind_attempt(uuid,text,text,text)',
        'draft_duck.yahoo_consume_callback(uuid,text,text)',
        'draft_duck.yahoo_complete_callback(uuid,text,timestamptz,boolean)',
        'draft_duck.yahoo_claim_session(uuid,text,text,timestamptz)',
        'draft_duck.yahoo_get_session(text,timestamptz)',
        'draft_duck.yahoo_disconnect(text)',
        'draft_duck.yahoo_cleanup(timestamptz)'
    ];
    for (const signature of signatures) {
        await expectScalar(
            `select has_function_privilege('service_role', '${signature}', 'execute')::int || ':' ||
                    has_function_privilege('anon', '${signature}', 'execute')::int || ':' ||
                    has_function_privilege('authenticated', '${signature}', 'execute')::int;`,
            '1:0:0',
            `RPC privilege check for ${signature}`
        );
    }
    await expectScalar(
        `select has_schema_privilege('service_role', 'draft_duck', 'usage')::int || ':' ||
                has_schema_privilege('anon', 'draft_duck', 'usage')::int || ':' ||
                has_schema_privilege('authenticated', 'draft_duck', 'usage')::int;`,
        '1:0:0',
        'Schema usage permissions'
    );
    const tables = ['draft_duck.yahoo_oauth_attempts', 'draft_duck.yahoo_sessions'];
    for (const table of tables) {
        await expectScalar(
            `select relrowsecurity::int from pg_class where oid = '${table}'::regclass;`,
            '1',
            `Row-level security is enabled on ${table}`
        );
        for (const privilege of ['select', 'insert', 'update', 'delete']) {
            await expectScalar(
                `select has_table_privilege('service_role', '${table}', '${privilege}')::int;`,
                '1',
                `service_role ${privilege} privilege on ${table}`
            );
            for (const role of ['anon', 'authenticated']) {
                await expectScalar(
                    `select has_table_privilege('${role}', '${table}', '${privilege}')::int;`,
                    '0',
                    `${role} has no ${privilege} privilege on ${table}`
                );
            }
        }
    }
    await expectScalar(
        `select rolbypassrls::int from pg_roles where rolname = 'service_role';`,
        '1',
        'service_role bypasses row-level security as the backend role'
    );

    const privilegedId = uuid();
    await expectScalar(
        `set role service_role;
         select draft_duck.yahoo_create_attempt('${privilegedId}', 'service-claim', now() + interval '10 minutes');
         select count(*) from draft_duck.yahoo_oauth_attempts where id = '${privilegedId}';
         reset role;`,
        '1',
        'service_role can execute the RPC and read rows through RLS'
    );
    for (const role of ['anon', 'authenticated']) {
        await psql(
            `set role ${role};
             select draft_duck.yahoo_create_attempt('${uuid()}', 'browser-claim', now() + interval '10 minutes');`,
            true
        );
    }

    const callbackId = uuid();
    await psql(`select draft_duck.yahoo_create_attempt('${callbackId}', 'claim-a', now() + interval '10 minutes');`);
    await expectScalar(
        `select draft_duck.yahoo_bind_attempt('${callbackId}', 'wrong', 'state-a', 'cookie-a')::int;`,
        '0',
        'Wrong claim secret cannot bind'
    );
    await expectScalar(
        `select draft_duck.yahoo_bind_attempt('${callbackId}', 'claim-a', 'state-a', 'cookie-a')::int;`,
        '1',
        'Valid callback proof binds once'
    );
    await expectScalar(
        `select coalesce(draft_duck.yahoo_consume_callback('${callbackId}', 'wrong-state', 'cookie-a')::text, 'null');`,
        'null',
        'Wrong callback state is rejected before the valid state'
    );

    const wrongCookieId = uuid();
    await psql(`select draft_duck.yahoo_create_attempt('${wrongCookieId}', 'claim-b', now() + interval '10 minutes');`);
    await psql(`select draft_duck.yahoo_bind_attempt('${wrongCookieId}', 'claim-b', 'state-b', 'cookie-b');`);
    await expectScalar(
        `select coalesce(draft_duck.yahoo_consume_callback('${wrongCookieId}', 'state-b', 'wrong-cookie')::text, 'null');`,
        'null',
        'Wrong callback cookie is rejected'
    );
    await expectScalar(
        `select status from draft_duck.yahoo_oauth_attempts where id = '${wrongCookieId}';`,
        'failed',
        'Wrong callback cookie fails the attempt'
    );

    // Hold the row lock through pg_sleep so the second independent psql connection races the same callback.
    const consumeRace = `begin;
        select coalesce(draft_duck.yahoo_consume_callback('${callbackId}', 'state-a', 'cookie-a')::text, 'null');
        select pg_sleep(0.35);
        commit;`;
    const callbackResults = await Promise.all([concurrentScalar(consumeRace), concurrentScalar(consumeRace)]);
    assert(
        callbackResults.filter((value) => value !== 'null').length === 1,
        `Callback race must consume once: ${callbackResults}`
    );
    await expectScalar(
        `select coalesce(draft_duck.yahoo_consume_callback('${callbackId}', 'state-a', 'cookie-a')::text, 'null');`,
        'null',
        'Callback replay is rejected'
    );
    await psql(
        `select draft_duck.yahoo_complete_callback('${callbackId}', 'ciphertext-a', now() + interval '1 hour');`
    );

    const claimRace = (bearer: string) => `begin;
        select draft_duck.yahoo_claim_session('${callbackId}', 'claim-a', '${bearer}', now()) || ':${bearer}';
        select pg_sleep(0.35);
        commit;`;
    const bearerA = 'bearer-race-a';
    const bearerB = 'bearer-race-b';
    const claimResults = await Promise.all([
        concurrentScalar(claimRace(bearerA)),
        concurrentScalar(claimRace(bearerB))
    ]);
    assert(
        claimResults.filter((value) => value.startsWith('complete:')).length === 1,
        `Claim race must issue one bearer: ${claimResults}`
    );
    assert(
        claimResults.filter((value) => value.startsWith('invalid:')).length === 1,
        `Losing claim must be invalid: ${claimResults}`
    );
    const winningBearer = claimResults.find((value) => value.startsWith('complete:'))!.split(':')[1]!;
    const losingBearer = winningBearer === bearerA ? bearerB : bearerA;
    await expectScalar(
        `select (draft_duck.yahoo_get_session('${winningBearer}', now())->>'token_ciphertext');`,
        'ciphertext-a',
        'Winning bearer resolves to its stored session'
    );
    await expectScalar(
        `select coalesce(draft_duck.yahoo_get_session('${losingBearer}', now())::text, 'null');`,
        'null',
        'Losing bearer cannot resolve to the session'
    );
    await expectScalar(
        `select draft_duck.yahoo_claim_session('${callbackId}', 'wrong', 'bearer-wrong', now());`,
        'invalid',
        'Wrong claim secret is rejected'
    );

    const failedId = uuid();
    await psql(`select draft_duck.yahoo_create_attempt('${failedId}', 'claim-failed', now() + interval '10 minutes');`);
    await psql(`select draft_duck.yahoo_bind_attempt('${failedId}', 'claim-failed', 'state-failed', 'cookie-failed');`);
    await psql(`select draft_duck.yahoo_consume_callback('${failedId}', 'state-failed', 'cookie-failed');`);
    await expectScalar(
        `select draft_duck.yahoo_complete_callback('${failedId}', '', null, true)::int;`,
        '1',
        'Failed callback accepts null session expiry'
    );
    await expectScalar(
        `select status from draft_duck.yahoo_oauth_attempts where id = '${failedId}';`,
        'failed',
        'Failed completion persists status'
    );
    await expectScalar(
        `select count(*) from draft_duck.yahoo_sessions where id = '${failedId}';`,
        '0',
        'Failed completion creates no session'
    );

    const expiredId = uuid();
    await psql(`insert into draft_duck.yahoo_oauth_attempts(id, claim_hash, state_hash, cookie_hash, status, expires_at)
                values ('${expiredId}', 'claim-expired', 'state-expired', 'cookie-expired', 'pending', now() - interval '1 second');`);
    await expectScalar(
        `select coalesce(draft_duck.yahoo_consume_callback('${expiredId}', 'state-expired', 'cookie-expired')::text, 'null');`,
        'null',
        'Expired callback is rejected'
    );
    await expectScalar(
        `select status from draft_duck.yahoo_oauth_attempts where id = '${expiredId}';`,
        'expired',
        'Expired callback state is persisted'
    );

    const expiredAttemptId = uuid();
    await psql(`insert into draft_duck.yahoo_oauth_attempts(id, claim_hash, status, expires_at)
                values ('${expiredAttemptId}', 'claim-old', 'complete', now() - interval '1 second');
                insert into draft_duck.yahoo_sessions(id, token_ciphertext, expires_at)
                values ('${expiredAttemptId}', 'ciphertext-old', now() + interval '1 hour');`);
    await expectScalar(
        `select draft_duck.yahoo_claim_session('${expiredAttemptId}', 'claim-old', 'bearer-old-attempt', now());`,
        'invalid',
        'Completed callback cannot be claimed after the attempt expires'
    );

    const expiredSessionId = uuid();
    await psql(`insert into draft_duck.yahoo_oauth_attempts(id, claim_hash, status, expires_at)
                values ('${expiredSessionId}', 'claim-expired-session', 'claimed', now() - interval '1 second');
                insert into draft_duck.yahoo_sessions(id, bearer_hash, token_ciphertext, expires_at)
                values ('${expiredSessionId}', 'bearer-expired-session', 'ciphertext-expired', now() - interval '1 second');`);
    await expectScalar(
        `select coalesce(draft_duck.yahoo_get_session('bearer-expired-session', now())::text, 'null');`,
        'null',
        'Expired bearer cannot read a session'
    );
    await expectScalar(
        `select draft_duck.yahoo_claim_session('${expiredSessionId}', 'claim-expired-session', 'bearer-replay', now());`,
        'invalid',
        'Expired session cannot be claimed again'
    );

    await psql(`select draft_duck.yahoo_cleanup(now() + interval '20 minutes');`);
    await expectScalar(
        `select count(*) from draft_duck.yahoo_sessions where id = '${callbackId}';`,
        '1',
        'Live claimed session survives OAuth attempt cleanup'
    );
    await expectScalar(
        `select count(*) from draft_duck.yahoo_oauth_attempts where id = '${callbackId}';`,
        '1',
        'Claimed attempt survives while its session is active'
    );
    await psql(`select draft_duck.yahoo_disconnect('${winningBearer}');`);
    await expectScalar(
        `select count(*) from draft_duck.yahoo_sessions where id = '${callbackId}';`,
        '0',
        'Disconnect revokes session'
    );
    await psql(`select draft_duck.yahoo_cleanup(now() + interval '20 minutes');`);
    await expectScalar(
        `select count(*) from draft_duck.yahoo_oauth_attempts where id = '${callbackId}';`,
        '0',
        'Cleanup removes disconnected claimed attempt'
    );

    console.log('SQL migration checks passed on an isolated PostgreSQL 17 container.');
} finally {
    if (!removeContainer()) process.exitCode = 1;
}
