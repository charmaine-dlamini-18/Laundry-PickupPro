import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  createSupportMessage,
  deleteSupportMessage,
  fetchSupportMessages,
  updateSupportMessageStatus,
  type SupportMessage,
  type SupportMessageStatus,
} from '../services/supportService';
import { useAuth } from '../hooks/useAuth';

export type { SupportMessage, SupportMessageStatus } from '../services/supportService';

export type NewSupportMessage = {
  customerId: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  message: string;
};

type SupportContextValue = {
  messages: SupportMessage[];
  loading: boolean;
  addMessage: (input: NewSupportMessage) => Promise<void>;
  updateMessageStatus: (id: string, status: SupportMessageStatus) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
};

const SupportContext = createContext<SupportContextValue | undefined>(
  undefined
);

export function SupportProvider({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchSupportMessages(role)
      .then((records) => {
        if (active) setMessages(records);
      })
      .catch(() => {
        if (active) setMessages([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [role]);

  const addMessage = useCallback(async (input: NewSupportMessage) => {
    const record = await createSupportMessage(input);
    setMessages((prev) => [record, ...prev]);
  }, []);

  const updateMessageStatus = useCallback(
    async (id: string, status: SupportMessageStatus) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === id ? { ...message, status } : message
        )
      );
      await updateSupportMessageStatus(id, status);
    },
    []
  );

  const deleteMessage = useCallback(async (id: string) => {
    setMessages((prev) => prev.filter((message) => message.id !== id));
    await deleteSupportMessage(id);
  }, []);

  const value = useMemo<SupportContextValue>(
    () => ({
      messages,
      loading,
      addMessage,
      updateMessageStatus,
      deleteMessage,
    }),
    [messages, loading, addMessage, updateMessageStatus, deleteMessage]
  );

  return (
    <SupportContext.Provider value={value}>
      {children}
    </SupportContext.Provider>
  );
}

export function useSupport(): SupportContextValue {
  const context = useContext(SupportContext);
  if (!context) {
    throw new Error('useSupport must be used within a SupportProvider');
  }
  return context;
}
