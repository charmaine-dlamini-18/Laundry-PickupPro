import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
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
const GREEN = '#00A85A';
const BORDER = '#E8ECF1';
const TEAL_HEADING = '#0E7A86';

const GRADIENT_GREEN = ['#00A85A', '#0B7A50'] as const;

type Props = NativeStackScreenProps<
  DriverStackParamList,
  'DeliveryDetails'
>;

export default function DeliveryDetailsScreen({
  navigation,
  route,
}: Props) {
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

  const confirmDelivery = () => {
    setShowConfirm(false);
    updateOrderStatus(order.orderNumber, 'Completed');
    setShowSuccess(true);
  };

  const openChat = () => {
    navigation.navigate('ChatScreen', {
      orderId: order.bookingReference ?? order.orderNumber,
      orderLabel: order.orderNumber,
      contactName: order.customer,
      myRole: 'driver',
      myName: user?.name ?? 'Driver',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <BookingHeader
        title="Delivery Details"
        onBack={() => navigation.goBack()}
        showCancelBooking={false}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Number */}
        <View style={styles.card}>
          <Text style={styles.orderLabel}>Order Number</Text>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        </View>

        {/* Customer */}
        <View style={styles.customerCard}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={30} color={WHITE} />
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{order.customer}</Text>
            <Text style={styles.phone}>{order.phone}</Text>
          </View>
        </View>

        {/* Laundromat */}
        <Text style={styles.sectionHeading}>Laundromat</Text>
        <View style={styles.card}>
          <Text style={styles.info}>{order.laundromat}</Text>
          <Text style={styles.infoSub}>{order.laundromatAddress}</Text>
        </View>

        {/* Delivery Address */}
        <Text style={styles.sectionHeading}>Delivery Address</Text>
        <View style={styles.card}>
          <Text style={styles.info}>{order.address}</Text>
        </View>

        {/* Delivery Time */}
        <Text style={styles.sectionHeading}>Delivery Time</Text>
        <View style={styles.card}>
          <Text style={styles.info}>{order.time}</Text>
        </View>

        {/* Notes */}
        <Text style={styles.sectionHeading}>Special Notes</Text>
        <View style={styles.card}>
          <Text style={styles.notes}>{order.notes}</Text>
        </View>

        {/* Mark as Delivered */}
        <TouchableOpacity
          style={styles.deliverButtonTouch}
          activeOpacity={0.85}
          onPress={() => setShowConfirm(true)}
        >
          <LinearGradient colors={GRADIENT_GREEN} style={styles.deliverButton}>
            <MaterialCommunityIcons name="check-circle-outline" size={20} color={WHITE} />
            <Text style={styles.deliverButtonText}>Mark as Delivered</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Open Maps */}
        <TouchableOpacity
          style={styles.mapButtonTouch}
          activeOpacity={0.85}
          onPress={openMaps}
        >
          <View style={styles.mapButton}>
            <MaterialCommunityIcons name="map-marker-outline" size={20} color={BLUE} />
            <Text style={styles.mapButtonText}>Open Maps</Text>
          </View>
        </TouchableOpacity>

        {/* Chat with Customer */}
        <TouchableOpacity
          style={styles.mapButtonTouch}
          activeOpacity={0.85}
          onPress={openChat}
        >
          <View style={styles.mapButton}>
            <MaterialCommunityIcons name="chat-outline" size={20} color="#7857FF" />
            <Text style={[styles.mapButtonText, { color: '#7857FF' }]}>
              Chat with {order.customer}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <MaterialCommunityIcons
                name="package-variant-closed-check"
                size={30}
                color={GREEN}
              />
            </View>
            <Text style={styles.modalTitle}>Mark as delivered?</Text>
            <Text style={styles.modalMessage}>
              Confirm that {order.orderNumber} has been delivered to {order.customer}.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelTouch}
                activeOpacity={0.85}
                onPress={() => setShowConfirm(false)}
              >
                <View style={styles.modalCancelButton}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmTouch}
                activeOpacity={0.85}
                onPress={confirmDelivery}
              >
                <LinearGradient colors={GRADIENT_GREEN} style={styles.modalConfirmButton}>
                  <Text style={styles.modalConfirmText}>Confirm</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <FancyAlert
        visible={showSuccess}
        title="Order Delivered"
        message={`${order.orderNumber} has been marked as delivered successfully.`}
        icon="check-circle"
        iconColor={GREEN}
        iconBackground="#DDF8E8"
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
    paddingVertical: 20,
    paddingBottom: 30,
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

  orderLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    marginBottom: 5,
  },
  orderNumber: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: BLUE,
  },

  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 17,
    color: TEXT_DARK,
  },
  phone: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: TEXT_MUTED,
    marginTop: 3,
  },

  sectionHeading: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: TEAL_HEADING,
    marginBottom: 10,
    marginTop: 6,
  },

  info: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: TEXT_DARK,
  },
  infoSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 4,
  },
  notes: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: TEXT_MUTED,
    lineHeight: 22,
  },

  deliverButtonTouch: {
    borderRadius: 15,
    elevation: 4,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    marginBottom: 15,
    marginTop: 10,
  },
  deliverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 15,
    overflow: 'hidden',
  },
  deliverButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: WHITE,
    marginLeft: 8,
  },

  mapButtonTouch: {
    borderRadius: 14,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  mapButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: BLUE,
    marginLeft: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 38, 58, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: WHITE,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 14,
    shadowColor: '#0F363F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  modalIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DDF8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: TEXT_DARK,
    marginBottom: 6,
  },
  modalMessage: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 22,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  modalCancelTouch: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  modalCancelButton: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: TEXT_DARK,
  },
  modalConfirmTouch: {
    flex: 1,
    borderRadius: 14,
    elevation: 6,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalConfirmButton: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: WHITE,
  },
});
