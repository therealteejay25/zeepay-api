const idempotencyCache = new Map<string, any>();

export function checkIdempotency(key: string): any {
  return idempotencyCache.get(key);
}

export function setIdempotency(key: string, result: any, ttl: number = 3600000): void {
  idempotencyCache.set(key, result);
  setTimeout(() => idempotencyCache.delete(key), ttl);
}
