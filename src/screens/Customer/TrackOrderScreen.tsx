import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import { useOrders } from '../../context/OrdersContext';
import { useAuth } from '../../hooks/useAuth';
import type { CustomerTabNavigation, CustomerTabParamList } from '../../navigation/types';
import { ORDER_STEPS, isOrderActive, orderStepIndex, type OrderStatus } from '../../data/orders';
import { formatMoney } from '../../utils/format';

type TrackRoute = RouteProp<CustomerTabParamList, 'Track'>;

const PRIMARY = '#2E6BFF';
const PURPLE = '#7857FF';
const TEAL = '#0E9AA7';
const TEAL_DARK = '#0E7A86';
const GREEN = '#00A85A';
const GREEN_DARK = '#0B7A50';
const AMBER = '#E8960C';
const DANGER = '#E5484D';
const TEXT_DARK = '#1F2933';
const TEXT_MUTED = '#7A869A';
const BORDER = '#E8ECF1';
const BG = '#F5F7FA';
const WHITE = '#FFFFFF';

const BLUE_TINT = '#E4EEFF';
const PURPLE_TINT = '#EFEBFF';
const TEAL_TINT = '#D6F0F4';
const GREEN_TINT = '#DDF8E8';
const AMBER_TINT = '#FFF0B8';

const GRADIENT_POP = ['#33C9B2', '#2E6BFF'] as const;
const GRADIENT_VIBRANT = ['#2E6BFF', '#7857FF'] as const;
const GRADIENT_GREEN = [GREEN, GREEN_DARK] as const;

const DEFAULT_LAT = -33.9359;
const DEFAULT_LNG = 18.4632;

const statusColor: Record<OrderStatus, string> = {
  Scheduled: AMBER,
  'Picked Up': PURPLE,
  'At Laundromat': PRIMARY,
  'Out for Delivery': TEAL,
  Delivered: GREEN,
  Cancelled: DANGER,
};

const statusTint: Record<OrderStatus, string> = {
  Scheduled: AMBER_TINT,
  'Picked Up': PURPLE_TINT,
  'At Laundromat': BLUE_TINT,
  'Out for Delivery': TEAL_TINT,
  Delivered: GREEN_TINT,
  Cancelled: '#FDE7E8',
};

const statusIcon: Record<OrderStatus, keyof typeof MaterialCommunityIcons.glyphMap> = {
  Scheduled: 'calendar-clock',
  'Picked Up': 'package-variant-closed',
  'At Laundromat': 'storefront-outline',
  'Out for Delivery': 'truck-fast-outline',
  Delivered: 'check-circle-outline',
  Cancelled: 'close-circle-outline',
};

const isWeb = Platform.OS === 'web';

