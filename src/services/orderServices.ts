import { supabase } from '../lib/supabase';
import type { Order } from '../navigation/DriverNavigator';

export type DriverOrderStatus = 'Pending' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';

type DriverOrderRow = {
  id: string;
  order_number: string;
  booking_reference: string | null;
  type: string;
  customer_name: string;
  customer_phone: string | null;
  address: string;
  time: string | null;
  notes: string | null;
  laundromat: string | null;
  laundromat_address: string | null;
  status: string;
  created_at: string;
};

export function orderRowToDriverOrder(row: DriverOrderRow, driverName?: string): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    bookingReference: row.booking_reference ?? undefined,
    type: row.type,
    customer: row.customer_name,
    phone: row.customer_phone ?? undefined,
    address: row.address,
    time: row.time ?? '',
    status: row.status,
    driver: driverName,
    laundromat: row.laundromat ?? undefined,
    laundromatAddress: row.laundromat_address ?? undefined,
    notes: row.notes ?? undefined,
  };
}

export async function fetchDriverOrders(
  _driverId: string,
  driverName?: string
): Promise<Order[]> {
  const { data, error } = await supabase.rpc('driver_list_orders');

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: DriverOrderRow) =>
    orderRowToDriverOrder(row, driverName)
  );
}

export async function updateDriverOrderStatus(
  orderId: string,
  status: DriverOrderStatus
): Promise<void> {
  const { error } = await supabase.rpc('driver_update_order_status', {
    p_order_id: orderId,
    p_status: status,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export function subscribeToDriverOrders(
  driverId: string,
  driverName: string | undefined,
  onOrder: (order: Order) => void
): () => void {
  const channel = supabase
    .channel(`driver-orders-${driverId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'driver_assignments',
        filter: `driver_id=eq.${driverId}`,
      },
      async (payload) => {
        const row = payload.new as { order_id?: string } | undefined;
        if (!row?.order_id) return;

        const { data, error } = await supabase.rpc('driver_get_order', {
          p_order_id: row.order_id,
        });

        if (!error && data && data.length > 0) {
          onOrder(orderRowToDriverOrder(data[0] as DriverOrderRow, driverName));
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel).catch(() => undefined);
  };
}