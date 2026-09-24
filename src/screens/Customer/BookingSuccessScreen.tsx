import React, { useState } from 'react';
import {
  Alert,
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import BookingHeader from '../../components/BookingHeader';
import { useBooking } from '../../context/BookingContext';
import { useOrders } from '../../context/OrdersContext';
import { useAdmin } from '../../context/AdminContext';
import { useAuth } from '../../context/AuthContext';
import { placeBooking } from '../../services/bookingServices';
import type { AdminOrder } from '../../context/AdminContext';
import type { BookingStackParamList } from '../../navigation/BookingNavigator';
import { colors } from '../../theme/colors';
import { formatBookingDate, formatMoney, formatTimeWindow } from '../../utils/format';

type Props = NativeStackScreenProps<BookingStackParamList, 'Success'>;

const TEAL = '#0F363F';
const TEXT_DARK = '#1F2933';
const TEXT_MUTED = '#7A869A';

const GRADIENT_CHECK = ['#17879B', '#0E5E73'] as const;
const GRADIENT_SUMMARY = ['#17879B', '#0E5E73'] as const;
const GRADIENT_NEXT = ['#17879B', '#0E5E73'] as const;

const isWeb = Platform.OS === 'web';

export default function BookingSuccessScreen({ navigation }: Props) {
  const { booking, resetBooking } = useBooking();
  const { addOrder } = useOrders();
  const { addOrder: addAdminOrder, refreshOrders: refreshAdminOrders } = useAdmin();
  const { user } = useAuth();
  const [reference] = useState(
    () => `LPP-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) return null;

  const handleDone = () => {
    const orderId = `ord-${Date.now()}`;
    const now = new Date();
    const placedAt = now.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const pickupDateStr = formatBookingDate(booking.pickupDate);
    const pickupTimeStr = formatTimeWindow(booking.pickupTime);
    const deliveryDateStr = formatBookingDate(booking.deliveryDate);
    const deliveryTimeStr = formatTimeWindow(booking.deliveryTime);
    const serviceSubtotal = booking.total - booking.deliveryFee;

    if (user) {
      placeBooking({
        userId: user.id,
        reference,
        customerName: user.name,
        customerPhone: user.phone ?? '',
        pickupAddress: booking.pickupAddress,
        pickupWindow: `${pickupDateStr} · ${pickupTimeStr}`,
        deliveryAddress: booking.deliveryAddress,
        deliveryWindow: `${deliveryDateStr} · ${deliveryTimeStr}`,
        instructions: booking.instructions,
        laundromat: booking.assignedLaundromat?.name,
        laundromatAddress: booking.assignedLaundromat?.address,
        bagCount: booking.bagCount,
        total: booking.total,
        paymentMethod: booking.paymentMethod,
        items: [
          {
            name: `${booking.bagCount} ${booking.bagCount === 1 ? 'Bag' : 'Bags'}`,
            quantity: 1,
            price: serviceSubtotal,
          },
        ],
      })
        .then(() => refreshAdminOrders())
        .catch((err: unknown) => {
          const message =
            err instanceof Error ? err.message : 'Something went wrong.';
          Alert.alert('Booking not saved', `${message} Please try again.`);
        });
    }

    addOrder({
      id: orderId,
      reference,
      service: 'Pickup & Drop Off',
      status: 'Scheduled',
      placedAt,
      pickupAddress: booking.pickupAddress,
      deliveryAddress: booking.deliveryAddress,
      pickupWindow: `${pickupDateStr} · ${pickupTimeStr}`,
      deliveryWindow: `${deliveryDateStr} · ${deliveryTimeStr}`,
      pickupType: booking.pickupType,
      driver: undefined,
      driverPhone: undefined,
      items: [{ name: `${booking.bagCount} ${booking.bagCount === 1 ? 'Bag' : 'Bags'}`, quantity: 1, price: serviceSubtotal }],
      deliveryFee: booking.deliveryFee,
      total: booking.total,
      paymentMethod: booking.paymentMethod,
      instructions: booking.instructions,
      laundromat: booking.assignedLaundromat?.name,
      laundromatAddress: booking.assignedLaundromat?.address,
    });

    const adminOrder: AdminOrder = {
      id: `#SUD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(1000 + Math.random() * 9000))}`,
      customerName: 'Customer',
      customerPhone: '',
      pickupAddress: booking.pickupAddress,
      deliveryAddress: booking.deliveryAddress,
      pickupDate: pickupDateStr,
      pickupTime: pickupTimeStr,
      driver: '',
      driverPhone: '',
      status: 'Pending',
      placedAt,
      placedAtISO: now.toISOString(),
      items: [{ name: `${booking.bagCount} ${booking.bagCount === 1 ? 'Bag' : 'Bags'}`, quantity: 1, price: serviceSubtotal }],
      deliveryFee: booking.deliveryFee,
      paymentMethod: booking.paymentMethod,
      instructions: booking.instructions,
      laundromat: booking.assignedLaundromat?.name,
      laundromatAddress: booking.assignedLaundromat?.address,
    };
    addAdminOrder(adminOrder);

    resetBooking();
    navigation.getParent()?.navigate('Home');
    navigation.popToTop();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <BookingHeader title="Booking Confirmed" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <LinearGradient colors={GRADIENT_CHECK} style={styles.checkCircle}>
            <MaterialCommunityIcons name="check" size={44} color={colors.white} />
          </LinearGradient>
          <Text style={styles.title}>Booking Confirmed!</Text>
          <Text style={styles.subtitle}>
            Your laundry pickup has been scheduled successfully.
          </Text>
        </View>

        <View style={styles.referenceChip}>
          <View style={styles.referenceIcon}>
            <MaterialCommunityIcons name="barcode-scan" size={18} color="#0E9AA7" />
          </View>
          <View style={styles.referenceBody}>
            <Text style={styles.referenceLabel}>Booking reference</Text>
            <Text style={styles.referenceValue}>{reference}</Text>
          </View>
        </View>

        <LinearGradient colors={GRADIENT_SUMMARY} style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <MaterialCommunityIcons name="basket-outline" size={20} color={colors.white} />
            <Text style={styles.summaryHeaderText}>Pickup &amp; Drop Off</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pickup</Text>
            <Text style={styles.summaryValue}>{booking.pickupAddress}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pickup time</Text>
            <Text style={styles.summaryValue}>
              {formatBookingDate(booking.pickupDate)} ·{' '}
              {formatTimeWindow(booking.pickupTime)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={styles.summaryValue}>{booking.deliveryAddress}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery time</Text>
            <Text style={styles.summaryValue}>
              {formatBookingDate(booking.deliveryDate)} ·{' '}
              {formatTimeWindow(booking.deliveryTime)}
            </Text>
          </View>
          {booking.assignedLaundromat && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Laundromat</Text>
              <Text style={styles.summaryValue}>{booking.assignedLaundromat.name}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment</Text>
            <Text style={styles.summaryValue}>{booking.paymentMethod}</Text>
          </View>
          {!!booking.instructions && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Notes</Text>
              <Text style={styles.summaryValue}>{booking.instructions}</Text>
            </View>
          )}
          <View style={styles.summaryDivider} />
          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>
              {formatMoney(booking.total)}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="email-outline" size={18} color="#0E9AA7" />
          <Text style={styles.infoText}>
            A confirmation email with these details has been sent to you.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.doneButtonTouch}
          activeOpacity={0.9}
          onPress={handleDone}
        >
          <LinearGradient colors={GRADIENT_NEXT} style={styles.doneButton}>
            <MaterialCommunityIcons
              name="rocket-launch-outline"
              size={18}
              color={colors.white}
              style={styles.doneButtonIcon}
            />
            <Text style={styles.doneButtonText}>Done</Text>
            <MaterialCommunityIcons name="check" size={18} color={colors.white} />
            <View style={styles.doneButtonShine} />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    backgroundColor: '#F7F9FB',
  },
  container: {
    paddingHorizontal: isWeb ? 32 : 20,
    paddingTop: 32,
    paddingBottom: 24,
    ...(isWeb ? { maxWidth: 600, alignSelf: 'center', width: '100%' } : {}),
  },
  hero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  checkCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#0E5E73',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: TEAL,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  referenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8ECF1',
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginBottom: 22,
  },
  referenceIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#D6F0F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  referenceBody: {
    alignItems: 'flex-start',
  },
  referenceLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: TEXT_MUTED,
    textTransform: 'uppercase',
  },
  referenceValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: TEAL,
    letterSpacing: 1,
    marginTop: 1,
  },
  summaryCard: {
    borderRadius: 20,
    padding: 18,
    elevation: 4,
    shadowColor: '#0E5E73',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  summaryHeaderText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: colors.white,
    marginLeft: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  summaryValue: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.white,
    textAlign: 'right',
    marginLeft: 16,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginVertical: 6,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  summaryTotalLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: colors.white,
  },
  summaryTotalValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: colors.white,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F5F4',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#4A5C64',
    marginLeft: 10,
  },
  doneButtonTouch: {
    borderRadius: 18,
    marginTop: 24,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 58,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#0E5E73',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  doneButtonIcon: {
    marginRight: 8,
  },
  doneButtonShine: {
    position: 'absolute',
    top: -30,
    left: -30,
    width: 90,
    height: 120,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    transform: [{ rotate: '20deg' }],
  },
  doneButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: colors.white,
    marginRight: 8,
  },
});
