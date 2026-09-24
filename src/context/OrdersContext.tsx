import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { CustomerOrder, OrderStatus } from '../data/orders';
import { useAuth } from '../hooks/useAuth';
import { fetchCustomerBookings } from '../services/bookingServices';

type OrdersContextValue = {
  orders: CustomerOrder[];
  loading: boolean;
  refresh: () => Promise<void>;
  addOrder: (order: CustomerOrder) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  getOrder: (id: string) => CustomerOrder | undefined;
};

const OrdersContext = createContext<OrdersContextValue | undefined>(undefined);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (user?.role === 'customer' && user.id) {
      setLoading(true);
      try {
        const records = await fetchCustomerBookings(user.id);
        setOrders(records);
      } catch {
        // keep the current list on failure
      } finally {
        setLoading(false);
      }
    } else {
      setOrders([]);
      setLoading(false);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (user?.role !== 'customer') return;
    const handle = setInterval(() => {
      refresh().catch(() => undefined);
    }, 5000);
    return () => clearInterval(handle);
  }, [refresh, user?.role]);

  const addOrder = useCallback((order: CustomerOrder) => {
    setOrders((prev) => [order, ...prev]);
  }, []);

  const updateOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, status } : order))
    );
  }, []);

  const getOrder = useCallback(
    (id: string) => orders.find((order) => order.id === id),
    [orders]
  );

  const value = useMemo<OrdersContextValue>(
    () => ({ orders, loading, refresh, addOrder, updateOrderStatus, getOrder }),
    [orders, loading, refresh, addOrder, updateOrderStatus, getOrder]
  );

  return (
    <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
  );
}

export function useOrders(): OrdersContextValue {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
}