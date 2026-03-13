import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 min default

export function get(key) {
  return cache.get(key);
}

export function set(key, value, ttl = 300) {
  cache.set(key, value, ttl);
}

export function del(key) {
  cache.del(key);
}
