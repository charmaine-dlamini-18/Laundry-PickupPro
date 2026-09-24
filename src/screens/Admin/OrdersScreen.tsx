import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
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
import { useFocusEffect } from '@react-navigation/native';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import type { AdminStackParamList, AdminOrdersFilter } from '../../navigation/AdminNavigator';
import { useAdmin } from '../../context/AdminContext';
import type {
  AdminOrder,
  AdminOrderStatus,
} from '../../context/AdminContext';
import { getOrderTotal } from '../../context/AdminContext';
import { useDriverOrders } from '../../context/DriverOrdersContext';
import type { Order } from '../../navigation/DriverNavigator';
import AdminOrderDetailModal from '../../components/AdminOrderDetailModal';
import AdminAddOrderModal from '../../components/AdminAddOrderModal';
import FancyAlert from '../../components/FancyAlert';
import { formatMoney } from '../../utils/format';

type Props = NativeStackScreenProps<AdminStackParamList, 'Orders'>;

type FilterOption = AdminOrdersFilter;

const BLUE = '#2E6BFF';
const BLUE_TINT = '#E4EEFF';
const PURPLE = '#7857FF';
const TEXT_DARK = '#1F2933';
const TEXT_MUTED = '#7A869A';
const BORDER = '#E8ECF1';
const WHITE = '#FFFFFF';

const GRADIENT_VIBRANT = [BLUE, PURPLE] as const;

const STATUS_META: Record<
  AdminOrderStatus,
  { tint: string; color: string }
> = {
  Pending: { tint: '#FFF0B8', color: '#E19A00' },
  'In Progress': { tint: '#E4EEFF', color: '#3278F6' },
  Completed: { tint: '#DDF8E8', color: '#00A85A' },
};

const FILTERS: FilterOption[] = [
  'All',
  'Unassigned',
  'Pending',
  'In Progress',
  'Completed',
];

const isWeb = Platform.OS === 'web';

