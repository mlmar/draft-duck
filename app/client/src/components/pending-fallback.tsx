import { PageShell } from '@/components/page-shell';

// Shown in the SPA shell and while a client-only route such as /draft hydrates.
export function PendingFallback() {
    return (
        <PageShell className='justify-center'>
            <p className='mb-0'>Loading…</p>
        </PageShell>
    );
}
