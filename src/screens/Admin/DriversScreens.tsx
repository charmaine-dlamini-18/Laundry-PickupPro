import React, { useEffect, useMemo, useState } from 'react';
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
import type { AdminDriver } from '../../context/AdminContext';
import * as DriverServices from '../../services/driverServices';
import FancyAlert from '../../components/FancyAlert';
import { isEmail, isPhone, isRequired } from '../../utils/validation';

type Props = NativeStackScreenProps<AdminStackParamList, 'Drivers'>;

const BLUE = '#2E6BFF';
const BLUE_TINT = '#E4EEFF';
const PURPLE = '#7857FF';
const PURPLE_TINT = '#EFEBFF';
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

const SERVICE_AREAS = ['Woodstock', 'Observatory', 'Maitland'] as const;
type ServiceArea = (typeof SERVICE_AREAS)[number];

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
  driver: AdminDriver | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (draft: {
    name: string;
    email: string;
    password: string;
    phone: string;
    vehicle: string;
    registration: string;
    area: ServiceArea;
  }) => void;
};

function DriverFormModal({
  visible,
  driver,
  saving,
  onClose,
  onSave,
}: FormModalProps) {
  const [name, setName] = useState(driver?.name ?? '');
  const [email, setEmail] = useState(driver?.email ?? '');
  const [password, setPassword] = useState(driver?.password ?? '');
  const [phone, setPhone] = useState(driver?.phone ?? '');
  const [vehicle, setVehicle] = useState(driver?.vehicle ?? '');
  const [registration, setRegistration] = useState(driver?.registration ?? '');
  const [area, setArea] = useState<ServiceArea>(driver?.area ?? 'Woodstock');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleOpen = () => {
    setName(driver?.name ?? '');
    setEmail(driver?.email ?? '');
    setPassword(driver?.password ?? '');
    setPhone(driver?.phone ?? '');
    setVehicle(driver?.vehicle ?? '');
    setRegistration(driver?.registration ?? '');
    setArea(driver?.area ?? 'Woodstock');
    setErrors({});
  };

  const handleSave = () => {
    const next: Record<string, string> = {};
    if (!isRequired(name)) next.name = 'Enter the driver name';
    if (!isRequired(email)) next.email = 'Email is required';
    else if (!isEmail(email)) next.email = 'Enter a valid email address';
    if (!isRequired(password)) next.password = 'Password is required';
    else if (password.length < 8) next.password = 'Password must be at least 8 characters';
    if (!isPhone(phone)) next.phone = 'Enter a valid phone number';
    if (!isRequired(vehicle)) next.vehicle = 'Enter the vehicle';
    if (!isRequired(registration)) next.registration = 'Enter the number plate';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSave({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      phone: phone.trim(),
      vehicle: vehicle.trim(),
      registration: registration.trim().toUpperCase(),
      area,
    });
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
              {driver ? 'Edit Driver' : 'Add Driver'}
            </Text>
            <TouchableOpacity style={styles.formClose} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={20} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          <Text style={styles.formLabel}>Full name</Text>
          <View style={[styles.formInputField, errors.name && styles.formInputError]}>
            <MaterialCommunityIcons name="account-tie-outline" size={18} color={TEXT_MUTED} />
            <TextInput
              style={styles.formInput}
              value={name}
              onChangeText={setName}
              placeholder="Driver name"
              placeholderTextColor={TEXT_MUTED}
              autoCapitalize="words"
            />
          </View>
          {errors.name && <Text style={styles.formErrorText}>{errors.name}</Text>}

          <Text style={styles.formLabel}>Email (for login)</Text>
          <View style={[styles.formInputField, errors.email && styles.formInputError]}>
            <MaterialCommunityIcons name="email-outline" size={18} color={TEXT_MUTED} />
            <TextInput
              style={styles.formInput}
              value={email}
              onChangeText={setEmail}
              placeholder="driver@email.com"
              placeholderTextColor={TEXT_MUTED}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {errors.email && <Text style={styles.formErrorText}>{errors.email}</Text>}

          <Text style={styles.formLabel}>Password (for login)</Text>
          <View style={[styles.formInputField, errors.password && styles.formInputError]}>
            <MaterialCommunityIcons name="lock-outline" size={18} color={TEXT_MUTED} />
            <TextInput
              style={styles.formInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 8 characters"
              placeholderTextColor={TEXT_MUTED}
              secureTextEntry
            />
          </View>
          {errors.password && <Text style={styles.formErrorText}>{errors.password}</Text>}

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

          <Text style={styles.formLabel}>Vehicle</Text>
          <View style={[styles.formInputField, errors.vehicle && styles.formInputError]}>
            <MaterialCommunityIcons name="car-outline" size={18} color={TEXT_MUTED} />
            <TextInput
              style={styles.formInput}
              value={vehicle}
              onChangeText={setVehicle}
              placeholder="e.g. White Toyota Bakkie"
              placeholderTextColor={TEXT_MUTED}
              autoCapitalize="words"
            />
          </View>
          {errors.vehicle && <Text style={styles.formErrorText}>{errors.vehicle}</Text>}

          <Text style={styles.formLabel}>Number plate</Text>
          <View style={[styles.formInputField, errors.registration && styles.formInputError]}>
            <MaterialCommunityIcons name="credit-card-scan-outline" size={18} color={TEXT_MUTED} />
            <TextInput
              style={styles.formInput}
              value={registration}
              onChangeText={setRegistration}
              placeholder="e.g. CA 482-113"
              placeholderTextColor={TEXT_MUTED}
              autoCapitalize="characters"
            />
          </View>
          {errors.registration && <Text style={styles.formErrorText}>{errors.registration}</Text>}

          <Text style={styles.formLabel}>Service area</Text>
          <View style={styles.areaWrap}>
            {SERVICE_AREAS.map((option) => {
              const selected = area === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.areaChip, selected && styles.areaChipActive]}
                  activeOpacity={0.85}
                  onPress={() => setArea(option)}
                >
                  {selected ? (
                    <LinearGradient colors={GRADIENT_VIBRANT} style={styles.areaChipGradient}>
                      <MaterialCommunityIcons name="check" size={14} color={WHITE} />
                      <Text style={styles.areaChipTextActive}>{option}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.areaChipInner}>
                      <MaterialCommunityIcons name="map-marker-radius-outline" size={14} color={BLUE} />
                      <Text style={styles.areaChipText}>{option}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.formSaveTouch}
            activeOpacity={0.9}
            onPress={handleSave}
            disabled={saving}
          >
            <LinearGradient colors={GRADIENT_VIBRANT} style={[styles.formSave, saving && styles.formSaveDisabled]}>
              <MaterialCommunityIcons
                name={saving ? 'progress-clock' : 'content-save-outline'}
                size={16}
                color={WHITE}
              />
              <Text style={styles.formSaveText}>
                {saving
                  ? 'Saving…'
                  : driver
                    ? 'Save Changes'
                    : 'Add Driver'}
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
  driver: AdminDriver | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.detailSection}>
      <Text style={styles.detailSectionTitle}>{title}</Text>
      <View style={styles.detailSectionCard}>{children}</View>
    </View>
  );
}

type DetailRowProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  tint: string;
  color: string;
  label: string;
  value: string;
  trailing?: React.ReactNode;
  last?: boolean;
};