export default function OrdersScreen({ navigation, route }: Props) {
  const { orders, refreshOrders, updateOrderStatus, assignDriver, addOrder } = useAdmin();
  const { addOrder: addDriverOrder } = useDriverOrders();

  useFocusEffect(
    useCallback(() => {
      void refreshOrders();
    }, [refreshOrders]),
  );
  const [selectedFilter, setSelectedFilter] =
    useState<FilterOption>(route.params?.filter ?? 'All');
  const [searchText, setSearchText] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addedVisible, setAddedVisible] = useState(false);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesFilter =
        selectedFilter === 'All' ||
        (selectedFilter === 'Unassigned'
          ? !(order.driver ?? '').trim()
          : order.status === selectedFilter);

      const matchesSearch =
        normalizedSearch.length === 0 ||
        order.id.toLowerCase().includes(normalizedSearch) ||
        order.customerName.toLowerCase().includes(normalizedSearch) ||
        order.pickupAddress.toLowerCase().includes(normalizedSearch) ||
        order.deliveryAddress.toLowerCase().includes(normalizedSearch) ||
        order.driver.toLowerCase().includes(normalizedSearch) ||
        order.status.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [orders, searchText, selectedFilter]);

  if (!fontsLoaded) return null;

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

  const renderOrder = ({ item }: { item: AdminOrder }) => {
    const meta = STATUS_META[item.status];
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.card}
        onPress={() => {
          setSelectedOrder(item);
          setShowDetail(true);
        }}
      >
        <View style={[styles.cardAccent, { backgroundColor: meta.color }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={styles.orderId}>{item.id}</Text>
            <View style={[styles.statusPill, { backgroundColor: meta.tint }]}>
              <Text style={[styles.statusText, { color: meta.color }]}>
                {item.status}
              </Text>
            </View>
          </View>

          <Text style={styles.customerName}>{item.customerName}</Text>

          <View style={styles.addressSection}>
            <View style={styles.addressRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={13} color={TEXT_MUTED} />
              <Text style={styles.addressText}>Pickup: {item.pickupAddress}</Text>
            </View>
            <View style={styles.addressRow}>
              <MaterialCommunityIcons name="home-map-marker" size={13} color={TEXT_MUTED} />
              <Text style={styles.addressText}>Deliver: {item.deliveryAddress}</Text>
            </View>
          </View>

          <View style={styles.driverRow}>
            <MaterialCommunityIcons name="account-tie-outline" size={13} color={TEXT_MUTED} />
            <Text style={[styles.driverText, !item.driver && styles.unassignedText]}>
              Driver: {item.driver || 'Unassigned'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardBottomRow}>
            <Text style={styles.dateText}>
              {item.pickupDate} · {item.pickupTime}
            </Text>
            <Text style={styles.amount}>{formatMoney(getOrderTotal(item))}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={GRADIENT_VIBRANT} style={styles.headerBanner}>
        <View style={styles.shine} />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Orders</Text>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => setShowAdd(true)}
          >
            <MaterialCommunityIcons name="plus" size={22} color={WHITE} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.searchWrap}>
              <View style={styles.searchIconChip}>
                <MaterialCommunityIcons name="magnify" size={18} color={BLUE} />
              </View>
              <TextInput
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search orders..."
                placeholderTextColor={TEXT_MUTED}
                autoCapitalize="none"
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <MaterialCommunityIcons name="close-circle" size={18} color={TEXT_MUTED} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.filterRow}>
              {FILTERS.map((filter) => {
                const isSelected = selectedFilter === filter;
                return (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}
                    onPress={() => setSelectedFilter(filter)}
                  >
                    {isSelected ? (
                      <LinearGradient
                        colors={GRADIENT_VIBRANT}
                        style={styles.filterChipActiveGradient}
                      >
                        <Text style={[styles.filterText, styles.filterTextActive]}>{filter}</Text>
                      </LinearGradient>
                    ) : (
                      <Text style={styles.filterText}>{filter}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.resultText}>
              {filteredOrders.length}{' '}
              {filteredOrders.length === 1 ? 'order' : 'orders'} found
            </Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name="package-variant-closed" size={48} color={BLUE} />
            </View>
            <Text style={styles.emptyTitle}>
              {selectedFilter === 'Unassigned' && searchText.trim().length === 0
                ? 'No unassigned orders'
                : 'No orders found'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {selectedFilter === 'Unassigned' && searchText.trim().length === 0
                ? 'Every order has a driver assigned.'
                : 'Try another search term or filter.'}
            </Text>
          </View>
        }
      />

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

      <AdminAddOrderModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={(order) => {
          addOrder(order);
          setShowAdd(false);
          setAddedVisible(true);
        }}
      />

      <FancyAlert
        visible={addedVisible}
        icon="package-variant-closed-check"
        iconColor="#0B7A50"
        iconBackground="#DDF8E8"
        title="Order created"
        message="The new order has been added and is now pending pickup."
        onClose={() => setAddedVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },
  headerBanner: {
    marginBottom: 14,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: WHITE,
  },
  listContent: {
    paddingHorizontal: isWeb ? 32 : 20,
    paddingBottom: 40,
    ...(isWeb ? { maxWidth: 700, alignSelf: 'center', width: '100%' } : {}),
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    paddingHorizontal: 10,
    height: 50,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#26384A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  searchIconChip: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: BLUE_TINT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: TEXT_DARK,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterChip: {
    borderRadius: 20,
    marginRight: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: WHITE,
  },
  filterChipActive: {
    borderColor: 'transparent',
  },
  filterChipActiveGradient: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: TEXT_MUTED,
    paddingHorizontal: 14,
    paddingVertical: 8,
    textAlign: 'center',
  },
  filterTextActive: {
    color: WHITE,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  resultText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#26384A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  cardAccent: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#0E7A86',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
  },
  customerName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: TEXT_DARK,
    marginTop: 6,
  },
  addressSection: {
    marginTop: 6,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
  },
  addressText: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    lineHeight: 16,
    color: TEXT_MUTED,
    marginLeft: 5,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  driverText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: TEXT_MUTED,
    marginLeft: 5,
  },
  unassignedText: {
    color: '#E19A00',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF1F5',
    marginTop: 10,
    marginBottom: 9,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: TEXT_MUTED,
  },
  amount: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: TEXT_DARK,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIconWrap: {
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
