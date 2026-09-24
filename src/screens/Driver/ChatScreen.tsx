import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import type { DriverStackParamList } from '../../navigation/DriverNavigator';
import { useAuth } from '../../hooks/useAuth';
import { useDriverOrders } from '../../context/DriverOrdersContext';
import { useChat } from '../../context/ChatContext';

const TEXT_DARK = '#1F2933';
const TEXT_MUTED = '#7A869A';
const WHITE = '#FFFFFF';
const BLUE = '#2E6BFF';
const BLUE_TINT = '#E4EEFF';
const PURPLE = '#7857FF';
const PURPLE_TINT = '#EFEBFF';
const BORDER = '#E8ECF1';

const isWeb = Platform.OS === 'web';

type Props = NativeStackScreenProps<DriverStackParamList, 'Chat'>;

export default function ChatScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { orders } = useDriverOrders();
  const { messages: allMessages } = useChat();
  const [searchText, setSearchText] = useState('');

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) return null;

  const myOrders = orders.filter(
    (order) => order.driver && order.driver === user?.name
  );

  const query = searchText.trim().toLowerCase();
  const byBooking = new Map<string, { order: typeof myOrders[number]; legs: typeof myOrders }>();
  for (const order of myOrders) {
    const key = order.bookingReference ?? order.orderNumber;
    const existing = byBooking.get(key);
    if (existing) {
      existing.legs.push(order);
    } else {
      byBooking.set(key, { order, legs: [order] });
    }
  }

  const conversations = Array.from(byBooking.values())
    .map(({ order, legs }) => {
      const key = order.bookingReference ?? order.orderNumber;
      return {
        key,
        label: order.bookingReference ?? order.orderNumber,
        customer: order.customer,
        address: legs.map((l) => l.address).filter(Boolean).join(' · '),
        messageKey: key,
      };
    })
    .filter(
      (c) =>
        !query ||
        c.customer.toLowerCase().includes(query) ||
        c.label.toLowerCase().includes(query)
    )
    .map((c) => {
      const orderMessages = allMessages[c.messageKey] ?? [];
      const lastMessage =
        orderMessages.length > 0
          ? orderMessages[orderMessages.length - 1]
          : null;
      return { ...c, lastMessage };
    });

  const openConversation = (threadKey: string, customerName: string) => {
    navigation.navigate('ChatScreen', {
      orderId: threadKey,
      contactName: customerName,
      myRole: 'driver',
      myName: user?.name ?? 'Driver',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.decorCircleOne} />
        <View style={styles.decorCircleTwo} />
        <Text style={styles.headerTitle}>Chats</Text>
        <Text style={styles.headerSubtitle}>
          Talk to customers about their orders
        </Text>
      </View>

      {conversations.length > 0 && (
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={TEXT_MUTED} />
          <TextInput
            placeholder="Search by customer or order"
            placeholderTextColor={TEXT_MUTED}
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {conversations.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons
                name="chat-remove-outline"
                size={40}
                color={PURPLE}
              />
            </View>
            <Text style={styles.emptyTitle}>No customers to chat with</Text>
            <Text style={styles.emptySubtitle}>
              Chat unlocks once an order is assigned to you. When admin assigns
              you an order, you can message that customer about it here.
            </Text>
          </View>
        ) : (
          conversations.map(({ key, label, customer, address, lastMessage }) => {
            const initial = customer.charAt(0).toUpperCase();
            const preview = lastMessage
              ? `${lastMessage.senderRole === 'driver' ? 'You: ' : ''}${lastMessage.text}`
              : 'No messages yet — say hello!';
            return (
              <TouchableOpacity
                key={key}
                style={styles.conversationCard}
                activeOpacity={0.85}
                onPress={() => openConversation(key, customer)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                  <View style={styles.onlineDot} />
                </View>

                <View style={styles.conversationBody}>
                  <View style={styles.conversationTopRow}>
                    <Text style={styles.customerName} numberOfLines={1}>
                      {customer}
                    </Text>
                    <Text style={styles.orderPill}>{label}</Text>
                  </View>
                  <Text style={styles.preview} numberOfLines={1}>
                    {preview}
                  </Text>
                  <Text style={styles.orderMeta} numberOfLines={1}>
                    {address}
                  </Text>
                </View>

                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color="#B9BEC7"
                />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: WHITE,
    paddingHorizontal: isWeb ? 32 : 20,
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    overflow: 'hidden',
  },
  decorCircleOne: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: PURPLE_TINT,
    top: -60,
    right: -30,
  },
  decorCircleTwo: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: BLUE_TINT,
    bottom: -40,
    left: -20,
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: TEXT_DARK,
  },
  headerSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    height: 44,
    marginHorizontal: isWeb ? 32 : 16,
    marginTop: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: TEXT_DARK,
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: isWeb ? 32 : 16,
    paddingVertical: 14,
    paddingBottom: 30,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 36,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: PURPLE_TINT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: TEXT_DARK,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PURPLE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: WHITE,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00A85A',
    borderWidth: 2,
    borderColor: WHITE,
  },
  conversationBody: {
    flex: 1,
    marginRight: 8,
  },
  conversationTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerName: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: TEXT_DARK,
    marginRight: 8,
  },
  orderPill: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: BLUE,
    backgroundColor: BLUE_TINT,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  preview: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 3,
  },
  orderMeta: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: '#B0BAC4',
    marginTop: 3,
  },
});
