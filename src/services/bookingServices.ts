import { supabase } from '../lib/supabase';
import type { CustomerOrder, OrderStatus } from '../data/orders';

export type BookingPlacement = {
  userId: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  pickupWindow: string;
  deliveryAddress: string;
  deliveryWindow: string;
  instructions: string;
  laundromat?: string;
  laundromatAddress?: string;
  bagCount: number;
  total: number;
  paymentMethod: string;
  items?: { name: string; quantity: number; price: number }[];
};

export async function placeBooking(
  booking: BookingPlacement
): Promise<{ pickupLegId: string; deliveryLegId: string }> {
  const items = (booking.items ?? []).map((item) => ({
    name: item.name,
    quantity: item.quantity,
    price: item.price,
  }));

  const { data, error } = await supabase.rpc('create_booking', {
    p_reference: booking.reference,
    p_customer_name: booking.customerName,
    p_customer_phone: booking.customerPhone,
    p_pickup_address: booking.pickupAddress,
    p_pickup_window: booking.pickupWindow,
    p_delivery_address: booking.deliveryAddress,
    p_delivery_window: booking.deliveryWindow,
    p_instructions: booking.instructions,
    p_laundromat: booking.laundromat ?? null,
    p_laundromat_address: booking.laundromatAddress ?? null,
    p_bag_count: booking.bagCount,
    p_total: booking.total,
    p_payment_method: booking.paymentMethod,
    p_items: items,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as {
    pickup_leg_id?: string;
    delivery_leg_id?: string;
  }[];

  return {
    pickupLegId: rows[0]?.pickup_leg_id ?? '',
    deliveryLegId: rows[0]?.delivery_leg_id ?? '',
  };
}

export async function cancelCustomerBooking(
  reference: string
): Promise<void> {
  const { error } = await supabase.rpc('customer_cancel_booking', {
    p_booking_reference: reference,
  });

  if (error) {
    throw new Error(error.message);
  }
}

type CustomerLegRow = {
  id: string;
  order_number: string;
  booking_reference: string | null;
  type: string;
  address: string;
  time: string | null;
  notes: string | null;
  laundromat: string | null;
  laundromat_address: string | null;
  bag_count: number | null;
  total: number | null;
  payment_method: string | null;
  status: string;
  created_at: string;
  assigned_driver_name: string | null;
  assigned_driver_phone: string | null;
};

function customerStatus(
  pickup: CustomerLegRow,
  delivery?: CustomerLegRow
): OrderStatus {
  const cancelled =
    pickup.status === 'Cancelled' || delivery?.status === 'Cancelled';
  if (cancelled) return 'Cancelled';
  if (delivery?.status === 'Completed') return 'Delivered';
  if (pickup.status === 'Completed') return 'At Laundromat';
  return 'Scheduled';
}

function legsToCustomerOrder(legs: CustomerLegRow[]): CustomerOrder {
  const pickup = legs.find((l) => l.type === 'Pickup') ?? legs[0];
  const delivery = legs.find((l) => l.type === 'Delivery');
  const created =
    pickup?.created_at ?? delivery?.created_at ?? legs[0]?.created_at ?? '';
  const placedAt = created
    ? new Date(created).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return {
    id: pickup.id,
    reference: pickup.booking_reference ?? pickup.id,
    service: 'Pickup & Drop Off',
    status: customerStatus(pickup, delivery),
    placedAt,
    pickupAddress: pickup.address ?? '',
    deliveryAddress: delivery?.address ?? pickup.laundromat_address ?? '',
    pickupWindow: pickup.time ?? '',
    deliveryWindow: delivery?.time ?? '',
    driver: pickup.assigned_driver_name || delivery?.assigned_driver_name || undefined,
    driverPhone: pickup.assigned_driver_phone || delivery?.assigned_driver_phone || undefined,
    items: [
      {
        name: `${pickup.bag_count ?? 0} ${(pickup.bag_count ?? 0) === 1 ? 'Bag' : 'Bags'}`,
        quantity: 1,
        price: Number(pickup.total ?? 0),
      },
    ],
    deliveryFee: 0,
    total: Number(pickup.total ?? 0),
    paymentMethod: pickup.payment_method ?? 'Card',
    instructions: pickup.notes ?? '',
    laundromat: pickup.laundromat ?? undefined,
    laundromatAddress: pickup.laundromat_address ?? undefined,
  };
}

export async function fetchCustomerBookings(
  userId: string
): Promise<CustomerOrder[]> {
  if (!userId) return [];

  const { data, error } = await supabase.rpc('customer_list_orders');

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as CustomerLegRow[];

  const groups = new Map<string, CustomerLegRow[]>();
  const singles: CustomerLegRow[] = [];
  for (const row of rows) {
    if (row.booking_reference) {
      const list = groups.get(row.booking_reference) ?? [];
      list.push(row);
      groups.set(row.booking_reference, list);
    } else {
      singles.push(row);
    }
  }

  const orders: CustomerOrder[] = [];
  for (const legs of groups.values()) {
    orders.push(legsToCustomerOrder(legs));
  }
  for (const leg of singles) {
    orders.push(legsToCustomerOrder([leg]));
  }

  return orders;
}