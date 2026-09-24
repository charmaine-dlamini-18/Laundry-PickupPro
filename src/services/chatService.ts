import { supabase } from '../lib/supabase';

export type ChatRole = 'customer' | 'driver' | 'admin';

export type ChatMessage = {
  id: string;
  orderId: string;
  text: string;
  senderRole: ChatRole;
  senderName: string;
  timestamp: number;
};

export type NewChatMessage = Omit<ChatMessage, 'id' | 'timestamp'>;

type MessageRow = {
  id: string;
  booking_reference: string;
  sender_id: string | null;
  sender_role: ChatRole;
  sender_name: string;
  body: string;
  created_at: string;
};

function rowToMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    orderId: row.booking_reference,
    text: row.body,
    senderRole: row.sender_role,
    senderName: row.sender_name,
    timestamp: new Date(row.created_at).getTime(),
  };
}

export async function fetchChatMessages(
  bookingReference: string
): Promise<ChatMessage[]> {
  if (!bookingReference) return [];

  const { data, error } = await supabase.rpc('chat_list_messages', {
    p_booking_reference: bookingReference,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: MessageRow) => rowToMessage(row));
}

export async function createChatMessage(
  input: NewChatMessage
): Promise<ChatMessage> {
  const { data, error } = await supabase.rpc('chat_send_message', {
    p_booking_reference: input.orderId,
    p_body: input.text,
    p_sender_role: input.senderRole,
    p_sender_name: input.senderName,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as MessageRow[];
  if (rows.length === 0) {
    throw new Error('Message was not saved.');
  }

  return rowToMessage(rows[0]);
}

export function subscribeToOrderMessages(
  bookingReference: string,
  onNewMessage: (message: ChatMessage) => void
): () => void {
  if (!bookingReference) return () => undefined;

  const seen = new Set<string>();

  const tick = async () => {
    try {
      const fresh = await fetchChatMessages(bookingReference);
      for (const message of fresh) {
        if (!seen.has(message.id)) {
          seen.add(message.id);
          onNewMessage(message);
        }
      }
    } catch {
      // keep polling; a later tick will reconcile
    }
  };

  tick();
  const handle = setInterval(tick, 3000);

  return () => clearInterval(handle);
}