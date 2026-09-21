// Shown in the SPA shell and while a client-only route such as /draft hydrates.
export function PendingFallback() {
    return (
        <main className='mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10 md:max-w-2xl'>
            <p className='mb-0'>Loading…</p>
        </main>
    );
}
