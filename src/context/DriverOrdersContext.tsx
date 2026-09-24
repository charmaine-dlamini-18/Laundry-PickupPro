import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { Order } from '../navigation/DriverNavigator';
import { useAuth } from '../hooks/useAuth';
import {
  fetchDriverOrders,
  subscribeToDriverOrders,
  updateDriverOrderStatus as persistOrderStatus,
  type DriverOrderStatus,
} from '../services/orderServices';

type DriverOrdersContextValue = {
  orders: Order[];
  loading: boolean;
  refresh: () => Promise<void>;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderNumber: string, status: Order['status']) => void;
  getOrder: (orderNumber: string) => Order | undefined;
};

const DriverOrdersContext =
  createContext<DriverOrdersContextValue | undefined>(undefined);

export function DriverOrdersProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const driverId = user?.role === 'driver' ? user.id : null;
  const driverName = user?.role === 'driver' ? user.name : undefined;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const ordersRef = useRef<Order[]>([]);

  const updateOrders = useCallback(
    (updater: (prev: Order[]) => Order[]) => {
      setOrders((prev) => {
        const next = updater(prev);
        ordersRef.current = next;
        return next;
      });
    },
    []
  );

  const refresh = useCallback(async () => {
    if (!driverId) {
      updateOrders(() => []);
      return;
    }

    setLoading(true);
    try {
      const records = await fetchDriverOrders(driverId, driverName);
      updateOrders(() => records);
    } catch {
      // keep current list; a later refresh or realtime event will reconcile
    } finally {
      setLoading(false);
    }
  }, [driverId, driverName, updateOrders]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!driverId) {
      return undefined;
    }

    const handle = setInterval(() => {
      refresh().catch(() => undefined);
    }, 5000);
    return () => clearInterval(handle);
  }, [driverId, refresh]);

  useEffect(() => {
    if (!driverId) {
      return undefined;
    }

    return subscribeToDriverOrders(driverId, driverName, (order) => {
      updateOrders((current) => {
        const exists = current.some((o) => o.id === order.id);
        return exists
          ? current.map((o) => (o.id === order.id ? order : o))
          : [order, ...current];
      });
    });
  }, [driverId, driverName, updateOrders]);

  const addOrder = useCallback(
    (order: Order) => {
      updateOrders((prev) => [
        order,
        ...prev.filter((o) => o.orderNumber !== order.orderNumber),
      ]);
    },
    [updateOrders]
  );

  const updateOrderStatus = useCallback(
    (orderNumber: string, status: Order['status']) => {
      const existing = ordersRef.current.find(
        (o) => o.orderNumber === orderNumber
      );
      if (!existing) {
        return;
      }

      const previousStatus = existing.status;
      updateOrders((prev) =>
        prev.map((order) =>
          order.orderNumber === orderNumber ? { ...order, status } : order
        )
      );

      persistOrderStatus(existing.id, status as DriverOrderStatus).catch(
        () => {
          updateOrders((prev) =>
            prev.map((order) =>
              order.orderNumber === orderNumber
                ? { ...order, status: previousStatus }
                : order
            )
          );
        }
      );
    },
    [updateOrders]
  );

  const getOrder = useCallback(
    (orderNumber: string) =>
      ordersRef.current.find((order) => order.orderNumber === orderNumber),
    []
  );

  const value = useMemo<DriverOrdersContextValue>(
    () => ({
      orders,
      loading,
      refresh,
      addOrder,
      updateOrderStatus,
      getOrder,
    }),
    [orders, loading, refresh, addOrder, updateOrderStatus, getOrder]
  );

  return (
    <DriverOrdersContext.Provider value={value}>
      {children}
    </DriverOrdersContext.Provider>
  );
}

export function useDriverOrders(): DriverOrdersContextValue {
  const context = useContext(DriverOrdersContext);
  if (context === undefined) {
    throw new Error(
      'useDriverOrders must be used within a DriverOrdersProvider'
    );
  }
  return context;
}