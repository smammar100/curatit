// One read at a time per process: calls made while a read is on its way wait for it instead of
// starting their own, and the next call after it settles reads again. A build renders pages side by
// side in each worker, and until the first read lands in Next's data cache every one of them misses
// it; this keeps that to one read per worker (2026-10-25: 29 reads of every analysis in one cold
// build without it, and one of them hit the database's statement timeout)
export function shareInFlight<T>(read: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | null = null;
  return () =>
    (pending ??= read().finally(() => {
      pending = null;
    }));
}
