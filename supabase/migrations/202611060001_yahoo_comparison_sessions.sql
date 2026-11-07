begin;

revoke all on schema draft_duck from public, anon, authenticated;
grant usage on schema draft_duck to service_role;

create table if not exists draft_duck.yahoo_oauth_attempts (
    id uuid primary key,
    claim_hash text not null,
    state_hash text,
    cookie_hash text,
    status text not null check (status in ('pending','consuming','complete','failed','claimed','expired')),
    expires_at timestamptz not null,
    created_at timestamptz not null default now(),
    claimed_at timestamptz
);

create table if not exists draft_duck.yahoo_sessions (
    id uuid primary key references draft_duck.yahoo_oauth_attempts(id) on delete cascade,
    bearer_hash text unique,
    token_ciphertext text not null,
    expires_at timestamptz not null,
    created_at timestamptz not null default now()
);

alter table draft_duck.yahoo_oauth_attempts enable row level security;
alter table draft_duck.yahoo_sessions enable row level security;
revoke all on draft_duck.yahoo_oauth_attempts, draft_duck.yahoo_sessions from public, anon, authenticated;
grant all on draft_duck.yahoo_oauth_attempts, draft_duck.yahoo_sessions to service_role;

create or replace function draft_duck.yahoo_create_attempt(p_id uuid, p_claim_hash text, p_expires_at timestamptz)
returns void language sql security definer set search_path = pg_catalog, draft_duck as $$
    insert into draft_duck.yahoo_oauth_attempts(id, claim_hash, status, expires_at)
    values (p_id, p_claim_hash, 'pending', p_expires_at);
$$;

create or replace function draft_duck.yahoo_bind_attempt(p_id uuid, p_claim_hash text, p_state_hash text, p_cookie_hash text)
returns boolean language plpgsql security definer set search_path = pg_catalog, draft_duck as $$
declare changed integer;
begin
    update draft_duck.yahoo_oauth_attempts set state_hash = p_state_hash, cookie_hash = p_cookie_hash
     where id = p_id and claim_hash = p_claim_hash and status = 'pending' and state_hash is null and expires_at > now();
    get diagnostics changed = row_count;
    return changed = 1;
end $$;

