import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  createChatMessage,
  fetchChatMessages,
  subscribeToOrderMessages,
  type ChatMessage,
  type ChatRole,
} from '../services/chatService';

export type { ChatMessage, ChatRole } from '../services/chatService';

type ChatContextValue = {
  messages: Record<string, ChatMessage[]>;
  getMessages: (orderId: string) => ChatMessage[];
  loadMessages: (orderId: string) => (() => void) | undefined;
  sendMessage: (orderId: string, text: string, senderRole: ChatRole, senderName: string) => void;
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [loadedOrders, setLoadedOrders] = useState<string[]>([]);

  const loadMessages = useCallback((orderId: string) => {
    if (!orderId) return undefined;

    if (!loadedOrders.includes(orderId)) {
      setLoadedOrders((prev) => [...prev, orderId]);

      fetchChatMessages(orderId)
        .then((records) => {
          if (records.length > 0) {
            setMessages((prev) => ({
              ...prev,
              [orderId]: records,
            }));
          }
        })
        .catch(() => undefined);
    }

    const unsubscribe = subscribeToOrderMessages(orderId, (incoming) => {
      setMessages((prev) => {
        const existing = prev[orderId] ?? [];
        if (existing.some((message) => message.id === incoming.id)) {
          return prev;
        }
        return { ...prev, [orderId]: [...existing, incoming] };
      });
    });

    return unsubscribe;
  }, [loadedOrders]);

  const getMessages = useCallback(
    (orderId: string) => messages[orderId] ?? [],
    [messages]
  );

  const sendMessage = useCallback(
    async (orderId: string, text: string, senderRole: ChatRole, senderName: string) => {
      try {
        const record = await createChatMessage({ orderId, text, senderRole, senderName });
        setMessages((prev) => ({
          ...prev,
          [orderId]: [...(prev[orderId] ?? []), record],
        }));
      } catch {
        // Message could not be persisted; drop silently to keep UI responsive.
      }
    },
    []
  );

  const value = useMemo<ChatContextValue>(
    () => ({ messages, getMessages, loadMessages, sendMessage }),
    [messages, getMessages, loadMessages, sendMessage]
  );

  return (
    <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
  );
}

export function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