function DetailRow({
  icon,
  tint,
  color,
  label,
  value,
  trailing,
  last,
}: DetailRowProps) {
  return (
    <View style={[styles.detailInfoRow, last && styles.detailInfoRowLast]}>
      <View style={[styles.detailInfoIcon, { backgroundColor: tint }]}>
        <MaterialCommunityIcons name={icon} size={17} color={color} />
      </View>
      <View style={styles.detailInfoBody}>
        <Text style={styles.detailInfoLabel}>{label}</Text>
        <Text style={styles.detailInfoValue}>{value}</Text>
      </View>
      {trailing}
    </View>
  );
}

function DriverDetailModal({
  visible,
  driver,
  onClose,
  onEdit,
  onDelete,
}: DetailModalProps) {
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (visible) setShowPassword(false);
  }, [visible, driver?.id]);

  if (!driver) return null;

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

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.detailBody}
          >
            <View
              style={[
                styles.detailAvatar,
                { backgroundColor: driver.badgeColor },
              ]}
            >
              <Text style={[styles.detailAvatarText, { color: driver.initialsColor }]}>
                {driver.initials}
              </Text>
            </View>
            <Text style={styles.detailName}>{driver.name}</Text>
            <View style={styles.detailJoinedPill}>
              <MaterialCommunityIcons name="calendar-check-outline" size={12} color={BLUE} />
              <Text style={styles.detailJoinedPillText}>{driver.joinedDate}</Text>
            </View>

            <DetailSection title="Login details">
              <DetailRow
                icon="email-outline"
                tint={PURPLE_TINT}
                color={PURPLE}
                label="Email"
                value={driver.email}
              />
              <DetailRow
                icon="lock-outline"
                tint="#FDE7E8"
                color={DANGER}
                label="Password"
                value={
                  showPassword
                    ? driver.password
                    : '\u2022'.repeat(driver.password.length)
                }
                last
                trailing={
                  <TouchableOpacity
                    style={styles.eyeButton}
                    activeOpacity={0.7}
                    onPress={() => setShowPassword((prev) => !prev)}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={19}
                      color={TEXT_MUTED}
                    />
                  </TouchableOpacity>
                }
              />
            </DetailSection>

            <DetailSection title="Contact">
              <DetailRow
                icon="phone-outline"
                tint={BLUE_TINT}
                color={BLUE}
                label="Phone"
                value={driver.phone}
                last
              />
            </DetailSection>

            <DetailSection title="Vehicle">
              <DetailRow
                icon="car-outline"
                tint={GREEN_TINT}
                color={GREEN}
                label="Vehicle"
                value={driver.vehicle}
              />
              <DetailRow
                icon="credit-card-scan-outline"
                tint={AMBER_TINT}
                color={AMBER}
                label="Number plate"
                value={driver.registration}
                last
              />
            </DetailSection>

            <DetailSection title="Service area">
              <DetailRow
                icon="map-marker-radius-outline"
                tint={PURPLE_TINT}
                color={PURPLE}
                label="Area"
                value={driver.area}
                last
              />
            </DetailSection>
          </ScrollView>

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

