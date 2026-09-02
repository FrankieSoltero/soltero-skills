import * as cache from '../store/cache.js';

export async function listOrders(db, customerId) {
  const key = `orders:${customerId}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rows = await db.query('select * from orders where customer_id = $1', [customerId]);
  cache.put(key, rows);
  return rows;
}

export async function cancelOrder(db, customerId, orderId) {
  await db.query('update orders set status = $1 where id = $2', ['cancelled', orderId]);
  return { ok: true };
}

export async function reorder(db, customerId, orderId) {
  const created = await db.query('insert into orders (customer_id) values ($1) returning *', [customerId]);
  cache.invalidate(`orders:${customerId}`);
  return created;
}
