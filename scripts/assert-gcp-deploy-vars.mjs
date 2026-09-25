// Fail the API deploy before gcloud sees an empty REGION as `-docker.pkg.dev`.
// Those vars are Actions Variables, not secrets.

import { pathToFileURL } from 'node:url';

const REQUIRED = [
    ['GCP_PROJECT_ID', 'GCP project id'],
    ['GCP_REGION', 'Artifact Registry / Cloud Run region (e.g. us-central1)'],
    ['GCP_AR_REPOSITORY', 'Artifact Registry Docker repo id'],
    ['CLOUD_RUN_SERVICE', 'Cloud Run service name (e.g. draft-duck-api)'],
    ['WIF_PROVIDER', 'WIF provider resource name'],
    ['WIF_SERVICE_ACCOUNT', 'github-deployer service account email']
];

const REGION_RE = /^[a-z]+-[a-z]+\d+$/;

export function assertGcpDeployVars(env) {
    const missing = [];
    for (const [name, hint] of REQUIRED) {
        const value = typeof env[name] === 'string' ? env[name].trim() : '';
        if (!value) missing.push(`${name} (${hint})`);
    }
    if (missing.length) {
        throw new Error(
            `Set these repository variables (Settings → Secrets and variables → Actions → Variables), not secrets:\n- ${missing.join('\n- ')}`
        );
    }

    const region = env.GCP_REGION.trim();
    if (region.startsWith('-') || !REGION_RE.test(region)) {
        throw new Error(
            `GCP_REGION must be a region like us-central1, got ${JSON.stringify(env.GCP_REGION)}. Empty REGION makes configure-docker see -docker.pkg.dev as a flag.`
        );
    }

    return {
        projectId: env.GCP_PROJECT_ID.trim(),
        region,
        registryHost: `${region}-docker.pkg.dev`
    };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const checked = assertGcpDeployVars(process.env);
    console.log(`Artifact Registry host: ${checked.registryHost}`);
}
