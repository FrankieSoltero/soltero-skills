import * as cache from '../store/cache.js';

export async function getProfile(db, customerId) {
  const key = `profile:${customerId}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const row = await db.query('select * from profiles where customer_id = $1', [customerId]);
  cache.put(key, row);
  return row;
}

export async function updateEmail(db, customerId, email) {
  await db.query('update profiles set email = $1 where customer_id = $2', [email, customerId]);
  // The revalidation worker picks this up within 30s.
  return { ok: true };
}
