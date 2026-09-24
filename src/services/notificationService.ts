import { supabase } from '../lib/supabase';

export type NotificationKind =
  | 'order_assigned'
  | 'driver_assigned'
  | 'new_message'
  | 'order_delivered'
  | 'order_updated'
  | 'order_placed'
  | 'info';

export type NotificationAudience = 'driver' | 'customer' | 'admin';

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  audience: NotificationAudience;
  recipientName: string;
  orderId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type NewNotification = Omit<AppNotification, 'id' | 'read' | 'createdAt'>;

type NotificationRow = {
  id: string;
  kind: string;
  title: string;
  body: string;
  order_id: string | null;
  read: boolean;
  created_at: string;
  recipient_role: string;
};

function rowToNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    kind: (row.kind as NotificationKind) ?? 'info',
    audience: (row.recipient_role as NotificationAudience) ?? 'info',
    recipientName: '',
    orderId: row.order_id ?? '',
    title: row.title,
    message: row.body,
    read: row.read,
    createdAt: row.created_at,
  };
}

export async function fetchNotifications(
  _audience: NotificationAudience,
  _recipientName: string
): Promise<AppNotification[]> {
  const { data, error } = await supabase.rpc('notifications_list');

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as NotificationRow[]).map(rowToNotification);
}

export async function createNotification(
  input: NewNotification
): Promise<AppNotification> {
  const { data, error } = await supabase.rpc('notifications_add', {
    p_recipient_role: input.audience,
    p_recipient_name: input.recipientName,
    p_kind: input.kind,
    p_title: input.title,
    p_body: input.message,
    p_order_id: input.orderId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as NotificationRow[];
  if (rows.length === 0) {
    throw new Error('Notification could not be created.');
  }

  return rowToNotification(rows[0]);
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.rpc('notifications_mark_read', {
    p_id: id,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function markAllNotificationsRead(
  _audience: NotificationAudience,
  _recipientName: string
): Promise<void> {
  const { error } = await supabase.rpc('notifications_mark_all_read');

  if (error) {
    throw new Error(error.message);
  }
}