export default function TrackOrderScreen() {
  const { orders } = useOrders();
  const { user } = useAuth();
  const navigation = useNavigation<CustomerTabNavigation>();
  const route = useRoute<TrackRoute>();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const activeOrders = useMemo(() => orders.filter((o) => isOrderActive(o.status)), [orders]);

  const [selectedId, setSelectedId] = useState<string | null>(
    route.params?.order?.id ?? activeOrders[0]?.id ?? null
  );

  useEffect(() => {
    if (route.params?.order?.id) {
      setSelectedId(route.params.order.id);
    }
  }, [route.params]);

  useEffect(() => {
    if (!selectedId && activeOrders.length > 0) {
      setSelectedId(activeOrders[0].id);
    }
  }, [activeOrders, selectedId]);

  const order = orders.find((o) => o.id === selectedId) ?? activeOrders[0];

  if (!fontsLoaded) return null;

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={GRADIENT_POP} style={styles.header}>
          <View style={styles.decorCircleOne} />
          <View style={styles.decorCircleTwo} />
          <View style={styles.headerShine} />
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() =>
              navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')
            }
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Track Order</Text>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => navigation.navigate('Notifications')}
          >
            <MaterialCommunityIcons name="bell-outline" size={22} color={WHITE} />
          </TouchableOpacity>
        </LinearGradient>
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <MaterialCommunityIcons name="map-marker-off-outline" size={44} color={PRIMARY} />
          </View>
          <Text style={styles.emptyTitle}>No active orders</Text>
          <Text style={styles.emptySubtitle}>
            Your active orders will show here. Book a pickup to get started.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Book')}
          >
            <LinearGradient colors={GRADIENT_VIBRANT} style={styles.emptyButtonGradient}>
              <View style={styles.shine} />
              <Text style={styles.emptyButtonText}>Book a Pickup</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const stepIndex = orderStepIndex(order.status);
  const isDelivered = order.status === 'Delivered';

  const statusHint: Record<string, string> = {
    Scheduled: 'Your order has been scheduled',
    'Picked Up': 'Your laundry has been picked up',
    'At Laundromat': 'Your laundry is being washed',
    'Out for Delivery': 'Your laundry is on its way to you',
    Delivered: 'Your laundry has been delivered',
    Cancelled: 'This order has been cancelled',
  };
  const callDriver = () => {
    if (!order.driverPhone) return;
    Linking.openURL(`tel:${order.driverPhone}`).catch(() => undefined);
  };

  const chatDriver = () => {
    if (!order.driver) return;
    (navigation as unknown as NativeStackNavigationProp<any>).navigate('Chat', {
      orderId: order.reference ?? order.id,
      orderLabel: order.reference,
      contactName: order.driver,
      myRole: 'customer',
      myName: user?.name ?? 'Customer',
    });
  };

  const lat = order.deliveryLat ?? DEFAULT_LAT;
  const lng = order.deliveryLng ?? DEFAULT_LNG;
  const openMaps = () => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`).catch(
      () => undefined
    );
  };

  const bookedFromHome =
    order.pickupType != null
      ? order.pickupType === 'home'
      : !!order.laundromatAddress && order.deliveryAddress === order.laundromatAddress;

  const etaLabel = bookedFromHome ? 'Estimated pickup' : 'Estimated delivery';
  const etaWindow = bookedFromHome ? order.pickupWindow : order.deliveryWindow;
  const etaWindowTime = etaWindow.split(' · ').pop() ?? etaWindow;

  const openOrderDetails = () => {
    navigation.navigate('OrderDetails', { order });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={GRADIENT_POP} style={styles.header}>
        <View style={styles.decorCircleOne} />
        <View style={styles.decorCircleTwo} />
        <View style={styles.headerShine} />
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() =>
            navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')
          }
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => navigation.navigate('Notifications')}
        >
          <MaterialCommunityIcons name="bell-outline" size={22} color={WHITE} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {activeOrders.length > 1 && (
          <View>
            <Text style={styles.sectionLabel}>Select order</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.orderChips}
            >
              {activeOrders.map((item) => {
                const active = item.id === order.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.orderChip, active && styles.orderChipActive]}
                    activeOpacity={0.9}
                    onPress={() => setSelectedId(item.id)}
                  >
                    {active ? (
                      <LinearGradient colors={GRADIENT_VIBRANT} style={styles.orderChipGradient}>
                        <Text style={styles.orderChipTextActive}>{item.reference}</Text>
                      </LinearGradient>
                    ) : (
                      <Text style={styles.orderChipText}>{item.reference}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <TouchableOpacity
          style={styles.orderCard}
          activeOpacity={0.9}
          onPress={openOrderDetails}
        >
          <View style={[styles.orderIcon, { backgroundColor: statusTint[order.status] }]}>
            <MaterialCommunityIcons
              name={statusIcon[order.status]}
              size={26}
              color={statusColor[order.status]}
            />
          </View>
          <View style={styles.orderBody}>
            <Text style={styles.orderReference}>{order.reference}</Text>
            <Text style={styles.orderAddress} numberOfLines={1}>
              {order.deliveryAddress}
            </Text>
          </View>
          <View style={styles.orderRight}>
            <View
              style={[styles.statusPill, { backgroundColor: `${statusColor[order.status]}1A` }]}
            >
              <View style={[styles.statusDot, { backgroundColor: statusColor[order.status] }]} />
              <Text style={[styles.orderStatusText, { color: statusColor[order.status] }]}>
                {order.status}
              </Text>
            </View>
            <Text style={styles.orderTotal}>{formatMoney(order.total)}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.92} onPress={openMaps}>
          <View style={styles.mapCard}>
            <View style={styles.mapCanvas}>
              <Image
                source={require('../../../assets/delivery-map.png')}
                style={styles.mapImage}
                resizeMode="cover"
              />
              <View style={styles.mapPin}>
                <MaterialCommunityIcons name="map-marker" size={44} color={AMBER} />
              </View>
              <LinearGradient colors={GRADIENT_VIBRANT} style={styles.mapAddressTag}>
                <MaterialCommunityIcons name="map-marker" size={15} color={WHITE} />
                <Text style={styles.mapAddressText} numberOfLines={1}>
                  {order.deliveryAddress}
                </Text>
              </LinearGradient>
              <View style={styles.mapEtaBadge}>
                <MaterialCommunityIcons name="clock-fast" size={13} color={GREEN_DARK} />
                <Text style={styles.mapEtaText}>
                  {isDelivered ? 'Delivered' : etaWindowTime}
                </Text>
              </View>
              <Text style={styles.mapAttribution}>© OpenStreetMap contributors</Text>
            </View>
            <LinearGradient colors={GRADIENT_VIBRANT} style={styles.mapFooter}>
              <View style={styles.shine} />
              <MaterialCommunityIcons name="google-maps" size={18} color={WHITE} />
              <Text style={styles.mapFooterText}>Open in Google Maps</Text>
              <MaterialCommunityIcons name="open-in-new" size={16} color="rgba(255, 255, 255, 0.85)" />
            </LinearGradient>
          </View>
        </TouchableOpacity>

        <View style={styles.timelineCard}>
          {ORDER_STEPS.map((step, index) => {
            const reached = index <= stepIndex;
            const isCurrent = index === stepIndex && !isDelivered;
            const isLast = index === ORDER_STEPS.length - 1;
            const completed = index < stepIndex;
            const dotBg = isCurrent
              ? statusTint[order.status]
              : reached
              ? statusColor[order.status]
              : '#F1F4F8';
            const dotBorder = isCurrent
              ? statusColor[order.status]
              : reached
              ? statusColor[order.status]
              : '#E1E7EC';
            return (
              <View key={step.key} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <View
                    style={[styles.timelineDot, { backgroundColor: dotBg, borderColor: dotBorder }]}
                  >
                    {reached ? (
                      <MaterialCommunityIcons
                        name={isCurrent ? statusIcon[order.status] : 'check'}
                        size={16}
                        color={isCurrent ? statusColor[order.status] : WHITE}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={statusIcon[step.key]}
                        size={16}
                        color="#B9C3CD"
                      />
                    )}
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.timelineLine,
                        completed && styles.timelineLineReached,
                      ]}
                    />
                  )}
                </View>
                <View style={styles.timelineBody}>
                  <Text
                    style={[
                      styles.timelineLabel,
                      reached && styles.timelineLabelReached,
                      isCurrent && styles.timelineLabelCurrent,
                    ]}
                  >
                    {step.label}
                  </Text>
                  {isCurrent && (
                    <Text style={styles.timelineHint}>
                      {statusHint[order.status]}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.driverCard}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverAvatarText}>
              {(order.driver ?? '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.driverBody}>
            <Text style={styles.driverLabel}>Your driver</Text>
            <Text style={styles.driverName}>{order.driver ?? 'Assigning a driver…'}</Text>
            {!!order.driverPhone && <Text style={styles.driverPhone}>{order.driverPhone}</Text>}
          </View>
          {!!order.driverPhone && (
            <TouchableOpacity style={styles.callButtonWrap} activeOpacity={0.9} onPress={callDriver}>
              <LinearGradient colors={GRADIENT_GREEN} style={styles.callButton}>
                <View style={styles.shine} />
                <MaterialCommunityIcons name="phone" size={16} color={WHITE} />
                <Text style={styles.callButtonText}>Call</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          {!!order.driver && (
            <TouchableOpacity style={styles.chatButtonWrap} activeOpacity={0.9} onPress={chatDriver}>
              <LinearGradient colors={GRADIENT_VIBRANT} style={styles.chatButton}>
                <View style={styles.shine} />
                <MaterialCommunityIcons name="chat-outline" size={16} color={WHITE} />
                <Text style={styles.chatButtonText}>Chat</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.etaRow} activeOpacity={0.9} onPress={openOrderDetails}>
          <View style={styles.etaIcon}>
            <MaterialCommunityIcons name="clock-fast" size={24} color={AMBER} />
          </View>
          <View style={styles.etaBody}>
            <Text style={styles.etaLabel}>{etaLabel}</Text>
            <Text style={styles.etaValue}>
              {isDelivered ? 'Delivered' : etaWindow}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={TEXT_MUTED} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.helpRow} onPress={() => navigation.navigate('Support')}>
          <View style={styles.helpIcon}>
            <MaterialCommunityIcons name="headset" size={20} color={PURPLE} />
          </View>
          <Text style={styles.helpText}>Need help with this order?</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={TEXT_MUTED} />
        </TouchableOpacity>
      </ScrollView>
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
    width: 160,
    height: 160,
    borderRadius: 80,
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: WHITE,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    backgroundColor: BG,
  },
  container: {
    paddingHorizontal: isWeb ? 32 : 20,
    paddingTop: 14,
    paddingBottom: 110,
    ...(isWeb ? { maxWidth: 600, alignSelf: 'center', width: '100%' } : {}),
  },
  sectionLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: TEAL_DARK,
    marginBottom: 8,
  },
  orderChips: {
    paddingBottom: 14,
  },
  orderChip: {
    borderRadius: 20,
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: BORDER,
    marginRight: 8,
    overflow: 'hidden',
  },
  orderChipActive: {
    borderColor: PRIMARY,
    elevation: 2,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  orderChipGradient: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignItems: 'center',
  },
  orderChipText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: TEXT_DARK,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  orderChipTextActive: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: WHITE,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 14,
    elevation: 1,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  orderIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderBody: {
    flex: 1,
    marginLeft: 12,
  },
  orderReference: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: TEAL_DARK,
  },
  orderAddress: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 3,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  orderStatusText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
  },
  orderTotal: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: TEXT_DARK,
    marginTop: 6,
  },
  mapCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  mapCanvas: {
    height: 230,
    overflow: 'hidden',
    backgroundColor: '#E8EEF7',
  },
  mapImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mapPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 44,
    height: 44,
    marginLeft: -22,
    marginTop: -44,
  },
  mapAddressTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  mapAddressText: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: WHITE,
    marginLeft: 6,
  },
  mapEtaBadge: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN_TINT,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mapEtaText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: GREEN_DARK,
    marginLeft: 5,
  },
  mapAttribution: {
    position: 'absolute',
    right: 8,
    bottom: 6,
    fontFamily: 'Poppins_400Regular',
    fontSize: 9,
    color: '#6B7280',
  },
  mapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    overflow: 'hidden',
  },
  mapFooterText: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: WHITE,
    marginLeft: 10,
  },
  timelineCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineRail: {
    alignItems: 'center',
    width: 34,
    marginRight: 12,
  },
  timelineDot: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#F1F4F8',
    borderColor: '#E1E7EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    height: 32,
    backgroundColor: '#E1E7EC',
  },
  timelineLineReached: {
    backgroundColor: GREEN,
  },
  timelineBody: {
    flex: 1,
    paddingTop: 6,
    paddingBottom: 12,
  },
  timelineLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: TEXT_MUTED,
  },
  timelineLabelReached: {
    color: TEXT_DARK,
  },
  timelineLabelCurrent: {
    fontFamily: 'Poppins_600SemiBold',
    color: TEAL_DARK,
  },
  timelineHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: AMBER,
    marginTop: 2,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: WHITE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 14,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: TEAL_TINT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverAvatarText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: TEAL_DARK,
  },
  driverBody: {
    flex: 1,
    marginLeft: 12,
  },
  driverLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: TEXT_MUTED,
  },
  driverName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: TEXT_DARK,
    marginTop: 1,
  },
  driverPhone: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 1,
  },
  callButtonWrap: {
    borderRadius: 22,
    elevation: 2,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    overflow: 'hidden',
  },
  callButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: WHITE,
    marginLeft: 6,
  },
  chatButtonWrap: {
    borderRadius: 22,
    marginLeft: 8,
    elevation: 2,
    shadowColor: '#7857FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    overflow: 'hidden',
  },
  chatButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: WHITE,
    marginLeft: 6,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 14,
  },
  etaIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: AMBER_TINT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  etaBody: {
    flex: 1,
    marginLeft: 12,
  },
  etaLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: TEXT_MUTED,
  },
  etaValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: TEXT_DARK,
    marginTop: 1,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
  },
  helpIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: PURPLE_TINT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpText: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: TEXT_DARK,
    marginLeft: 10,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyIconWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
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
  emptyButton: {
    marginTop: 20,
    borderRadius: 16,
  },
  emptyButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: WHITE,
  },
});
