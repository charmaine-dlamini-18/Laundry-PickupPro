import React, { useMemo, useState } from 'react';
import {
  FlatList,
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

import type { AdminStackParamList } from '../../navigation/AdminNavigator';
import { useAdmin } from '../../context/AdminContext';
import type { AdminCustomer } from '../../context/AdminContext';
import FancyAlert from '../../components/FancyAlert';
import { isEmail, isPhone, isRequired } from '../../utils/validation';

type Props = NativeStackScreenProps<AdminStackParamList, 'Users'>;

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
const TEXT_DARK = '#1F2933';
const TEXT_MUTED = '#7A869A';
const BORDER = '#E8ECF1';
const WHITE = '#FFFFFF';
const DANGER = '#E5484D';

const GRADIENT_VIBRANT = [BLUE, PURPLE] as const;
const GRADIENT_RED = ['#FF7A70', '#E5484D'] as const;

const AVATAR_PALETTE = [
  { badgeColor: '#E8F2FF', initialsColor: '#3678E5' },
  { badgeColor: '#F0E9FF', initialsColor: '#7958D5' },
  { badgeColor: '#E7F8EE', initialsColor: '#21A86A' },
  { badgeColor: '#FFE8EF', initialsColor: '#D95B82' },
  { badgeColor: '#FFF1D6', initialsColor: '#E89A12' },
  { badgeColor: '#E9F7F8', initialsColor: '#228A92' },
  { badgeColor: '#FFF4E5', initialsColor: '#D78624' },
];

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0).toUpperCase() ?? '?';
  const second = parts[1]?.charAt(0).toUpperCase() ?? '';
  return `${first}${second}`;
}

function joinedStamp(): string {
  return `Joined ${new Date().toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })}`;
}

type FormModalProps = {
  visible: boolean;
  customer: AdminCustomer | null;
  onClose: () => void;
  onSave: (draft: {
    name: string;
    email: string;
    phone: string;
  }) => void;
};

