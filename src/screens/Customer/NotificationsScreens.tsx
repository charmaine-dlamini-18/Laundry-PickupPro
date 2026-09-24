import React from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import type { CustomerStackParamList } from '../../navigation/types';
import {
  useNotifications,
  type AppNotification,
} from '../../context/NotificationsContext';

type Props = NativeStackScreenProps<CustomerStackParamList, 'Notifications'>;

type Icon = keyof typeof MaterialCommunityIcons.glyphMap;

type NotificationType = 'order' | 'promotion' | 'system' | 'alert';

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: Icon;
  type: NotificationType;
};

const PRIMARY = '#2E6BFF';
const PURPLE = '#7857FF';
const TEAL = '#0E9AA7';
const TEAL_DARK = '#0E7A86';
const GREEN = '#00A85A';
const AMBER = '#E8960C';
const DANGER = '#E5484D';
const TEXT_DARK = '#1F2933';
const TEXT_MUTED = '#7A869A';
const BORDER = '#E8ECF1';
const BG = '#F5F7FA';
const WHITE = '#FFFFFF';

const BLUE_TINT = '#E4EEFF';
const TEAL_TINT = '#D6F0F4';
const GREEN_TINT = '#DDF8E8';
const AMBER_TINT = '#FFF0B8';
const RED_TINT = '#FDE7E8';

const GRADIENT_HEADER = ['#2E6BFF', '#7857FF'] as const;
const GRADIENT_VIBRANT = ['#2E6BFF', '#7857FF'] as const;

const TYPE_COLOR: Record<NotificationType, { color: string; tint: string }> = {
  order: { color: PRIMARY, tint: BLUE_TINT },
  promotion: { color: AMBER, tint: AMBER_TINT },
  system: { color: TEAL, tint: TEAL_TINT },
  alert: { color: DANGER, tint: RED_TINT },
};

const KIND_META: Record<
  AppNotification['kind'],
  { icon: Icon; type: NotificationType }
> = {
  order_assigned: { icon: 'calendar-check-outline', type: 'order' },
  driver_assigned: { icon: 'truck-delivery-outline', type: 'order' },
  order_placed: { icon: 'clipboard-check-outline', type: 'order' },
  order_updated: { icon: 'update', type: 'order' },
  order_delivered: { icon: 'package-variant-closed-check', type: 'system' },
  new_message: { icon: 'message-text-outline', type: 'system' },
  info: { icon: 'information-outline', type: 'system' },
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function decorate(notification: AppNotification): Notification {
  const meta = KIND_META[notification.kind] ?? {
    icon: 'bell-outline' as Icon,
    type: 'system' as NotificationType,
  };
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    time: relativeTime(notification.createdAt),
    read: notification.read,
    ...meta,
  };
}

const isWeb = Platform.OS === 'web';

export default function NotificationsScreen({ navigation }: Props) {
  const {
    notifications: stored,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const notifications = stored.map(decorate);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={GRADIENT_HEADER} style={styles.header}>
        <View style={styles.decorCircleOne} />
        <View style={styles.decorCircleTwo} />
        <View style={styles.headerShine} />
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.headerSpacer}>
          <MaterialCommunityIcons name="bell-outline" size={24} color="rgba(255, 255, 255, 0.9)" />
        </TouchableOpacity>
      </LinearGradient>

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
          <Text style={styles.unreadBannerText}>
            {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {unreadCount > 0 && (
        <View style={styles.actionWrap}>
          <TouchableOpacity activeOpacity={0.9} onPress={markAllAsRead}>
            <LinearGradient colors={GRADIENT_VIBRANT} style={styles.markAllButton}>
              <View style={styles.shine} />
              <MaterialCommunityIcons name="check-all" size={18} color={WHITE} />
              <Text style={styles.markAllButtonText}>Mark all as read</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="bell-off-outline" size={40} color={PRIMARY} />
            </View>
            <Text style={styles.emptyTitle}>
              {loading ? 'Loading notifications…' : 'No notifications yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              Updates about your orders will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const { color, tint } = TYPE_COLOR[item.type];
          return (
            <TouchableOpacity
              style={[styles.card, !item.read && styles.cardUnread]}
              activeOpacity={0.85}
              onPress={() => markAsRead(item.id)}
            >
              <View style={[styles.iconCircle, { backgroundColor: tint }]}>
                <MaterialCommunityIcons name={item.icon} size={22} color={color} />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardTitle, !item.read && styles.cardTitleUnread]}>
                    {item.title}
                  </Text>
                  {!item.read && <View style={[styles.titleDot, { backgroundColor: color }]} />}
                </View>
                <Text style={styles.cardMessage}>{item.message}</Text>
                <Text style={styles.cardTime}>{item.time}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: 'hidden',
  },
  decorCircleOne: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    top: -70,
    right: -40,
  },
  decorCircleTwo: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: -50,
    left: -30,
  },
  headerShine: {
    position: 'absolute',
    top: -46,
    right: -20,
    width: 90,
    height: 120,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    transform: [{ rotate: '-20deg' }],
  },
  shine: {
    position: 'absolute',
    top: -30,
    left: -30,
    width: 90,
    height: 120,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    transform: [{ rotate: '20deg' }],
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: WHITE,
  },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLUE_TINT,
    borderBottomWidth: 1,
    borderColor: '#D4E2FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: WHITE,
  },
  unreadBannerText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: TEAL_DARK,
  },
  actionWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  markAllButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: WHITE,
    marginLeft: 8,
  },
  listContent: {
    padding: isWeb ? 32 : 16,
    paddingBottom: 40,
    ...(isWeb ? { maxWidth: 600, alignSelf: 'center', width: '100%' } : {}),
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
  },
  cardUnread: {
    backgroundColor: '#F4F8FF',
    borderColor: '#D8E6FF',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: TEXT_DARK,
  },
  cardTitleUnread: {
    fontFamily: 'Poppins_600SemiBold',
  },
  titleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  cardMessage: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 3,
    lineHeight: 18,
  },
  cardTime: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: '#B0BAC4',
    marginTop: 6,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: BLUE_TINT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: TEXT_DARK,
    marginTop: 14,
  },
  emptySubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 6,
    textAlign: 'center',
  },
});
