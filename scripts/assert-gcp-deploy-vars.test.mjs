import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assertGcpDeployVars } from './assert-gcp-deploy-vars.mjs';

const ok = {
    GCP_PROJECT_ID: 'my-project',
    GCP_REGION: 'us-central1',
    GCP_AR_REPOSITORY: 'draft-duck',
    CLOUD_RUN_SERVICE: 'draft-duck-api',
    WIF_PROVIDER: 'projects/123/locations/global/workloadIdentityPools/github/providers/github',
    WIF_SERVICE_ACCOUNT: 'github-deployer@my-project.iam.gserviceaccount.com'
};

describe('assertGcpDeployVars', () => {
    it('returns the Artifact Registry host', () => {
        assert.deepEqual(assertGcpDeployVars(ok), {
            projectId: 'my-project',
            region: 'us-central1',
            registryHost: 'us-central1-docker.pkg.dev'
        });
    });

    it('rejects a missing REGION so configure-docker never sees -docker.pkg.dev', () => {
        assert.throws(() => assertGcpDeployVars({ ...ok, GCP_REGION: '' }), /GCP_REGION/);
        assert.throws(() => assertGcpDeployVars({ ...ok, GCP_REGION: undefined }), /GCP_REGION/);
    });

    it('rejects a REGION that would parse as a gcloud flag', () => {
        assert.throws(() => assertGcpDeployVars({ ...ok, GCP_REGION: '-docker.pkg.dev' }), /us-central1/);
    });
});
