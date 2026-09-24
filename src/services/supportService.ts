import { supabase } from '../lib/supabase';
import type { Role } from '../types';

export type SupportMessageStatus = 'Open' | 'Resolved';

export type SupportMessage = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  message: string;
  createdAt: string;
  status: SupportMessageStatus;
};

export type SupportMessageInput = Omit<SupportMessage, 'id' | 'createdAt' | 'status'>;

type SupportRow = {
  id: string;
  user_id: string | null;
  sender_name: string;
  sender_email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
};

function rowToSupportMessage(row: SupportRow): SupportMessage {
  return {
    id: row.id,
    customerId: row.user_id ?? '',
    customerName: row.sender_name,
    customerEmail: row.sender_email,
    subject: row.subject,
    message: row.message,
    createdAt: row.created_at,
    status: row.status === 'Resolved' ? 'Resolved' : 'Open',
  };
}

export async function fetchSupportMessages(role: Role | null): Promise<SupportMessage[]> {
  const { data, error } = role === 'admin'
    ? await supabase.rpc('admin_list_support_messages')
    : await supabase.rpc('customer_list_support_messages');

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as SupportRow[]).map(rowToSupportMessage);
}

export async function createSupportMessage(
  input: SupportMessageInput
): Promise<SupportMessage> {
  if (!input.customerId.trim()) {
    throw new Error('Support messages can only be sent by registered customers.');
  }

  const { data, error } = await supabase.rpc('add_support_message', {
    p_subject: input.subject,
    p_message: input.message,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as SupportRow[];
  if (rows.length === 0) {
    throw new Error('Support message could not be created.');
  }

  return rowToSupportMessage(rows[0]);
}

export async function updateSupportMessageStatus(
  id: string,
  status: SupportMessageStatus
): Promise<SupportMessage | null> {
  const { data, error } = await supabase.rpc('admin_update_support_status', {
    p_id: id,
    p_status: status,
  });

  if (error) {
    throw new Error(error.message);
  }

  return null;
}

export async function deleteSupportMessage(id: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('admin_delete_support_message', {
    p_id: id,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data === true;
}