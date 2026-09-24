import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
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
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import type { CustomerStackParamList } from '../../navigation/types';
import {
  deleteAddress,
  fetchSavedAddresses,
  saveAddress,
  type SavedAddress,
} from '../../services/addressService';

type Props = NativeStackScreenProps<CustomerStackParamList, 'Addresses'>;

const TEAL = '#0E9AA7';
const TEAL_TINT = '#D6F0F4';
const BLUE = '#2E6BFF';
const BLUE_TINT = '#E4EEFF';
const GREEN = '#00A85A';
const GREEN_TINT = '#DDF8E8';
const RED = '#E5484D';
const RED_TINT = '#FDE7E8';
const TEXT_DARK = '#1F2933';
const TEXT_MUTED = '#7A869A';
const BORDER = '#E8ECF1';
const WHITE = '#FFFFFF';

const GRADIENT_VIBRANT = ['#2E6BFF', '#7857FF'] as const;
const GRADIENT_GREEN = ['#00A85A', '#0B7A50'] as const;
const GRADIENT_DANGER = ['#E5484D', '#C2383C'] as const;

type EditingAddress = SavedAddress | null;

const isWeb = Platform.OS === 'web';

export default function AdressesScreen({ navigation }: Props) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EditingAddress>(null);
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [makeDefault, setMakeDefault] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SavedAddress | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetchSavedAddresses()
      .then((records) => {
        if (active) setAddresses(records);
      })
      .catch(() => {
        if (active) setAddresses([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!fontsLoaded) return null;

  const openAdd = () => {
    setEditing(null);
    setLabel('');
    setAddress('');
    setMakeDefault(addresses.length === 0);
    setShowModal(true);
  };

  const openEdit = (item: SavedAddress) => {
    setEditing(item);
    setLabel(item.label);
    setAddress(item.address);
    setMakeDefault(item.isDefault);
    setShowModal(true);
  };

  const handleDelete = (item: SavedAddress) => {
    setDeleteTarget(item);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      try {
        const records = await deleteAddress(deleteTarget.id);
        setAddresses(records);
      } catch (error) {
        Alert.alert(
          'Delete failed',
          error instanceof Error ? error.message : 'Something went wrong.'
        );
      }
    }
    setDeleteTarget(null);
  };

  const handleSave = async () => {
    const trimmedLabel = label.trim();
    const trimmedAddress = address.trim();
    if (!trimmedLabel || !trimmedAddress) {
      Alert.alert('Missing details', 'Please enter a label and address.');
      return;
    }

    setSaving(true);
    try {
      const records = await saveAddress({
        id: editing?.id,
        label: trimmedLabel,
        address: trimmedAddress,
        isDefault: makeDefault,
      });
      setAddresses(records);
      setShowModal(false);
    } catch (error) {
      Alert.alert(
        'Save failed',
        error instanceof Error ? error.message : 'Something went wrong.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (item: SavedAddress) => {
    try {
      const records = await saveAddress({
        id: item.id,
        label: item.label,
        address: item.address,
        isDefault: true,
      });
      setAddresses(records);
    } catch (error) {
      Alert.alert(
        'Update failed',
        error instanceof Error ? error.message : 'Something went wrong.'
      );
    }
  };

  const defaultAddress = addresses.find((a) => a.isDefault);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={GRADIENT_VIBRANT} style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Addresses</Text>
        <TouchableOpacity style={styles.headerAdd} onPress={openAdd}>
          <MaterialCommunityIcons name="plus" size={24} color={BLUE} />
        </TouchableOpacity>
      </LinearGradient>

      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          addresses.length > 0 ? (
            <View style={styles.defaultNotice}>
              <View style={styles.defaultNoticeIcon}>
                <MaterialCommunityIcons name="home-map-marker" size={20} color={GREEN} />
              </View>
              <Text style={styles.defaultNoticeText}>
                Default pickup address:{' '}
                <Text style={styles.defaultNoticeStrong}>
                  {defaultAddress?.address ?? '—'}
                </Text>
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="map-marker-plus-outline" size={52} color="#C4D2E0" />
            <Text style={styles.emptyTitle}>
              {loading ? 'Loading addresses…' : 'No saved addresses'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {loading
                ? 'Fetching your saved addresses.'
                : 'Add a home or work address to make booking faster.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, item.isDefault && styles.cardDefault]}>
            <View style={[styles.cardIcon, item.isDefault && styles.cardIconDefault]}>
              <MaterialCommunityIcons
                name={item.isDefault ? 'home-variant' : 'map-marker-outline'}
                size={22}
                color={item.isDefault ? TEAL : BLUE}
              />
            </View>
            <View style={styles.cardBody}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardLabel}>{item.label}</Text>
                {item.isDefault && (
                  <LinearGradient colors={GRADIENT_GREEN} style={styles.defaultBadge}>
                    <MaterialCommunityIcons name="check" size={10} color={WHITE} />
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </LinearGradient>
                )}
              </View>
              <Text style={[styles.cardAddress, item.isDefault && styles.cardAddressDefault]}>
                {item.address}
              </Text>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.cardAction, styles.cardActionEdit]}
                  onPress={() => openEdit(item)}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={14} color={BLUE} />
                  <Text style={styles.cardActionText}>Edit</Text>
                </TouchableOpacity>
                {!item.isDefault && (
                  <TouchableOpacity
                    style={[styles.cardAction, styles.cardActionTeal]}
                    onPress={() => handleSetDefault(item)}
                  >
                    <MaterialCommunityIcons name="check-circle-outline" size={14} color={TEAL} />
                    <Text style={[styles.cardActionText, styles.cardActionTextTeal]}>
                      Set default
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.cardAction,
                    styles.cardActionDanger,
                    !item.isDefault && styles.cardActionLast,
                  ]}
                  onPress={() => handleDelete(item)}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={14} color={RED} />
                  <Text style={[styles.cardActionText, styles.cardActionTextDanger]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editing ? 'Edit Address' : 'Add Address'}
            </Text>

            <Text style={styles.inputLabel}>Label</Text>
            <View style={styles.inputField}>
              <MaterialCommunityIcons name="tag-outline" size={18} color={TEXT_MUTED} />
              <TextInput
                style={styles.input}
                value={label}
                onChangeText={setLabel}
                placeholder="Home, Work…"
                placeholderTextColor={TEXT_MUTED}
              />
            </View>

            <Text style={styles.inputLabel}>Address</Text>
            <View style={styles.inputField}>
              <MaterialCommunityIcons name="map-marker-outline" size={18} color={TEXT_MUTED} />
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Street, Suburb, City"
                placeholderTextColor={TEXT_MUTED}
              />
            </View>

            <TouchableOpacity
              style={styles.defaultRow}
              onPress={() => setMakeDefault(!makeDefault)}
            >
              <View style={[styles.checkbox, makeDefault && styles.checkboxChecked]}>
                {makeDefault && (
                  <MaterialCommunityIcons name="check" size={13} color={WHITE} />
                )}
              </View>
              <Text style={styles.defaultRowText}>Use as default address</Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveTouch}
                activeOpacity={0.9}
                disabled={saving}
                onPress={handleSave}
              >
                <LinearGradient colors={GRADIENT_VIBRANT} style={styles.modalSave}>
                  <View style={styles.shine} />
                  <Text style={styles.modalSaveText}>
                    {saving ? 'Saving…' : 'Save'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={deleteTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTarget(null)}
      >
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteCard}>
            <View style={styles.deleteIconGlow}>
              <View style={styles.deleteIconCircle}>
                <MaterialCommunityIcons name="trash-can-outline" size={34} color={RED} />
              </View>
            </View>
            <Text style={styles.deleteTitle}>Delete Address?</Text>
            <Text style={styles.deleteMessage}>
              Remove{' '}
              <Text style={styles.deleteRef}>{deleteTarget?.label}</Text>
              {' – '}
              <Text style={styles.deleteRef}>{deleteTarget?.address}</Text>
              ?{'\n'}This cannot be undone.
            </Text>
            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={styles.deleteCancelTouch}
                activeOpacity={0.85}
                onPress={() => setDeleteTarget(null)}
              >
                <View style={styles.deleteCancelButton}>
                  <Text style={styles.deleteCancelText}>Keep Address</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmTouch}
                activeOpacity={0.85}
                onPress={confirmDelete}
              >
                <LinearGradient colors={GRADIENT_DANGER} style={styles.deleteConfirmButton}>
                  <View style={styles.deleteConfirmShine} />
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color={WHITE} />
                  <Text style={styles.deleteConfirmText}>Delete</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAdd: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1F2933',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: WHITE,
  },
  listContent: {
    padding: isWeb ? 32 : 20,
    paddingBottom: 40,
    ...(isWeb ? { maxWidth: 600, alignSelf: 'center', width: '100%' } : {}),
  },
  defaultNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN_TINT,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  defaultNoticeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  defaultNoticeText: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#3E7A5E',
  },
  defaultNoticeStrong: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#0B7A50',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#1F2933',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardDefault: {
    borderColor: '#B8F0D0',
    backgroundColor: '#F6FFF9',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: BLUE_TINT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardIconDefault: {
    backgroundColor: TEAL_TINT,
  },
  cardBody: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: TEXT_DARK,
  },
  defaultBadge: {
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  defaultBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 9,
    color: WHITE,
  },
  cardAddress: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 3,
  },
  cardAddressDefault: {
    color: '#0B7A50',
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 10,
  },
  cardAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
  },
  cardActionLast: {
    marginRight: 0,
  },
  cardActionEdit: {
    backgroundColor: BLUE_TINT,
  },
  cardActionTeal: {
    backgroundColor: TEAL_TINT,
  },
  cardActionDanger: {
    backgroundColor: RED_TINT,
  },
  cardActionText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: BLUE,
    marginLeft: 4,
  },
  cardActionTextTeal: {
    color: TEAL,
  },
  cardActionTextDanger: {
    color: RED,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 38, 58, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  modalTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: TEXT_DARK,
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: TEXT_MUTED,
    marginBottom: 8,
  },
  inputField: {
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
  input: {
    flex: 1,
    marginLeft: 10,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: TEXT_DARK,
  },
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#C3D1CF',
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: TEAL,
    borderColor: TEAL,
  },
  defaultRowText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#4A5C64',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancel: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 8,
  },
  modalCancelText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    color: TEXT_MUTED,
  },
  modalSaveTouch: {
    borderRadius: 12,
  },
  modalSave: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
  },
  modalSaveText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: WHITE,
  },
  shine: {
    position: 'absolute',
    top: -30,
    left: -30,
    width: 90,
    height: 120,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.14)',
    transform: [{ rotate: '20deg' }],
  },
  deleteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 38, 58, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  deleteCard: {
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
  deleteIconGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(229, 72, 77, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: RED_TINT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: TEXT_DARK,
    marginBottom: 8,
  },
  deleteMessage: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 21,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  deleteRef: {
    fontFamily: 'Poppins_600SemiBold',
    color: RED,
  },
  deleteActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  deleteCancelTouch: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: '#F9FAFB',
  },
  deleteCancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
  },
  deleteCancelText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#0E7A86',
  },
  deleteConfirmTouch: {
    flex: 1,
    borderRadius: 14,
    elevation: 6,
    shadowColor: RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  deleteConfirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
  },
  deleteConfirmShine: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 60,
    height: 80,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    transform: [{ rotate: '20deg' }],
  },
  deleteConfirmText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: WHITE,
    marginLeft: 6,
  },
});
