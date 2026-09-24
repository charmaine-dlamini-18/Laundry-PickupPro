import React, { useCallback, useMemo, useState } from 'react';
import {
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
import { useFocusEffect } from '@react-navigation/native';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import type { AdminStackParamList } from '../../navigation/AdminNavigator';
import { useAdmin } from '../../context/AdminContext';
import { useAuth } from '../../hooks/useAuth';
import type {
  AdminOrder,
  AdminOrderStatus,
} from '../../context/AdminContext';
import { getOrderTotal } from '../../context/AdminContext';
import { useDriverOrders } from '../../context/DriverOrdersContext';
import type { Order } from '../../navigation/DriverNavigator';
import AdminOrderDetailModal from '../../components/AdminOrderDetailModal';
import FancyAlert from '../../components/FancyAlert';
import { formatMoney } from '../../utils/format';
import { computeReportStats } from '../../services/reportsService';

type Props = NativeStackScreenProps<
  AdminStackParamList,
  'Dashboard'
>;

const TEXT_DARK = '#1F2933';
const TEXT_MUTED = '#7A869A';
const WHITE = '#FFFFFF';
const BLUE = '#2E6BFF';
const PURPLE = '#7857FF';
const AMBER = '#F4A928';
const GREEN = '#00B887';
const TEAL = '#0E9AA7';

const isWeb = Platform.OS === 'web';

const GRADIENT_HEADER = [BLUE, PURPLE] as const;

type Stat = {
  label: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  tint: string;
  color: string;
  onPress?: () => void;
};

type ActionCard = {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  tint: string;
  color: string;
  onPress: () => void;
};

const STATUS_META: Record<
  AdminOrderStatus,
  { tint: string; color: string }
> = {
  Pending: { tint: '#FFF0B8', color: '#E19A00' },
  'In Progress': { tint: '#E4EEFF', color: '#3278F6' },
  Completed: { tint: '#DDF8E8', color: '#00A85A' },
};

export default function AdminDashboardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { orders, drivers, refreshOrders, updateOrderStatus, assignDriver } = useAdmin();
  const { addOrder: addDriverOrder } = useDriverOrders();

  useFocusEffect(
    useCallback(() => {
      void refreshOrders();
    }, [refreshOrders]),
  );
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showNoPickups, setShowNoPickups] = useState(false);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const handleAssignDriver = (
    orderId: string,
    driverId: string,
    driverName: string,
    driverPhone: string,
  ) => {
    assignDriver(orderId, driverId, driverName, driverPhone);

    const adminOrder = orders.find((o) => o.id === orderId);
    if (adminOrder) {
      const driverOrder: Order = {
        id: String(Date.now()),
        orderNumber: adminOrder.id,
        type: 'Pickup',
        customer: adminOrder.customerName,
        phone: adminOrder.customerPhone,
        address: adminOrder.pickupAddress,
        time: adminOrder.pickupTime,
        status: 'Assigned',
        driver: driverName,
        notes: adminOrder.instructions || undefined,
      };
      addDriverOrder(driverOrder);
    }

    setSelectedOrder((current) =>
      current
        ? {
            ...current,
            driver: driverName,
            driverPhone,
            status:
              current.status === 'Pending' ? 'In Progress' : current.status,
          }
        : current
    );
  };

  const stats = useMemo<Stat[]>(() => {
    const { totalRevenue } = computeReportStats(orders);
    const unassigned = orders.filter((o) => !(o.driver ?? '').trim()).length;

    return [
      {
        label: 'Total Orders',
        value: String(orders.length),
        icon: 'receipt-text-outline',
        tint: '#E4EEFF',
        color: BLUE,
        onPress: () => navigation.navigate('Orders'),
      },
      {
        label: 'Active Drivers',
        value: String(drivers.length),
        icon: 'truck-outline',
        tint: '#EFEBFF',
        color: PURPLE,
        onPress: () => navigation.navigate('Drivers'),
      },
      {
        label: 'Pending Pickups',
        value: String(unassigned),
        icon: 'package-variant-closed',
        tint: '#FFF0B8',
        color: AMBER,
        onPress: () => {
          if (unassigned > 0) {
            navigation.navigate('Orders', { filter: 'Unassigned' });
          } else {
            setShowNoPickups(true);
          }
        },
      },
      {
        label: 'Total Revenue',
        value: formatMoney(totalRevenue),
        icon: 'cash-multiple',
        tint: '#DDF8E8',
        color: GREEN,
        onPress: () => navigation.navigate('Reports'),
      },
    ];
  }, [orders, drivers, navigation]);

  if (!fontsLoaded) return null;

  const actions: ActionCard[] = [
    {
      title: 'Customers',
      subtitle: 'View and manage customer accounts',
      icon: 'account-group-outline',
      tint: '#E4EEFF',
      color: BLUE,
      onPress: () => navigation.navigate('Users'),
    },
    {
      title: 'Drivers',
      subtitle: 'Manage drivers, vehicles and routes',
      icon: 'truck-outline',
      tint: '#EFEBFF',
      color: PURPLE,
      onPress: () => navigation.navigate('Drivers'),
    },
    {
      title: 'Services & Pricing',
      subtitle: 'Manage laundry prices and delivery fees',
      icon: 'tag-multiple-outline',
      tint: '#D6F0F4',
      color: TEAL,
      onPress: () => navigation.navigate('Payments'),
    },
  ];

  const recentOrders = orders.slice(0, 6);

  const firstName = user?.name?.trim().split(/\s+/)[0] ?? 'Admin';
  const avatarLetter = user?.name?.trim().charAt(0).toUpperCase() ?? 'A';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={GRADIENT_HEADER} style={styles.header}>
          <View style={styles.decorCircleOne} />
          <View style={styles.decorCircleTwo} />

          <View style={styles.topBar}>
            <View>
              <Text style={styles.title}>Dashboard</Text>
              <Text style={styles.subtitle}>Welcome back, {firstName}</Text>
            </View>

            <TouchableOpacity
              style={styles.avatar}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.statsGrid}>
            {stats.map((stat) => (
              <TouchableOpacity
                key={stat.label}
                style={styles.statCard}
                activeOpacity={stat.onPress ? 0.85 : 1}
                onPress={stat.onPress}
              >
                <View style={[styles.statIcon, { backgroundColor: stat.tint }]}>
                  <MaterialCommunityIcons name={stat.icon} size={22} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Manage</Text>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.title}
              style={styles.actionCard}
              activeOpacity={0.85}
              onPress={action.onPress}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.tint }]}>
                <MaterialCommunityIcons name={action.icon} size={22} color={action.color} />
              </View>
              <View style={styles.actionBody}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={TEXT_MUTED} />
            </TouchableOpacity>
          ))}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentOrders.map((order) => {
            const meta = STATUS_META[order.status];
            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                activeOpacity={0.85}
                onPress={() => {
                  setSelectedOrder(order);
                  setShowDetail(true);
                }}
              >
                <View style={[styles.orderIcon, { backgroundColor: meta.tint }]}>
                  <MaterialCommunityIcons name="package-variant-closed" size={20} color={meta.color} />
                </View>
                <View style={styles.orderBody}>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <Text style={styles.customerName}>{order.customerName}</Text>
                </View>
                <View style={styles.orderRight}>
                  <View style={[styles.statusBadge, { backgroundColor: meta.tint }]}>
                    <Text style={[styles.statusText, { color: meta.color }]}>
                      {order.status}
                    </Text>
                  </View>
                  <Text style={styles.amount}>
                    {formatMoney(getOrderTotal(order))}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <AdminOrderDetailModal
        visible={showDetail}
        order={selectedOrder}
        onClose={() => setShowDetail(false)}
        onUpdateStatus={(status) => {
          if (selectedOrder) {
            updateOrderStatus(selectedOrder.id, status);
            setSelectedOrder((current) =>
              current ? { ...current, status } : current
            );
          }
        }}
        onAssignDriver={handleAssignDriver}
      />

      <FancyAlert
        visible={showNoPickups}
        icon="package-variant-closed"
        iconColor="#E19A00"
        iconBackground="#FFF0B8"
        title="No pending pickups"
        message="There are no unassigned orders right now. "
        onClose={() => setShowNoPickups(false)}
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
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 30,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  decorCircleOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    top: -90,
    right: -60,
  },
  decorCircleTwo: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: -50,
    left: -40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: WHITE,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.82)',
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: WHITE,
  },
  content: {
    paddingHorizontal: isWeb ? 32 : 20,
    marginTop: 18,
    ...(isWeb ? { maxWidth: 800, alignSelf: 'center', width: '100%' } : {}),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  statCard: {
    width: isWeb ? '23%' : '48%',
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8ECF1',
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#26384A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: TEXT_DARK,
  },
  statLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: '#0E7A86',
    marginBottom: 14,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8ECF1',
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#26384A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionBody: {
    flex: 1,
  },
  actionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: TEXT_DARK,
  },
  actionSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  viewAll: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: BLUE,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8ECF1',
    padding: 14,
    marginTop: 12,
    elevation: 2,
    shadowColor: '#26384A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  orderIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderBody: {
    flex: 1,
  },
  orderId: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#0E7A86',
  },
  customerName: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
  },
  amount: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: TEXT_DARK,
  },
});
