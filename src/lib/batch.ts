// Loads many keys in one read: the keys asked for within a few milliseconds of each other, up to
// `max`, go to the database together (the DataLoader pattern). A build renders each worker's pages
// side by side and every post page asked for its own post, three requests a post; batched, the
// pages rendering together share one request per table (2026-10-26, docs/performance/). A lone
// request, as at run time, waits `waitMs` and goes alone. Per process; a failed read rejects every
// caller waiting on it and is not kept, so the next call reads again.
export function batchLoader<K, V>(loadMany: (keys: K[]) => Promise<Map<K, V>>, options: { max?: number; waitMs?: number } = {}) {
  const { max = 50, waitMs = 10 } = options;
  let queue: { key: K; resolve: (value: V | null) => void; reject: (error: unknown) => void }[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    const batch = queue;
    queue = [];
    if (timer) clearTimeout(timer);
    timer = null;
    loadMany([...new Set(batch.map((entry) => entry.key))]).then(
      (found) => batch.forEach((entry) => entry.resolve(found.get(entry.key) ?? null)),
      (error: unknown) => batch.forEach((entry) => entry.reject(error)),
    );
  };

  return (key: K) =>
    new Promise<V | null>((resolve, reject) => {
      queue.push({ key, resolve, reject });
      if (queue.length >= max) flush();
      else timer ??= setTimeout(flush, waitMs);
    });
}

// Splits a list for reads that name their keys in the URL (PostgREST's `in` filter), so no request
// carries more than `size` of them
export function chunks<T>(list: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, (i + 1) * size));
}
