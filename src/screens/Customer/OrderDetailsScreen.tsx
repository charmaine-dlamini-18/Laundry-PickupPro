import React, { useState } from 'react';
import {
  Alert,
  Modal,
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
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import BookingHeader from '../../components/BookingHeader';
import { useOrders } from '../../context/OrdersContext';
import { useAuth } from '../../hooks/useAuth';
import { addCustomerReview } from '../../services/adminOrderServices';
import { cancelCustomerBooking } from '../../services/bookingServices';
import type { CustomerStackParamList } from '../../navigation/types';
import type { OrderStatus } from '../../data/orders';
import { isOrderActive, isOrderCancellable } from '../../data/orders';
import { formatMoney } from '../../utils/format';

type Props = NativeStackScreenProps<CustomerStackParamList, 'OrderDetails'>;

type Icon = keyof typeof MaterialCommunityIcons.glyphMap;

const BLUE = '#2E6BFF';
const BLUE_TINT = '#E4EEFF';
const PURPLE = '#7857FF';
const PURPLE_TINT = '#EFEBFF';
const AMBER = '#E8960C';
const AMBER_TINT = '#FFF0B8';
const GREEN = '#00A85A';
const GREEN_TINT = '#DDF8E8';
const TEAL_ACCENT = '#0E9AA7';
const TEAL_TINT = '#D6F0F4';
const TEAL_HEADING = '#0E7A86';
const TEXT_DARK = '#1F2933';
const TEXT_MUTED = '#7A869A';
const BORDER = '#E8ECF1';
const WHITE = '#FFFFFF';
const colorsDanger = '#E5484D';

const GRADIENT_VIBRANT = [BLUE, PURPLE] as const;
const GRADIENT_DANGER = ['#E5484D', '#C2383C'] as const;

const statusColor: Record<OrderStatus, string> = {
  Scheduled: '#E8960C',
  'Picked Up': '#7857FF',
  'At Laundromat': '#2E6BFF',
  'Out for Delivery': '#00A85A',
  Delivered: '#0E9AA7',
  Cancelled: '#E5484D',
};

const statusGradient: Record<OrderStatus, readonly [string, string]> = {
  Scheduled: ['#E8960C', '#B97308'],
  'Picked Up': ['#7857FF', '#5334E0'],
  'At Laundromat': ['#2E6BFF', '#1A49D4'],
  'Out for Delivery': ['#00A85A', '#0B7A50'],
  Delivered: ['#17879B', '#0E5E73'],
  Cancelled: ['#E5484D', '#C2383C'],
};

const ITEM_ACCENTS = [
  { color: BLUE, tint: BLUE_TINT },
  { color: PURPLE, tint: PURPLE_TINT },
  { color: TEAL_ACCENT, tint: TEAL_TINT },
  { color: GREEN, tint: GREEN_TINT },
  { color: AMBER, tint: AMBER_TINT },
] as const;

type DetailRowProps = {
  icon: Icon;
  label: string;
  value: string;
  color?: string;
  tint?: string;
  last?: boolean;
};

function DetailRow({
  icon,
  label,
  value,
  color = BLUE,
  tint = BLUE_TINT,
  last,
}: DetailRowProps) {
  return (
    <View style={[styles.detailRow, last && styles.detailRowLast]}>
      <View style={[styles.detailIcon, { backgroundColor: tint }]}>
        <MaterialCommunityIcons name={icon} size={18} color={color} />
      </View>
      <View style={styles.detailBody}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const isWeb = Platform.OS === 'web';

export default function OrderDetailsScreen({ navigation, route }: Props) {
  const { order: initialOrder } = route.params;
  const { orders, updateOrderStatus } = useOrders();
  const { user } = useAuth();
  const order = orders.find((o) => o.id === initialOrder.id) ?? initialOrder;
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  if (!fontsLoaded) return null;

  const color = statusColor[order.status];
  const heroGradient = statusGradient[order.status];
  const active = isOrderActive(order.status);
  const cancellable = isOrderCancellable(order.status);
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleTrack = () => {
    navigation.navigate('Main', { screen: 'Track', params: { order } });
  };

  const handleChat = () => {
    if (!order.driver) return;
    navigation.navigate('Chat', {
      orderId: order.reference ?? order.id,
      orderLabel: order.reference,
      contactName: order.driver,
      myRole: 'customer',
      myName: user?.name ?? 'Customer',
    });
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    setShowCancelModal(false);
    try {
      await cancelCustomerBooking(order.reference);
      updateOrderStatus(order.id, 'Cancelled');
      Alert.alert('Order cancelled', `${order.reference} has been cancelled.`);
    } catch (e) {
      Alert.alert(
        'Could not cancel',
        e instanceof Error ? e.message : 'Please try again.'
      );
    }
  };

  const openReview = () => {
    setReviewRating(0);
    setReviewComment('');
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (reviewRating < 1) return;
    setReviewSubmitting(true);
    try {
      await addCustomerReview(
        order.reference ?? '',
        reviewRating,
        reviewComment
      );
      setShowReviewModal(false);
      Alert.alert('Thank you!', 'Your review for this order has been submitted.');
    } catch (error) {
      Alert.alert(
        'Could not submit review',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <BookingHeader title="Order Details" onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={heroGradient}
          style={[styles.hero, { shadowColor: heroGradient[0] }]}
        >
          <View style={styles.shine} />
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="basket-outline" size={26} color={WHITE} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroService}>{order.service}</Text>
            <Text style={styles.heroReference}>{order.reference}</Text>
          </View>
          <View style={styles.heroTotal}>
            <Text style={styles.heroTotalValue}>{formatMoney(order.total)}</Text>
            <Text style={styles.heroTotalLabel}>Total</Text>
          </View>
        </LinearGradient>

        <View style={styles.statusRow}>
          <View style={[styles.statusPill, { backgroundColor: `${color}1A` }]}>
            <MaterialCommunityIcons name="information-outline" size={16} color={color} />
            <Text style={[styles.statusText, { color }]}>{order.status}</Text>
          </View>
          <Text style={styles.placedText}>Placed {order.placedAt}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items</Text>
          {order.items.map((item, index) => {
            const accent = ITEM_ACCENTS[index % ITEM_ACCENTS.length];
            return (
              <View
                key={`${item.name}-${index}`}
                style={[styles.itemRow, index === order.items.length - 1 && styles.itemRowLast]}
              >
                <View style={[styles.itemIcon, { backgroundColor: accent.tint }]}>
                  <MaterialCommunityIcons name="tshirt-crew-outline" size={18} color={accent.color} />
                </View>
                <View style={styles.itemBody}>
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
                <Text style={styles.itemPrice}>
                  {formatMoney(item.price * item.quantity)}
                </Text>
              </View>
            );
          })}
          <View style={styles.totalDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatMoney(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Delivery fee</Text>
            <Text style={styles.totalValue}>{formatMoney(order.deliveryFee)}</Text>
          </View>
          <View style={styles.grandRow}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandValue}>{formatMoney(order.total)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Schedule &amp; Addresses</Text>
          <DetailRow
            icon="map-marker-outline"
            label="Pickup Address"
            value={order.pickupAddress}
            color={BLUE}
            tint={BLUE_TINT}
          />
          <DetailRow
            icon="home-variant-outline"
            label="Delivery Address"
            value={order.deliveryAddress}
            color={PURPLE}
            tint={PURPLE_TINT}
          />
          <DetailRow
            icon="calendar-outline"
            label="Pickup Window"
            value={order.pickupWindow}
            color={AMBER}
            tint={AMBER_TINT}
          />
          <DetailRow
            icon="clock-outline"
            label="Delivery Window"
            value={order.deliveryWindow}
            color={TEAL_ACCENT}
            tint={TEAL_TINT}
            last
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment</Text>
          <DetailRow
            icon="credit-card-outline"
            label="Payment Method"
            value={order.paymentMethod}
            color={GREEN}
            tint={GREEN_TINT}
            last
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Special Instructions</Text>
          <Text style={styles.notesText}>
            {order.instructions || 'No special instructions added.'}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {active && (
          <TouchableOpacity
            style={[styles.footerButton, styles.primaryButtonTouch]}
            activeOpacity={0.9}
            onPress={handleTrack}
          >
            <LinearGradient colors={GRADIENT_VIBRANT} style={styles.primaryButton}>
              <View style={styles.shine} />
              <Text style={styles.primaryButtonText}>Track Order</Text>
              <MaterialCommunityIcons name="map-marker-outline" size={18} color={WHITE} />
            </LinearGradient>
          </TouchableOpacity>
        )}
        {active && !!order.driver && (
          <TouchableOpacity
            style={[styles.footerButton, styles.chatButtonTouch]}
            activeOpacity={0.9}
            onPress={handleChat}
          >
            <LinearGradient colors={['#7857FF', '#5334E0']} style={styles.chatButton}>
              <View style={styles.shine} />
              <MaterialCommunityIcons name="chat-outline" size={18} color={WHITE} />
              <Text style={styles.chatButtonText}>Chat with Driver</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {cancellable && (
          <TouchableOpacity style={styles.cancelButtonTouch} onPress={handleCancel}>
            <LinearGradient colors={GRADIENT_DANGER} style={styles.cancelButton}>
              <View style={styles.shine} />
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {order.status === 'Delivered' && (
          <TouchableOpacity
            style={styles.reviewButtonTouch}
            activeOpacity={0.9}
            onPress={openReview}
          >
            <LinearGradient
              colors={['#E8960C', '#B97308']}
              style={styles.reviewButton}
            >
              <View style={styles.shine} />
              <MaterialCommunityIcons name="star-outline" size={18} color={WHITE} />
              <Text style={styles.reviewButtonText}>Rate this Order</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.cancelOverlay}>
          <View style={styles.cancelCard}>
            <View style={styles.cancelIconGlow}>
              <View style={styles.cancelIconCircle}>
                <MaterialCommunityIcons name="close-circle-outline" size={38} color={colorsDanger} />
              </View>
            </View>
            <Text style={styles.cancelTitle}>Cancel Order?</Text>
            <Text style={styles.cancelMessage}>
              Are you sure you want to cancel{' '}
              <Text style={styles.cancelRef}>{order.reference}</Text>?
              {'\n'}This action cannot be undone.
            </Text>
            <View style={styles.cancelActions}>
              <TouchableOpacity
                style={styles.cancelKeepTouch}
                activeOpacity={0.85}
                onPress={() => setShowCancelModal(false)}
              >
                <View style={styles.cancelKeepButton}>
                  <MaterialCommunityIcons name="arrow-left" size={16} color={TEAL_HEADING} />
                  <Text style={styles.cancelKeepText}>Keep Order</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelConfirmTouch}
                activeOpacity={0.85}
                onPress={confirmCancel}
              >
                <LinearGradient colors={GRADIENT_DANGER} style={styles.cancelConfirmButton}>
                  <View style={styles.cancelConfirmShine} />
                  <MaterialCommunityIcons name="close" size={16} color={WHITE} />
                  <Text style={styles.cancelConfirmText}>Cancel Order</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showReviewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.reviewOverlay}>
          <View style={styles.reviewCard}>
            <View style={styles.reviewIconGlow}>
              <View style={styles.reviewIconCircle}>
                <MaterialCommunityIcons name="star-outline" size={32} color={AMBER} />
              </View>
            </View>
            <Text style={styles.reviewTitle}>How was your experience?</Text>
            <Text style={styles.reviewSubtitle}>
              Rate your order to help us keep improving.
            </Text>
            <View style={styles.reviewStarsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  activeOpacity={0.7}
                  onPress={() => setReviewRating(star)}
                >
                  <MaterialCommunityIcons
                    name={star <= reviewRating ? 'star' : 'star-outline'}
                    size={40}
                    color={star <= reviewRating ? '#F5A623' : '#D4DBE3'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Add a comment (optional)"
              placeholderTextColor={TEXT_MUTED}
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              maxLength={280}
            />
            <View style={styles.reviewActions}>
              <TouchableOpacity
                style={styles.reviewCancelTouch}
                activeOpacity={0.85}
                onPress={() => setShowReviewModal(false)}
              >
                <View style={styles.reviewCancelButton}>
                  <Text style={styles.reviewCancelText}>Skip</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reviewSubmitTouch}
                activeOpacity={0.85}
                disabled={reviewRating < 1 || reviewSubmitting}
                onPress={submitReview}
              >
                <LinearGradient colors={GRADIENT_VIBRANT} style={styles.reviewSubmitButton}>
                  <Text style={styles.reviewSubmitText}>
                    {reviewSubmitting ? 'Submitting…' : 'Submit'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },
  scroll: {
    backgroundColor: '#F5F7FA',
  },
  container: {
    paddingHorizontal: isWeb ? 32 : 20,
    paddingTop: 8,
    paddingBottom: 110,
    ...(isWeb ? { maxWidth: 600, alignSelf: 'center', width: '100%' } : {}),
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 18,
    elevation: 4,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    marginBottom: 14,
    overflow: 'hidden',
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
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroText: {
    flex: 1,
    marginLeft: 14,
  },
  heroService: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: WHITE,
  },
  heroReference: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  heroTotal: {
    alignItems: 'flex-end',
  },
  heroTotalValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: WHITE,
  },
  heroTotalLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  statusText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    marginLeft: 6,
  },
  placedText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: TEXT_MUTED,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#26384A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: TEAL_HEADING,
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F4',
  },
  itemRowLast: {
    borderBottomWidth: 0,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemBody: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: TEXT_DARK,
  },
  qtyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  itemQty: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
  },
  itemPrice: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: TEXT_DARK,
  },
  totalDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: TEXT_MUTED,
  },
  totalValue: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: TEXT_DARK,
  },
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  grandLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: TEXT_DARK,
  },
  grandValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: TEAL_ACCENT,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F4',
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailBody: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: TEXT_MUTED,
  },
  detailValue: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: TEXT_DARK,
    marginTop: 1,
  },
  notesText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_DARK,
    paddingVertical: 8,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: WHITE,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  footerButton: {
    marginBottom: 10,
  },
  primaryButtonTouch: {
    borderRadius: 18,
    elevation: 4,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
  },
  primaryButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: WHITE,
    marginRight: 8,
  },
  cancelButtonTouch: {
    borderRadius: 18,
    elevation: 3,
    shadowColor: colorsDanger,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
  },
  cancelButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: WHITE,
  },
  chatButtonTouch: {
    borderRadius: 18,
    elevation: 3,
    shadowColor: '#7857FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
  },
  chatButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: WHITE,
    marginLeft: 8,
  },
  cancelOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 38, 58, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  cancelCard: {
    backgroundColor: WHITE,
    borderRadius: 28,
    paddingHorizontal: 26,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    elevation: 18,
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
  },
  cancelIconGlow: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(229, 72, 77, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  cancelIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FEE4E4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 19,
    color: TEXT_DARK,
    marginBottom: 8,
  },
  cancelMessage: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 21,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  cancelRef: {
    fontFamily: 'Poppins_600SemiBold',
    color: colorsDanger,
  },
  cancelActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  cancelKeepTouch: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: '#F9FAFB',
  },
  cancelKeepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
  },
  cancelKeepText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: TEAL_HEADING,
    marginLeft: 6,
  },
  cancelConfirmTouch: {
    flex: 1,
    borderRadius: 14,
    elevation: 6,
    shadowColor: colorsDanger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  cancelConfirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cancelConfirmShine: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 60,
    height: 80,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    transform: [{ rotate: '20deg' }],
  },
  cancelConfirmText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: WHITE,
    marginLeft: 6,
  },
  reviewButtonTouch: {
    borderRadius: 18,
    elevation: 3,
    shadowColor: AMBER,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
  },
  reviewButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: WHITE,
    marginLeft: 8,
  },
  reviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 38, 58, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  reviewCard: {
    backgroundColor: WHITE,
    borderRadius: 28,
    paddingHorizontal: 26,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    elevation: 18,
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
  },
  reviewIconGlow: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(232, 150, 12, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  reviewIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: AMBER_TINT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 19,
    color: TEXT_DARK,
    marginBottom: 6,
    textAlign: 'center',
  },
  reviewSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 18,
  },
  reviewStarsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 18,
  },
  reviewInput: {
    width: '100%',
    minHeight: 72,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: TEXT_DARK,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  reviewActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  reviewCancelTouch: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: '#F9FAFB',
  },
  reviewCancelButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    borderRadius: 14,
  },
  reviewCancelText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: TEXT_MUTED,
  },
  reviewSubmitTouch: {
    flex: 1,
    borderRadius: 14,
    elevation: 6,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  reviewSubmitButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
  },
  reviewSubmitText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: WHITE,
  },
});
