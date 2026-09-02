import { useEffect, useState } from 'react';

export function OrderList({ customerId, api }) {
  const [orders, setOrders] = useState([]);
  useEffect(() => { api.listOrders(customerId).then(setOrders); }, [customerId]);

  async function onCancel(id) {
    await api.cancelOrder(customerId, id);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'cancelled' } : o)));
  }

  return orders.map((o) => ({ id: o.id, status: o.status, onCancel }));
}