function CustomerFormModal({
  visible,
  customer,
  onClose,
  onSave,
}: FormModalProps) {
  const [name, setName] = useState(customer?.name ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleOpen = () => {
    setName(customer?.name ?? '');
    setEmail(customer?.email ?? '');
    setPhone(customer?.phone ?? '');
    setErrors({});
  };

  const handleSave = () => {
    const next: Record<string, string> = {};
    if (!isRequired(name)) next.name = 'Enter the customer name';
    if (!isEmail(email)) next.email = 'Enter a valid email address';
    if (!isPhone(phone)) next.phone = 'Enter a valid phone number';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSave({ name: name.trim(), email: email.trim(), phone: phone.trim() });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={handleOpen}
    >
      <ScrollView
        style={styles.formOverlay}
        contentContainerStyle={styles.formOverlayContent}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.formBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>
              {customer ? 'Edit Customer' : 'Add Customer'}
            </Text>
            <TouchableOpacity style={styles.formClose} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={20} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          <Text style={styles.formLabel}>Full name</Text>
          <View style={[styles.formInputField, errors.name && styles.formInputError]}>
            <MaterialCommunityIcons name="account-outline" size={18} color={TEXT_MUTED} />
            <TextInput
              style={styles.formInput}
              value={name}
              onChangeText={setName}
              placeholder="Customer name"
              placeholderTextColor={TEXT_MUTED}
              autoCapitalize="words"
            />
          </View>
          {errors.name && <Text style={styles.formErrorText}>{errors.name}</Text>}

          <Text style={styles.formLabel}>Email address</Text>
          <View style={[styles.formInputField, errors.email && styles.formInputError]}>
            <MaterialCommunityIcons name="email-outline" size={18} color={TEXT_MUTED} />
            <TextInput
              style={styles.formInput}
              value={email}
              onChangeText={setEmail}
              placeholder="customer@example.com"
              placeholderTextColor={TEXT_MUTED}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          {errors.email && <Text style={styles.formErrorText}>{errors.email}</Text>}

          <Text style={styles.formLabel}>Phone number</Text>
          <View style={[styles.formInputField, errors.phone && styles.formInputError]}>
            <MaterialCommunityIcons name="phone-outline" size={18} color={TEXT_MUTED} />
            <TextInput
              style={styles.formInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="+27 82 000 0000"
              placeholderTextColor={TEXT_MUTED}
              keyboardType="phone-pad"
            />
          </View>
          {errors.phone && <Text style={styles.formErrorText}>{errors.phone}</Text>}

          <TouchableOpacity style={styles.formSaveTouch} activeOpacity={0.9} onPress={handleSave}>
            <LinearGradient colors={GRADIENT_VIBRANT} style={styles.formSave}>
              <Text style={styles.formSaveText}>
                {customer ? 'Save Changes' : 'Add Customer'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Modal>
  );
}

type DetailModalProps = {
  visible: boolean;
  customer: AdminCustomer | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function CustomerDetailModal({
  visible,
  customer,
  onClose,
  onEdit,
  onDelete,
}: DetailModalProps) {
  if (!customer) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.detailOverlay}>
        <View style={styles.detailCard}>
          <TouchableOpacity style={styles.detailClose} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={20} color={TEXT_MUTED} />
          </TouchableOpacity>

          <View
            style={[
              styles.detailAvatar,
              { backgroundColor: customer.badgeColor },
            ]}
          >
            <Text style={[styles.detailAvatarText, { color: customer.initialsColor }]}>
              {customer.initials}
            </Text>
          </View>
          <Text style={styles.detailName}>{customer.name}</Text>
          <Text style={styles.detailJoined}>{customer.joinedDate}</Text>

          <View style={styles.detailInfoCard}>
            <View style={styles.detailInfoRow}>
              <View style={[styles.detailInfoIcon, { backgroundColor: BLUE_TINT }]}>
                <MaterialCommunityIcons name="email-outline" size={17} color={BLUE} />
              </View>
              <View style={styles.detailInfoBody}>
                <Text style={styles.detailInfoLabel}>Email</Text>
                <Text style={styles.detailInfoValue}>{customer.email}</Text>
              </View>
            </View>
            <View style={styles.detailInfoRow}>
              <View style={[styles.detailInfoIcon, { backgroundColor: GREEN_TINT }]}>
                <MaterialCommunityIcons name="phone-outline" size={17} color={GREEN} />
              </View>
              <View style={styles.detailInfoBody}>
                <Text style={styles.detailInfoLabel}>Phone</Text>
                <Text style={styles.detailInfoValue}>{customer.phone}</Text>
              </View>
            </View>
            <View style={styles.detailInfoRow}>
              <View style={[styles.detailInfoIcon, { backgroundColor: PURPLE_TINT }]}>
                <MaterialCommunityIcons name="receipt-text-outline" size={17} color={PURPLE} />
              </View>
              <View style={styles.detailInfoBody}>
                <Text style={styles.detailInfoLabel}>Orders</Text>
                <Text style={styles.detailInfoValue}>
                  {customer.totalOrders} orders placed
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailActions}>
            <TouchableOpacity style={styles.detailEditButton} activeOpacity={0.9} onPress={onEdit}>
              <LinearGradient colors={GRADIENT_VIBRANT} style={styles.detailEditGradient}>
                <MaterialCommunityIcons name="pencil-outline" size={17} color={WHITE} />
                <Text style={styles.detailEditText}>Edit</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.detailDeleteButton} activeOpacity={0.9} onPress={onDelete}>
              <LinearGradient colors={GRADIENT_RED} style={styles.detailDeleteGradient}>
                <MaterialCommunityIcons name="trash-can-outline" size={17} color={WHITE} />
                <Text style={styles.detailDeleteText}>Delete</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const isWeb = Platform.OS === 'web';

export default function UsersScreen({ navigation }: Props) {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useAdmin();
  const [searchText, setSearchText] = useState('');
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [formVisible, setFormVisible] = useState(false);
  const [formCustomer, setFormCustomer] = useState<AdminCustomer | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [success, setSuccess] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({ visible: false, title: '', message: '' });

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    if (!normalizedSearch) {
      return customers;
    }

    return customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(normalizedSearch) ||
        customer.email.toLowerCase().includes(normalizedSearch) ||
        customer.phone.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [customers, searchText]);

  if (!fontsLoaded) return null;

  const openAdd = () => {
    setFormCustomer(null);
    setFormVisible(true);
  };

  const openEdit = () => {
    setDetailVisible(false);
    setFormCustomer(selectedCustomer);
    setFormVisible(true);
  };

  const handleSave = (draft: { name: string; email: string; phone: string }) => {
    if (formCustomer) {
      const patch = {
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        initials: initialsFor(draft.name),
      };
      updateCustomer(formCustomer.id, patch);
      setFormVisible(false);
      setSelectedCustomer(null);
      setSuccess({
        visible: true,
        title: 'Customer updated',
        message: `${draft.name}'s details have been updated.`,
      });
    } else {
      const palette = AVATAR_PALETTE[customers.length % AVATAR_PALETTE.length];
      addCustomer({
        id: `c${Date.now()}`,
        initials: initialsFor(draft.name),
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        totalOrders: 0,
        joinedDate: joinedStamp(),
        badgeColor: palette.badgeColor,
        initialsColor: palette.initialsColor,
      });
      setFormVisible(false);
      setSuccess({
        visible: true,
        title: 'Customer added',
        message: `${draft.name} has been added to your customers.`,
      });
    }
  };

  const handleConfirmDelete = async () => {
  if (!selectedCustomer) return;

  try {
    await deleteCustomer(selectedCustomer.id);

    setDeleteVisible(false);
    setDetailVisible(false);
    setSelectedCustomer(null);

    setSuccess({
      visible: true,
      title: 'Customer removed',
      message: 'The customer has been deleted.',
    });
  } catch (error) {
    setDeleteVisible(false);

    setSuccess({
      visible: true,
      title: 'Delete failed',
      message:
        error instanceof Error
          ? error.message
          : 'The customer could not be deleted.',
    });
  }
};

  const renderCustomer = ({ item }: { item: AdminCustomer }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => {
        setSelectedCustomer(item);
        setDetailVisible(true);
      }}
    >
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: item.badgeColor,
          },
        ]}
      >
        <Text
          style={[
            styles.avatarText,
            {
              color: item.initialsColor,
            },
          ]}
        >
          {item.initials}
        </Text>
      </View>

      <View style={styles.customerDetails}>
        <Text style={styles.customerName}>{item.name}</Text>
        <View style={styles.phoneRow}>
          <MaterialCommunityIcons name="phone-outline" size={12} color={TEXT_MUTED} />
          <Text style={styles.phoneNumber}>{item.phone}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.totalOrders}>{item.totalOrders} Orders</Text>
        <Text style={styles.joinedDate}>{item.joinedDate}</Text>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={20} color={TEXT_MUTED} />
    </TouchableOpacity>
  );

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
          <Text style={styles.headerTitle}>Customers</Text>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={openAdd}
          >
            <MaterialCommunityIcons name="plus" size={22} color={WHITE} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomer}
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
                placeholder="Search customers..."
                placeholderTextColor={TEXT_MUTED}
                autoCapitalize="none"
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <MaterialCommunityIcons name="close-circle" size={18} color={TEXT_MUTED} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.resultsText}>
              {filteredCustomers.length}{' '}
              {filteredCustomers.length === 1
                ? 'customer'
                : 'customers'}
            </Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name="account-search-outline" size={48} color={BLUE} />
            </View>
            <Text style={styles.emptyTitle}>No customers found</Text>
            <Text style={styles.emptySubtitle}>
              Try searching for another name or phone number.
            </Text>
          </View>
        }
      />

      <CustomerFormModal
        visible={formVisible}
        customer={formCustomer}
        onClose={() => setFormVisible(false)}
        onSave={handleSave}
      />

      <CustomerDetailModal
        visible={detailVisible}
        customer={selectedCustomer}
        onClose={() => setDetailVisible(false)}
        onEdit={openEdit}
        onDelete={() => setDeleteVisible(true)}
      />

      <Modal
        visible={deleteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteVisible(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <MaterialCommunityIcons name="account-remove-outline" size={28} color={DANGER} />
            </View>
            <Text style={styles.confirmTitle}>Delete customer</Text>
            <Text style={styles.confirmMessage}>
              {selectedCustomer
                ? `Are you sure you want to remove ${selectedCustomer.name}? This action cannot be undone.`
                : 'Are you sure you want to remove this customer?'}
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancelButton}
                onPress={() => setDeleteVisible(false)}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.confirmDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FancyAlert
        visible={success.visible}
        icon={success.title === 'Customer removed' ? 'account-remove-outline' : 'account-check-outline'}
        iconColor={success.title === 'Customer removed' ? '#C2383C' : '#0B7A50'}
        iconBackground={success.title === 'Customer removed' ? '#FDE7E8' : '#DDF8E8'}
        title={success.title}
        message={success.message}
        onClose={() => setSuccess((prev) => ({ ...prev, visible: false }))}
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
  resultsText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: TEXT_DARK,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  phoneNumber: {
    marginLeft: 4,
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: TEXT_MUTED,
  },
  orderDetails: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  totalOrders: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: BLUE,
  },
  joinedDate: {
    marginTop: 4,
    fontFamily: 'Poppins_400Regular',
    fontSize: 9,
    color: TEXT_MUTED,
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
  formOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 38, 58, 0.55)',
  },
  formOverlayContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  formBackdrop: {
    flex: 1,
  },
  formCard: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  formTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: TEXT_DARK,
  },
  formClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F6F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: TEXT_MUTED,
    marginBottom: 8,
  },
  formInputField: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  formInputError: {
    borderColor: DANGER,
  },
  formInput: {
    flex: 1,
    marginLeft: 10,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: TEXT_DARK,
  },
  formErrorText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: DANGER,
    marginTop: -8,
    marginBottom: 10,
  },
  formSaveTouch: {
    borderRadius: 14,
    marginTop: 6,
  },
  formSave: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  formSaveText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: WHITE,
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 38, 58, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  detailCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: WHITE,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 24,
    alignItems: 'center',
  },
  detailClose: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F6F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailAvatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailAvatarText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
  },
  detailName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: TEXT_DARK,
  },
  detailJoined: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  detailInfoCard: {
    alignSelf: 'stretch',
    backgroundColor: '#F9FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 16,
  },
  detailInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F5',
  },
  detailInfoIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },
  detailInfoBody: {
    flex: 1,
  },
  detailInfoLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: TEXT_MUTED,
  },
  detailInfoValue: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: TEXT_DARK,
    marginTop: 1,
  },
  detailActions: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginTop: 18,
  },
  detailEditButton: {
    flex: 1,
    borderRadius: 14,
    marginRight: 8,
  },
  detailEditGradient: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailEditText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: WHITE,
    marginLeft: 6,
  },
  detailDeleteButton: {
    flex: 1,
    borderRadius: 14,
    marginLeft: 8,
  },
  detailDeleteGradient: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailDeleteText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: WHITE,
    marginLeft: 6,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 38, 58, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  confirmIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FDE7E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  confirmTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: TEXT_DARK,
  },
  confirmMessage: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 22,
  },
  confirmCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  confirmCancelText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: TEXT_DARK,
  },
  confirmDeleteButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: DANGER,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  confirmDeleteText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: WHITE,
  },
});