create or replace function draft_duck.yahoo_consume_callback(p_id uuid, p_state_hash text, p_cookie_hash text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, draft_duck as $$
declare a draft_duck.yahoo_oauth_attempts%rowtype;
begin
    -- Lock and change the attempt in one transaction so an OAuth state cannot be replayed.
    select * into a from draft_duck.yahoo_oauth_attempts where id = p_id for update;
    if not found or a.status <> 'pending' or a.state_hash is null or a.state_hash <> p_state_hash then return null; end if;
    if a.expires_at <= now() then update draft_duck.yahoo_oauth_attempts set status = 'expired' where id = p_id; return null; end if;
    if a.cookie_hash <> p_cookie_hash then update draft_duck.yahoo_oauth_attempts set status = 'failed' where id = p_id; return null; end if;
    update draft_duck.yahoo_oauth_attempts set status = 'consuming' where id = p_id;
    return jsonb_build_object('id', a.id, 'claim_hash', a.claim_hash, 'expires_at', a.expires_at);
end $$;

create or replace function draft_duck.yahoo_complete_callback(p_id uuid, p_token_ciphertext text, p_session_expires_at timestamptz, p_failure boolean default false)
returns boolean language plpgsql security definer set search_path = pg_catalog, draft_duck as $$
declare changed integer;
begin
    update draft_duck.yahoo_oauth_attempts set status = case when p_failure then 'failed' else 'complete' end
     where id = p_id and status = 'consuming' and expires_at > now();
    get diagnostics changed = row_count;
    if changed <> 1 then return false; end if;
    if not p_failure then
        insert into draft_duck.yahoo_sessions(id, token_ciphertext, expires_at)
        values (p_id, p_token_ciphertext, p_session_expires_at);
    end if;
    return true;
end $$;

create or replace function draft_duck.yahoo_claim_session(p_id uuid, p_claim_hash text, p_bearer_hash text, p_now timestamptz)
returns text language plpgsql security definer set search_path = pg_catalog, draft_duck as $$
declare a draft_duck.yahoo_oauth_attempts%rowtype; changed integer;
begin
    select * into a from draft_duck.yahoo_oauth_attempts where id = p_id for update;
    if not found or a.claim_hash <> p_claim_hash then return 'invalid'; end if;
    if a.status <> 'claimed' and a.expires_at <= p_now then
        update draft_duck.yahoo_oauth_attempts set status = 'expired' where id = p_id and status not in ('failed','expired');
        return 'invalid';
    end if;
    if a.status = 'pending' or a.status = 'consuming' then return 'pending'; end if;
    if a.status <> 'complete' then return 'invalid'; end if;
    update draft_duck.yahoo_sessions set bearer_hash = p_bearer_hash
     where id = p_id and bearer_hash is null and expires_at > p_now;
    get diagnostics changed = row_count;
    if changed <> 1 then return 'invalid'; end if;
    update draft_duck.yahoo_oauth_attempts set status = 'claimed', claimed_at = p_now where id = p_id and status = 'complete';
    get diagnostics changed = row_count;
    if changed <> 1 then raise exception 'claim raced'; end if;
    return 'complete';
end $$;

create or replace function draft_duck.yahoo_get_session(p_bearer_hash text, p_now timestamptz)
returns jsonb language sql security definer set search_path = pg_catalog, draft_duck as $$
    select jsonb_build_object('id', id, 'token_ciphertext', token_ciphertext, 'expires_at', expires_at)
    from draft_duck.yahoo_sessions where bearer_hash = p_bearer_hash and expires_at > p_now limit 1;
$$;

create or replace function draft_duck.yahoo_disconnect(p_bearer_hash text)
returns void language sql security definer set search_path = pg_catalog, draft_duck as $$
    delete from draft_duck.yahoo_sessions where bearer_hash = p_bearer_hash;
$$;

create or replace function draft_duck.yahoo_cleanup(p_now timestamptz)
returns void language sql security definer set search_path = pg_catalog, draft_duck as $$
    -- A claimed session outlives the ten-minute OAuth attempt; delete only after session expiry.
    delete from draft_duck.yahoo_sessions where expires_at <= p_now;
    delete from draft_duck.yahoo_oauth_attempts where expires_at <= p_now and status in ('pending','consuming','failed','expired');
    delete from draft_duck.yahoo_oauth_attempts a
     where a.status in ('complete','claimed') and not exists (select 1 from draft_duck.yahoo_sessions s where s.id = a.id);
$$;

revoke all on function draft_duck.yahoo_create_attempt(uuid,text,timestamptz), draft_duck.yahoo_bind_attempt(uuid,text,text,text),
    draft_duck.yahoo_consume_callback(uuid,text,text), draft_duck.yahoo_complete_callback(uuid,text,timestamptz,boolean),
    draft_duck.yahoo_claim_session(uuid,text,text,timestamptz), draft_duck.yahoo_get_session(text,timestamptz),
    draft_duck.yahoo_disconnect(text), draft_duck.yahoo_cleanup(timestamptz) from public, anon, authenticated;
grant execute on function draft_duck.yahoo_create_attempt(uuid,text,timestamptz), draft_duck.yahoo_bind_attempt(uuid,text,text,text),
    draft_duck.yahoo_consume_callback(uuid,text,text), draft_duck.yahoo_complete_callback(uuid,text,timestamptz,boolean),
    draft_duck.yahoo_claim_session(uuid,text,text,timestamptz), draft_duck.yahoo_get_session(text,timestamptz),
    draft_duck.yahoo_disconnect(text), draft_duck.yahoo_cleanup(timestamptz) to service_role;
commit;
