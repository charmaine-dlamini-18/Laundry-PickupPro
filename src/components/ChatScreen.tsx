import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import { useChat, type ChatRole } from '../context/ChatContext';

const isWeb = Platform.OS === 'web';

export type ChatScreenParams = {
  orderId: string;
  contactName: string;
  myRole: ChatRole;
  myName: string;
  orderLabel?: string;
};

export default function ChatScreen({ route }: { route?: { params?: ChatScreenParams } }) {
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const params = route?.params;
  const hasOrder = Boolean(
    params && params.orderId.trim() && params.contactName.trim()
  );
  const { orderId, contactName, myRole, myName, orderLabel } = params ?? {
    orderId: '',
    contactName: '',
    myRole: 'customer' as ChatRole,
    myName: 'You',
    orderLabel: undefined,
  };

  const { getMessages, sendMessage, loadMessages } = useChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const messages = getMessages(orderId);

  useEffect(() => {
    if (!hasOrder) return undefined;
    const unsubscribe = loadMessages(orderId);
    return () => {
      unsubscribe?.();
    };
  }, [hasOrder, orderId, loadMessages]);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, [messages.length]);

  if (!fontsLoaded) return null;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const suffix = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${suffix}`;
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || !hasOrder) return;
    sendMessage(orderId, text, myRole, myName);
    setInput('');
  };

  const contactInitial = contactName.charAt(0).toUpperCase();

  if (!hasOrder) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#1F2933" />
          </TouchableOpacity>
        </View>
        <View style={[styles.emptyChat, { paddingTop: 80 }]}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="chatbubbles-outline" size={36} color="#7857FF" />
          </View>
          <Text style={styles.emptyTitle}>No active conversation</Text>
          <Text style={styles.emptySubtitle}>
            Chat is only available for one of your orders. Open an order and
            tap Chat to contact{' '}
            {myRole === 'driver' ? 'the customer' : 'your driver'}.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#1F2933" />
        </TouchableOpacity>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{contactInitial}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{contactName}</Text>
          <Text style={styles.headerOrder}>Order {orderLabel || orderId}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.messagesContainer}
        >
          {messages.length === 0 && (
            <View style={styles.emptyChat}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="chatbubbles-outline" size={36} color="#7857FF" />
              </View>
              <Text style={styles.emptyTitle}>Start a conversation</Text>
              <Text style={styles.emptySubtitle}>
                Send a message to coordinate about your order.
              </Text>
            </View>
          )}

          {messages.map((message) => {
            const isMine = message.senderRole === myRole;
            return (
              <View
                key={message.id}
                style={[
                  styles.messageRow,
                  isMine ? styles.messageRowMine : styles.messageRowTheirs,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    isMine ? styles.bubbleMine : styles.bubbleTheirs,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isMine ? styles.messageTextMine : styles.messageTextTheirs,
                    ]}
                  >
                    {message.text}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      isMine ? styles.messageTimeMine : styles.messageTimeTheirs,
                    ]}
                  >
                    {formatTime(message.timestamp)}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#8E8E93"
            value={input}
            onChangeText={setInput}
            multiline
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: isWeb ? 32 : 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF1',
    ...(isWeb ? { maxWidth: 600, alignSelf: 'center', width: '100%' } : {}),
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    ...(isWeb ? { cursor: 'pointer' } : {}),
  },
  emptyHeader: {
    paddingHorizontal: isWeb ? 32 : 14,
    paddingTop: 4,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#173D8F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#12263A',
  },
  headerOrder: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#7A869A',
    marginTop: 2,
  },
  messagesContainer: {
    paddingHorizontal: isWeb ? 32 : 16,
    paddingVertical: 16,
    ...(isWeb ? { maxWidth: 600, alignSelf: 'center', width: '100%' } : {}),
  },
  emptyChat: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFEBFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: '#1F2933',
  },
  emptySubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#7A869A',
    marginTop: 6,
    textAlign: 'center',
  },
  messageRow: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: '#173D8F',
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  messageText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMine: {
    color: '#FFFFFF',
  },
  messageTextTheirs: {
    color: '#12263A',
  },
  messageTime: {
    marginTop: 4,
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  messageTimeMine: {
    color: '#C9D6F0',
  },
  messageTimeTheirs: {
    color: '#8E8E93',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: isWeb ? 32 : 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8ECF1',
    ...(isWeb ? { maxWidth: 600, alignSelf: 'center', width: '100%' } : {}),
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F3F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#12263A',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#173D8F',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
});
