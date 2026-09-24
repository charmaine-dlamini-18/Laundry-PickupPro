import React, { useState } from 'react';
import {
  Alert,
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import BookingHeader from '../../components/BookingHeader';
import FancyAlert from '../../components/FancyAlert';
import type { DriverStackParamList } from '../../navigation/DriverNavigator';
import { useDriverOrders } from '../../context/DriverOrdersContext';
import { useAuth } from '../../hooks/useAuth';

const isWeb = Platform.OS === 'web';

const TEXT_DARK = '#1F2933';
const TEXT_MUTED = '#7A869A';
const WHITE = '#FFFFFF';
const BLUE = '#2E6BFF';
const BLUE_TINT = '#E4EEFF';
const GREEN = '#00A85A';
const GREEN_TINT = '#DDF8E8';
const BORDER = '#E8ECF1';
const DANGER = '#E5484D';
const TEAL_HEADING = '#0E7A86';

const GRADIENT_PRIMARY = [BLUE, '#7857FF'] as const;
const GRADIENT_GREEN = ['#00A85A', '#0B7A50'] as const;

type Props = NativeStackScreenProps<DriverStackParamList, 'OrderDetails'>;

type Icon = keyof typeof MaterialCommunityIcons.glyphMap;

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

export default function PickupDetailsScreen({ navigation, route }: Props) {
  const { order } = route.params;
  const { updateOrderStatus } = useDriverOrders();
  const { user } = useAuth();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!fontsLoaded) return null;

  const openMaps = () => {
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        order.address,
      )}`,
    ).catch(() =>
      Alert.alert(
        'Cannot open maps',
        'No map application is available on this device.',
      ),
    );
  };

  const confirmPickup = () => {
    setShowConfirm(false);
    updateOrderStatus(order.orderNumber, 'Completed');
    setShowSuccess(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <BookingHeader
        title="Pickup Details"
        onBack={() => navigation.goBack()}
        showCancelBooking={false}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Number</Text>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        </View>

        <View style={styles.card}>
          <DetailRow
            icon="account-outline"
            label="Customer"
            value={order.customer}
            color={BLUE}
            tint={BLUE_TINT}
          />
          <DetailRow
            icon="phone-outline"
            label="Phone"
            value={order.phone ?? ''}
            color={GREEN}
            tint={GREEN_TINT}
            last
          />
        </View>

        <View style={styles.card}>
          <DetailRow
            icon="map-marker-outline"
            label="Pickup Address"
            value={order.address}
            color={BLUE}
            tint={BLUE_TINT}
            last
          />
        </View>

        <View style={styles.card}>
          <DetailRow
            icon="washing-machine"
            label="Laundromat"
            value={order.laundromat ?? ''}
            color={TEAL_HEADING}
            tint="#D6F0F4"
          />
          <DetailRow
            icon="map-marker-outline"
            label="Laundromat Address"
            value={order.laundromatAddress ?? ''}
            color={BLUE}
            tint={BLUE_TINT}
            last
          />
        </View>

        <View style={styles.card}>
          <DetailRow
            icon="clock-outline"
            label="Pickup Time"
            value={order.time}
            color="#E8960C"
            tint="#FFF0B8"
            last
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Special Notes</Text>
          <Text style={styles.notesText}>
            {order.notes || 'No special notes added.'}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryTouch}
          activeOpacity={0.9}
          onPress={() => setShowConfirm(true)}
        >
          <LinearGradient colors={GRADIENT_GREEN} style={styles.primaryButton}>
            <MaterialCommunityIcons name="truck-delivery-outline" size={20} color={WHITE} />
            <Text style={styles.primaryButtonText}>Mark as Picked Up</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineTouch}
          activeOpacity={0.85}
          onPress={openMaps}
        >
          <View style={styles.outlineButton}>
            <MaterialCommunityIcons name="map-outline" size={18} color={BLUE} />
            <Text style={styles.outlineButtonText}>Open Maps</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineTouch}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate('ChatScreen', {
              orderId: order.bookingReference ?? order.orderNumber,
              orderLabel: order.orderNumber,
              contactName: order.customer,
              myRole: 'driver',
              myName: user?.name ?? 'Driver',
            })
          }
        >
          <View style={styles.outlineButton}>
            <MaterialCommunityIcons name="chat-outline" size={18} color="#7857FF" />
            <Text style={[styles.outlineButtonText, { color: '#7857FF' }]}>
              Chat with {order.customer}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <FancyAlert
        visible={showConfirm}
        title="Mark as picked up?"
        message={`Confirm that you have collected the laundry for ${order.orderNumber} from ${order.customer}.`}
        icon="truck-delivery-outline"
        iconColor={GREEN}
        iconBackground={GREEN_TINT}
        buttonText="Confirm Pickup"
        onClose={confirmPickup}
      />

      <FancyAlert
        visible={showSuccess}
        title="Order Picked Up"
        message={`${order.orderNumber} has been marked as picked up successfully.`}
        icon="check-circle-outline"
        iconColor={GREEN}
        iconBackground={GREEN_TINT}
        buttonText="Done"
        onClose={() => {
          setShowSuccess(false);
          navigation.goBack();
        }}
      />
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
  orderNumber: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: BLUE,
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
  primaryTouch: {
    marginBottom: 10,
    borderRadius: 15,
    elevation: 4,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 15,
    gap: 8,
  },
  primaryButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: WHITE,
  },
  outlineTouch: {
    borderRadius: 14,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: WHITE,
    gap: 6,
  },
  outlineButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: BLUE,
  },
});
