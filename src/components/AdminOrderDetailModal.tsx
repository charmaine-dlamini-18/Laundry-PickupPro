import React, { useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import type {
  AdminOrder,
  AdminOrderStatus,
} from '../context/AdminContext';
import {
  getOrderSubtotal,
  getOrderTotal,
  useAdmin,
} from '../context/AdminContext';
import { useDriverOrders } from '../context/DriverOrdersContext';
import type { Order } from '../navigation/DriverNavigator';
import { formatMoney } from '../utils/format';

type Icon = keyof typeof MaterialCommunityIcons.glyphMap;

type DetailRowProps = {
  icon: Icon;
  label: string;
  value: string;
  color: string;
  tint: string;
  last?: boolean;
};

type Props = {
  visible: boolean;
  order: AdminOrder | null;
  onClose: () => void;
  onUpdateStatus: (status: AdminOrderStatus) => void;
  onAssignDriver: (
    orderId: string,
    driverId: string,
    driverName: string,
    driverPhone: string,
  ) => void;
};

const BLUE = '#2E6BFF';
const BLUE_TINT = '#E4EEFF';
const PURPLE = '#7857FF';
const PURPLE_TINT = '#EFEBFF';
const TEAL = '#0E9AA7';
const TEAL_TINT = '#D6F0F4';
const GREEN = '#00A85A';
const GREEN_TINT = '#DDF8E8';
const AMBER = '#E8960C';
const AMBER_TINT = '#FFF0B8';
const TEAL_HEADING = '#0E7A86';
const TEXT_DARK = '#1F2933';
const TEXT_MUTED = '#7A869A';
const BORDER = '#E8ECF1';
const WHITE = '#FFFFFF';

const GRADIENT_VIBRANT = [BLUE, PURPLE] as const;

const STATUS_META: Record<
  AdminOrderStatus,
  { tint: string; color: string; gradient: readonly [string, string] }
> = {
  Pending: {
    tint: '#FFF0B8',
    color: '#E19A00',
    gradient: ['#F4A928', '#D97B00'] as const,
  },
  'In Progress': {
    tint: '#E4EEFF',
    color: '#3278F6',
    gradient: ['#2E6BFF', '#1A49D4'] as const,
  },
  Completed: {
    tint: '#DDF8E8',
    color: '#00A85A',
    gradient: ['#00B887', '#0B7A50'] as const,
  },
};

const STATUS_ORDER: AdminOrderStatus[] = [
  'Pending',
  'In Progress',
  'Completed',
];

function DetailRow({
  icon,
  label,
  value,
  color,
  tint,
  last,
}: DetailRowProps) {
  return (
    <View style={[styles.detailRow, last && styles.detailRowLast]}>
      <View style={[styles.detailIcon, { backgroundColor: tint }]}>
        <MaterialCommunityIcons name={icon} size={16} color={color} />
      </View>
      <View style={styles.detailBody}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const isWeb = Platform.OS === 'web';

export default function AdminOrderDetailModal({
  visible,
  order,
  onClose,
  onUpdateStatus,
  onAssignDriver,
}: Props) {
  const { drivers } = useAdmin();
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  if (!order) return null;

  const meta = STATUS_META[order.status];
  const subtotal = getOrderSubtotal(order);
  const total = getOrderTotal(order);
  const isUnassigned = !order.driver || order.driver.trim() === '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <LinearGradient colors={meta.gradient} style={styles.hero}>
            <View style={styles.shine} />
            <View style={styles.heroTopRow}>
              <View style={styles.heroIcon}>
                <MaterialCommunityIcons
                  name="package-variant-closed"
                  size={22}
                  color={WHITE}
                />
              </View>
              <View style={styles.heroText}>
                <Text style={styles.heroId}>{order.id}</Text>
                <Text style={styles.heroName}>{order.customerName}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                activeOpacity={0.85}
                onPress={onClose}
              >
                <MaterialCommunityIcons name="close" size={20} color={WHITE} />
              </TouchableOpacity>
            </View>
            <View style={styles.heroBottomRow}>
              <View style={styles.heroStatusPill}>
                <Text style={styles.heroStatusText}>{order.status}</Text>
              </View>
              <View style={styles.heroTotal}>
                <Text style={styles.heroTotalValue}>{formatMoney(total)}</Text>
                <Text style={styles.heroTotalLabel}>Total</Text>
              </View>
            </View>
          </LinearGradient>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.statusCard}>
              <Text style={styles.cardTitle}>Update Status</Text>
              <View style={styles.statusRow}>
                {STATUS_ORDER.map((status, index) => {
                  const sMeta = STATUS_META[status];
                  const isCurrent = order.status === status;
                  const isDone = STATUS_ORDER.indexOf(order.status) > index;
                  return (
                    <View key={status} style={styles.statusItemWrap}>
                      <TouchableOpacity
                        style={styles.statusNode}
                        activeOpacity={0.85}
                        onPress={() => {
                          if (!isCurrent) onUpdateStatus(status);
                        }}
                      >
                        {isCurrent ? (
                          <LinearGradient
                            colors={sMeta.gradient}
                            style={styles.statusNodeGradient}
                          >
                            <MaterialCommunityIcons
                              name="check-bold"
                              size={14}
                              color={WHITE}
                            />
                          </LinearGradient>
                        ) : isDone ? (
                          <View
                            style={[
                              styles.statusNodeCircle,
                              { backgroundColor: sMeta.tint },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="check-bold"
                              size={14}
                              color={sMeta.color}
                            />
                          </View>
                        ) : (
                          <View
                            style={[
                              styles.statusNodeCircle,
                              { backgroundColor: '#F3F6F9' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusNodeDot,
                                { color: TEXT_MUTED },
                              ]}
                            >
                              •
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                      <Text
                        style={[
                          styles.statusLabel,
                          isCurrent && { color: sMeta.color },
                        ]}
                      >
                        {status}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Items</Text>
              {order.items.map((item, index) => (
                <View
                  key={`${item.name}-${index}`}
                  style={[
                    styles.itemRow,
                    index === order.items.length - 1 && styles.itemRowLast,
                  ]}
                >
                  <View style={styles.itemIcon}>
                    <MaterialCommunityIcons
                      name="tshirt-crew-outline"
                      size={16}
                      color={BLUE}
                    />
                  </View>
                  <View style={styles.itemBody}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemQty}>Qty {item.quantity}</Text>
                  </View>
                  <Text style={styles.itemPrice}>
                    {formatMoney(item.price * item.quantity)}
                  </Text>
                </View>
              ))}
              <View style={styles.totalDivider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{formatMoney(subtotal)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Delivery fee</Text>
                <Text style={styles.totalValue}>
                  {formatMoney(order.deliveryFee)}
                </Text>
              </View>
              <View style={styles.grandRow}>
                <Text style={styles.grandLabel}>Total</Text>
                <Text style={styles.grandValue}>{formatMoney(total)}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Schedule &amp; Addresses</Text>
              <DetailRow
                icon="calendar-outline"
                label="Pickup"
                value={`${order.pickupDate} · ${order.pickupTime}`}
                color={AMBER}
                tint={AMBER_TINT}
              />
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
                icon="clock-outline"
                label="Placed"
                value={order.placedAt}
                color={TEAL}
                tint={TEAL_TINT}
                last
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Driver</Text>
              {isUnassigned ? (
                <>
                  <View style={styles.unassignedBanner}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#E19A00" />
                    <Text style={styles.unassignedText}>No driver assigned yet</Text>
                  </View>
                  <Text style={styles.assignLabel}>Select a driver:</Text>
                  <View style={styles.driverChips}>
                    {drivers.map((d) => {
                      const isSelected = selectedDriver === d.name;
                      return (
                        <TouchableOpacity
                          key={d.id}
                          style={[styles.driverChip, isSelected && styles.driverChipActive]}
                          activeOpacity={0.85}
                          onPress={() => setSelectedDriver(isSelected ? null : d.name)}
                        >
                          {isSelected ? (
                            <LinearGradient colors={GRADIENT_VIBRANT} style={styles.driverChipGradient}>
                              <MaterialCommunityIcons name="check" size={12} color={WHITE} />
                              <Text style={styles.driverChipTextActive}>{d.name}</Text>
                            </LinearGradient>
                          ) : (
                            <View style={styles.driverChipInner}>
                              <MaterialCommunityIcons name="account-tie-outline" size={12} color={BLUE} />
                              <Text style={styles.driverChipText}>{d.name}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {selectedDriver && (
                    <TouchableOpacity
                      style={styles.assignButton}
                      activeOpacity={0.85}
                      onPress={() => {
                        const driver = drivers.find((d) => d.name === selectedDriver);
                        if (driver) {
                          onAssignDriver(order.id, driver.id, driver.name, driver.phone);
                          setSelectedDriver(null);
                        }
                      }}
                    >
                      <LinearGradient colors={GRADIENT_VIBRANT} style={styles.assignButtonGradient}>
                        <MaterialCommunityIcons name="account-check-outline" size={16} color={WHITE} />
                        <Text style={styles.assignButtonText}>Assign {selectedDriver}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <>
                  <DetailRow
                    icon="account-tie-outline"
                    label="Driver"
                    value={order.driver}
                    color={BLUE}
                    tint={BLUE_TINT}
                  />
                  <DetailRow
                    icon="phone-outline"
                    label="Driver Phone"
                    value={order.driverPhone}
                    color={GREEN}
                    tint={GREEN_TINT}
                    last
                  />
                </>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Payment</Text>
              <DetailRow
                icon="credit-card-outline"
                label="Payment Method"
                value={order.paymentMethod}
                color={PURPLE}
                tint={PURPLE_TINT}
              />
              <DetailRow
                icon="phone-outline"
                label="Customer Phone"
                value={order.customerPhone}
                color={TEAL}
                tint={TEAL_TINT}
                last
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Special Instructions</Text>
              <Text style={styles.notesText}>
                {order.instructions || 'No special instructions added.'}
              </Text>
            </View>

            <TouchableOpacity style={styles.doneButton} activeOpacity={0.9} onPress={onClose}>
              <LinearGradient colors={GRADIENT_VIBRANT} style={styles.doneGradient}>
                <Text style={styles.doneText}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 38, 58, 0.55)',
    justifyContent: isWeb ? 'center' : 'flex-end',
    alignItems: isWeb ? 'center' : undefined,
    paddingHorizontal: isWeb ? 20 : 0,
  },
  backdropTouch: {
    flex: 1,
    ...(isWeb ? { width: '100%' } : {}),
  },
  sheet: {
    backgroundColor: '#F5F7FA',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderBottomLeftRadius: isWeb ? 26 : 0,
    borderBottomRightRadius: isWeb ? 26 : 0,
    maxHeight: isWeb ? '85%' : '92%',
    overflow: 'hidden',
    ...(isWeb ? { width: '100%', maxWidth: 520 } : {}),
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
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
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroText: {
    flex: 1,
    marginLeft: 12,
  },
  heroId: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  heroName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: WHITE,
    marginTop: 1,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  heroStatusPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroStatusText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: WHITE,
  },
  heroTotal: {
    alignItems: 'flex-end',
  },
  heroTotalValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: WHITE,
  },
  heroTotalLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scroll: {
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  statusCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
  },
  cardTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: TEAL_HEADING,
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statusItemWrap: {
    alignItems: 'center',
    flex: 1,
  },
  statusNode: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusNodeGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  statusNodeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusNodeDot: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
  },
  statusLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: TEXT_MUTED,
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F4',
  },
  itemRowLast: {
    borderBottomWidth: 0,
  },
  itemIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: BLUE_TINT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemBody: {
    flex: 1,
    marginLeft: 11,
  },
  itemName: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: TEXT_DARK,
  },
  itemQty: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: TEXT_MUTED,
    marginTop: 1,
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
    color: TEAL,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F4',
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailBody: {
    flex: 1,
    marginLeft: 11,
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
    paddingVertical: 6,
  },
  unassignedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  unassignedText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#E19A00',
    marginLeft: 6,
  },
  assignLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: TEXT_DARK,
    marginBottom: 8,
  },
  driverChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  driverChip: {
    flexDirection: 'row',
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: WHITE,
  },
  driverChipActive: {
    borderColor: 'transparent',
  },
  driverChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  driverChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  driverChipText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: BLUE,
    marginLeft: 4,
  },
  driverChipTextActive: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: WHITE,
    marginLeft: 4,
  },
  assignButton: {
    borderRadius: 12,
  },
  assignButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 12,
  },
  assignButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: WHITE,
    marginLeft: 6,
  },
  doneButton: {
    borderRadius: 16,
  },
  doneGradient: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: WHITE,
  },
});
