import { supabase } from '../lib/supabase';
import type {
  AdminOrder,
  AdminOrderStatus,
} from '../context/AdminContext';

export type DriverOrderRow = {
  id: string;
  order_number: string;
  booking_reference: string | null;
  type: string;
  customer_name: string;
  customer_phone: string | null;
  customer_id: string | null;
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
  assigned_driver_id: string | null;
  assigned_driver_name: string | null;
};

export type AdminPaymentRow = {
  id: string;
  booking_reference: string;
  customer_id: string | null;
  customer_name: string;
  amount: number;
  method: string;
  status: string;
  reference: string | null;
  paid_at: string;
};

export type AdminCustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  total_orders: number;
  created_at: string;
};

export type AdminDriverRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  vehicle: string;
  registration: string;
  area: string;
  created_at: string;
};

export type AdminReviewRow = {
  id: string;
  booking_reference: string | null;
  customer_id: string | null;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

export async function listAdminPayments(): Promise<AdminPaymentRow[]> {
  const { data, error } = await supabase.rpc('admin_list_payments');

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AdminPaymentRow[];
}

export async function listAdminCustomers(): Promise<AdminCustomerRow[]> {
  const { data, error } = await supabase.rpc('admin_list_customers');

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AdminCustomerRow[];
}

export async function listAdminDrivers(): Promise<AdminDriverRow[]> {
  const { data, error } = await supabase.rpc('admin_list_drivers');

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AdminDriverRow[];
}

export async function listAdminReviews(): Promise<AdminReviewRow[]> {
  const { data, error } = await supabase.rpc('admin_list_reviews');

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AdminReviewRow[];
}

export async function addCustomerReview(
  bookingReference: string,
  rating: number,
  comment: string
): Promise<void> {
  const { error } = await supabase.rpc('customer_add_review', {
    p_booking_reference: bookingReference,
    p_rating: rating,
    p_comment: comment,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function listDriverOrders(): Promise<DriverOrderRow[]> {
  const { data, error } = await supabase.rpc('admin_list_orders');

  if (error) {
    throw new Error(
      `Admin orders are not reachable. Run the updated database.sql and try again. (${error.message})`
    );
  }

  return (data ?? []) as DriverOrderRow[];
}

export async function assignDriverToBooking(
  bookingReference: string,
  driverId: string
): Promise<void> {
  const { error } = await supabase.rpc('admin_assign_driver', {
    p_booking_reference: bookingReference,
    p_driver_id: driverId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateBookingStatus(
  bookingReference: string,
  status: string
): Promise<void> {
  const { error } = await supabase.rpc('admin_update_order_status', {
    p_booking_reference: bookingReference,
    p_status: status,
  });

  if (error) {
    throw new Error(error.message);
  }
}

type PaymentMethod = 'Card' | 'EFT' | 'Cash';

function splitWindow(
  win?: string | null
): { date: string; time: string } {
  if (!win) return { date: '', time: '' };
  const [date, ...rest] = win.split(' · ');
  return { date: date ?? '', time: rest.join(' · ') };
}

function legsToAdminOrder(legs: DriverOrderRow[]): AdminOrder {
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
  const driverName =
    pickup?.assigned_driver_name || delivery?.assigned_driver_name || '';
  const allCompleted =
    legs.length > 0 && legs.every((l) => l.status === 'Completed');
  const status: AdminOrderStatus = allCompleted
    ? 'Completed'
    : driverName
      ? 'In Progress'
      : 'Pending';
  const pickupWin = splitWindow(pickup?.time);
  const deliveryWin = splitWindow(delivery?.time);
  const bagCount = pickup?.bag_count ?? delivery?.bag_count ?? 0;
  const total = Number(pickup?.total ?? delivery?.total ?? 0);
  const rawPayment = pickup?.payment_method || delivery?.payment_method || 'Card';
  const paymentMethod: PaymentMethod =
    rawPayment === 'EFT' || rawPayment === 'Cash' || rawPayment === 'Card'
      ? rawPayment
      : 'Card';
  const reference = pickup?.booking_reference ?? '';
  const items =
    bagCount > 0
      ? [
          {
            name: `${bagCount} ${bagCount === 1 ? 'Bag' : 'Bags'}`,
            quantity: 1,
            price: total,
          },
        ]
      : [];

  return {
    id: reference ? `ord-${reference}` : pickup.id,
    customerName: pickup?.customer_name ?? delivery?.customer_name ?? '',
    customerPhone: pickup?.customer_phone ?? delivery?.customer_phone ?? '',
    pickupAddress: pickup?.address ?? '',
    deliveryAddress:
      delivery?.address ?? pickup?.laundromat_address ?? '',
    pickupDate: pickupWin.date,
    pickupTime: pickupWin.time || pickup?.time || deliveryWin.time || '',
    driver: driverName,
    driverPhone: '',
    status,
    placedAt,
    placedAtISO: created,
    items,
    deliveryFee: 0,
    paymentMethod,
    instructions: pickup?.notes ?? '',
    laundromat: pickup?.laundromat ?? undefined,
    laundromatAddress: pickup?.laundromat_address ?? undefined,
    bookingReference: reference || undefined,
  };
}

export function rowsToAdminOrders(rows: DriverOrderRow[]): AdminOrder[] {
  const groups = new Map<string, DriverOrderRow[]>();
  const singles: DriverOrderRow[] = [];

  for (const row of rows) {
    if (row.booking_reference) {
      const list = groups.get(row.booking_reference) ?? [];
      list.push(row);
      groups.set(row.booking_reference, list);
    } else {
      singles.push(row);
    }
  }

  const orders: AdminOrder[] = [];
  for (const legs of groups.values()) {
    orders.push(legsToAdminOrder(legs));
  }
  for (const row of singles) {
    orders.push(legsToAdminOrder([row]));
  }

  return orders;
}