export default function DriversScreen({ navigation }: Props) {
  const { drivers, addDriver, updateDriver, deleteDriver } = useAdmin();
  const [searchText, setSearchText] = useState('');
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [formVisible, setFormVisible] = useState(false);
  const [formDriver, setFormDriver] = useState<AdminDriver | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<AdminDriver | null>(null);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<{
    visible: boolean;
    message: string;
  }>({ visible: false, message: '' });
  const [success, setSuccess] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({ visible: false, title: '', message: '' });

  const filteredDrivers = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    if (!normalizedSearch) {
      return drivers;
    }

    return drivers.filter((driver) => {
      return (
        driver.name.toLowerCase().includes(normalizedSearch) ||
        driver.email.toLowerCase().includes(normalizedSearch) ||
        driver.vehicle.toLowerCase().includes(normalizedSearch) ||
        driver.area.toLowerCase().includes(normalizedSearch) ||
        driver.phone.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [drivers, searchText]);

  if (!fontsLoaded) return null;

  const openAdd = () => {
    setFormDriver(null);
    setFormVisible(true);
  };

  const openEdit = () => {
    setDetailVisible(false);
    setFormDriver(selectedDriver);
    setFormVisible(true);
  };

  const handleSave = async (draft: {
    name: string;
    email: string;
    password: string;
    phone: string;
    vehicle: string;
    registration: string;
    area: ServiceArea;
  }) => {
    setSaving(true);
    try {
      if (formDriver) {
        await DriverServices.updateDriver(formDriver.id, {
          name: draft.name,
          email: draft.email,
          password: draft.password,
          phone: draft.phone,
          vehicle: draft.vehicle,
          registration: draft.registration,
          area: draft.area,
        });
        updateDriver(formDriver.id, {
          name: draft.name,
          email: draft.email,
          password: draft.password,
          phone: draft.phone,
          vehicle: draft.vehicle,
          registration: draft.registration,
          area: draft.area,
          initials: initialsFor(draft.name),
        });
        setFormVisible(false);
        setSelectedDriver(null);
        setSuccess({
          visible: true,
          title: 'Driver updated',
          message: `${draft.name}'s details have been updated.`,
        });
      } else {
        const { id } = await DriverServices.createDriver({
          name: draft.name,
          email: draft.email,
          password: draft.password,
          phone: draft.phone,
          vehicle: draft.vehicle,
          registration: draft.registration,
          area: draft.area,
        });
        const palette = AVATAR_PALETTE[drivers.length % AVATAR_PALETTE.length];
        addDriver({
          id,
          initials: initialsFor(draft.name),
          name: draft.name,
          email: draft.email,
          password: draft.password,
          phone: draft.phone,
          vehicle: draft.vehicle,
          registration: draft.registration,
          area: draft.area,
          joinedDate: joinedStamp(),
          badgeColor: palette.badgeColor,
          initialsColor: palette.initialsColor,
        });
        setFormVisible(false);
        setSuccess({
          visible: true,
          title: 'Driver added',
          message: `${draft.name} can now sign in with the email and password provided.`,
        });
      }
    } catch (err) {
      setError({
        visible: true,
        message:
          err instanceof Error ? err.message : 'Something went wrong saving the driver.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedDriver) {
      setDeleteVisible(false);
      setDetailVisible(false);
      setSelectedDriver(null);
      return;
    }

    setSaving(true);
    try {
      await DriverServices.deleteDriver(selectedDriver.id);
      deleteDriver(selectedDriver.id);
      setDeleteVisible(false);
      setDetailVisible(false);
      setSelectedDriver(null);
      setSuccess({
        visible: true,
        title: 'Driver removed',
        message: 'The driver has been deleted.',
      });
    } catch (err) {
      setDeleteVisible(false);
      setError({
        visible: true,
        message:
          err instanceof Error ? err.message : 'Something went wrong deleting the driver.',
      });
    } finally {
      setSaving(false);
    }
  };

  const renderDriver = ({ item }: { item: AdminDriver }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => {
        setSelectedDriver(item);
        setDetailVisible(true);
      }}
    >
      <View style={[styles.avatar, { backgroundColor: item.badgeColor }]}>
        <Text style={[styles.avatarText, { color: item.initialsColor }]}>
          {item.initials}
        </Text>
      </View>

      <View style={styles.driverDetails}>
        <Text style={styles.driverName}>{item.name}</Text>
        <Text
          style={styles.driverEmail}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {item.email}
        </Text>
        <View style={styles.vehicleRow}>
          <MaterialCommunityIcons name="car-outline" size={12} color={TEXT_MUTED} />
          <Text style={styles.vehicleText}>{item.vehicle}</Text>
        </View>
      </View>

      <View style={[styles.areaPill, { backgroundColor: item.badgeColor }]}>
        <MaterialCommunityIcons
          name="map-marker-radius-outline"
          size={12}
          color={item.initialsColor}
        />
        <Text style={[styles.areaPillText, { color: item.initialsColor }]}>
          {item.area}
        </Text>
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
          <Text style={styles.headerTitle}>Drivers</Text>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={openAdd}
          >
            <MaterialCommunityIcons name="plus" size={22} color={WHITE} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={filteredDrivers}
        keyExtractor={(item) => item.id}
        renderItem={renderDriver}
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
                placeholder="Search drivers..."
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
              {filteredDrivers.length}{' '}
              {filteredDrivers.length === 1 ? 'driver' : 'drivers'}
            </Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name="truck-outline" size={48} color={BLUE} />
            </View>
            <Text style={styles.emptyTitle}>No drivers found</Text>
            <Text style={styles.emptySubtitle}>
              Try searching for another name, vehicle or area.
            </Text>
          </View>
        }
      />

      <DriverFormModal
        visible={formVisible}
        driver={formDriver}
        saving={saving}
        onClose={() => setFormVisible(false)}
        onSave={handleSave}
      />

      <DriverDetailModal
        visible={detailVisible}
        driver={selectedDriver}
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
            <Text style={styles.confirmTitle}>Delete driver</Text>
            <Text style={styles.confirmMessage}>
              {selectedDriver
                ? `Are you sure you want to remove ${selectedDriver.name}? This action cannot be undone.`
                : 'Are you sure you want to remove this driver?'}
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
        icon={success.title === 'Driver removed' ? 'account-remove-outline' : 'truck-check-outline'}
        iconColor={success.title === 'Driver removed' ? '#C2383C' : '#0B7A50'}
        iconBackground={success.title === 'Driver removed' ? '#FDE7E8' : '#DDF8E8'}
        title={success.title}
        message={success.message}
        onClose={() => setSuccess((prev) => ({ ...prev, visible: false }))}
      />

      <FancyAlert
        visible={error.visible}
        icon="alert-circle-outline"
        iconColor="#C2383C"
        iconBackground="#FDE7E8"
        title="Could not save driver"
        message={error.message}
        onClose={() => setError((prev) => ({ ...prev, visible: false }))}
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
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: TEXT_DARK,
  },
  driverEmail: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: TEXT_MUTED,
    marginTop: 1,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  vehicleText: {
    marginLeft: 4,
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: TEXT_MUTED,
  },
  areaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginRight: 10,
  },
  areaPillText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    marginLeft: 3,
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
  areaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  areaChip: {
    flexDirection: 'row',
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: WHITE,
  },
  areaChipActive: {
    borderColor: 'transparent',
  },
  areaChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  areaChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  areaChipText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: BLUE,
    marginLeft: 5,
  },
  areaChipTextActive: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: WHITE,
    marginLeft: 5,
  },
  formSaveTouch: {
    borderRadius: 14,
    marginTop: 6,
  },
  formSave: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    gap: 6,
    elevation: 3,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  formSaveDisabled: {
    opacity: 0.6,
    elevation: 0,
    shadowOpacity: 0,
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
    maxHeight: '86%',
    backgroundColor: WHITE,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#12263A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
  },
  detailClose: {
    position: 'absolute',
    top: 12,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F6F9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  detailBody: {
    alignItems: 'center',
    paddingTop: 22,
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  detailAvatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailAvatarText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
  },
  detailName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: TEXT_DARK,
    marginTop: 10,
  },
  detailJoinedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLUE_TINT,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
    marginTop: 6,
  },
  detailJoinedPillText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: BLUE,
    marginLeft: 5,
  },
  detailSection: {
    alignSelf: 'stretch',
    marginTop: 16,
  },
  detailSectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  detailSectionCard: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    backgroundColor: '#FBFCFE',
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  detailInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F5',
  },
  detailInfoRowLast: {
    borderBottomWidth: 0,
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
  eyeButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#F3F6F9',
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 20,
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
