import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import BookingProgress from '../../components/BookingProgress';
import DateTimePickerModal from '../../components/DateTimePickerModal';
import FancyAlert from '../../components/FancyAlert';
import { useBooking } from '../../context/BookingContext';
import type { PickupType } from '../../context/BookingContext';
import type { BookingStackParamList } from '../../navigation/BookingNavigator';
import { colors } from '../../theme/colors';
import { formatBookingDate, formatMoney, formatTimeWindow } from '../../utils/format';
import { getDistance } from '../../services/distanceService';
import { DELIVERY_FEE, RATE_PER_KM } from '../../services/pricing';

type Props = NativeStackScreenProps<BookingStackParamList, 'Step1'>;

type PickerField = 'pickupDate' | 'pickupTime' | 'deliveryDate' | 'deliveryTime';

type SectionIcon = keyof typeof MaterialCommunityIcons.glyphMap;

const TEAL = '#0F363F';
const TEAL_TINT = '#E2ECEB';
const TEAL_TINT_2 = '#D3E5E3';
const TEXT_DARK = '#1F2933';
const TEXT_MUTED = '#7A869A';
const BORDER = '#E8ECF1';
const GREEN_TINT = '#DDF8E8';
const BLUE = '#2E6BFF';

const GRADIENT_VIBRANT = ['#2E6BFF', '#7857FF'] as const;
const GRADIENT_POP = ['#33C9B2', '#2E6BFF'] as const;
const GRADIENT_HERO = ['#17879B', '#0F4C63', '#0F363F'] as const;
const GRADIENT_NEXT = ['#17879B', '#0E5E73'] as const;
const GRADIENT_GREEN = ['#00A85A', '#0B7A50'] as const;

type Accent = {
  main: string;
  tint: string;
  tint2: string;
};

const ACCENTS: Record<string, Accent> = {
  teal: { main: TEAL, tint: TEAL_TINT, tint2: TEAL_TINT_2 },
  blue: { main: '#2E6BFF', tint: '#EAF0FF', tint2: '#D9E5FF' },
  purple: { main: '#7857FF', tint: '#F0EDFF', tint2: '#E0DBFF' },
  amber: { main: '#E8860B', tint: '#FFF3DC', tint2: '#FFE7B8' },
  green: { main: '#00A85A', tint: '#DDF8E8', tint2: '#B8F0D0' },
};

type SectionHeaderProps = {
  step: string;
  title: string;
  icon: SectionIcon;
  accent: Accent;
};

function SectionHeader({ step, title, icon, accent }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionHeaderStep, { backgroundColor: accent.tint }]}>
        <Text style={[styles.sectionHeaderStepText, { color: accent.main }]}>
          {step}
        </Text>
      </View>
      <View style={[styles.sectionHeaderIcon, { backgroundColor: accent.main }]}>
        <MaterialCommunityIcons name={icon} size={15} color={colors.white} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionHeaderLine} />
    </View>
  );
}

type DateTimeCardProps = {
  icon: SectionIcon;
  label: string;
  value: string;
  accent: Accent;
  onPress: () => void;
};

function DateTimeCard({ icon, label, value, accent, onPress }: DateTimeCardProps) {
  return (
    <TouchableOpacity style={styles.fieldCard} onPress={onPress}>
      <LinearGradient
        colors={[accent.tint, accent.tint2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fieldCardBg}
      >
        <View style={styles.fieldIcon}>
          <MaterialCommunityIcons name={icon} size={20} color={accent.main} />
        </View>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text
          style={[styles.fieldValue, { color: accent.main }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {value}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const isWeb = Platform.OS === 'web';

export default function BookPickupScreen({ navigation }: Props) {
  const { booking, updateBooking, laundromats } = useBooking();
  const scrollViewRef = useRef<ScrollView>(null);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [activePicker, setActivePicker] = useState<PickerField | null>(null);
  const [editingDelivery, setEditingDelivery] = useState(false);
  const [deliveryInput, setDeliveryInput] = useState('');
  const [homeAddressInput, setHomeAddressInput] = useState('');
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null);
  const [calculatingDistance, setCalculatingDistance] = useState(false);

  useEffect(() => {
    setHomeAddressInput(booking.pickupType === 'home' ? booking.pickupAddress : '');
  }, []);

  const calculateDistance = useCallback(async () => {
    if (!booking.pickupAddress.trim() || !booking.deliveryAddress.trim()) return;
    setCalculatingDistance(true);
    const result = await getDistance(booking.pickupAddress, booking.deliveryAddress, laundromats);
    setCalculatingDistance(false);
    if (result) {
      updateBooking({ distanceKm: result.distanceKm });
    }
  }, [booking.pickupAddress, booking.deliveryAddress, updateBooking, laundromats]);

  useEffect(() => {
    if (booking.pickupAddress.trim() && booking.deliveryAddress.trim()) {
      calculateDistance();
    }
  }, [booking.pickupAddress, booking.deliveryAddress, calculateDistance]);

  if (!fontsLoaded) return null;

  const handlePickupTypeSelect = (type: PickupType) => {
    updateBooking({ pickupType: type });
  };

  const handleHomeAddressSubmit = () => {
    const addr = homeAddressInput.trim();
    if (!addr) return;
    updateBooking({ pickupAddress: addr });
  };

  const handleSelectLaundromat = (id: string) => {
    updateBooking({ selectedLaundromatId: id });
  };

  const openDeliveryAddress = () => {
    setDeliveryInput(booking.deliveryAddress);
    setEditingDelivery(true);
  };

  const saveDeliveryAddress = () => {
    const addr = deliveryInput.trim();
    if (!addr) return;
    updateBooking({ deliveryAddress: addr });
    setEditingDelivery(false);
  };

  const pickerTitle: string =
    activePicker === 'pickupDate'
      ? 'Pickup Date'
      : activePicker === 'pickupTime'
        ? 'Pickup Time'
        : activePicker === 'deliveryDate'
          ? 'Delivery Date'
          : 'Delivery Time';

  const pickerValue: Date =
    activePicker === 'pickupDate'
      ? booking.pickupDate
      : activePicker === 'pickupTime'
        ? booking.pickupTime
        : activePicker === 'deliveryDate'
          ? booking.deliveryDate
          : booking.deliveryTime;

  const onPickerSelect = (date: Date) => {
    if (!activePicker) return;
    switch (activePicker) {
      case 'pickupDate': {
        updateBooking({ pickupDate: date });
        const isToday =
          date.getFullYear() === new Date().getFullYear() &&
          date.getMonth() === new Date().getMonth() &&
          date.getDate() === new Date().getDate();
        if (isToday) {
          const now = new Date();
          const currentHour = now.getHours();
          if (booking.pickupTime.getHours() <= currentHour) {
            const nextHour = Math.min(currentHour + 1, 22);
            const adjusted = new Date(date);
            adjusted.setHours(nextHour, 0, 0, 0);
            updateBooking({ pickupTime: adjusted });
          }
        }
        break;
      }
      case 'pickupTime':
        updateBooking({ pickupTime: date });
        break;
      case 'deliveryDate': {
        updateBooking({ deliveryDate: date });
        const isTodayDel =
          date.getFullYear() === new Date().getFullYear() &&
          date.getMonth() === new Date().getMonth() &&
          date.getDate() === new Date().getDate();
        if (isTodayDel) {
          const now = new Date();
          const currentHour = now.getHours();
          if (booking.deliveryTime.getHours() <= currentHour) {
            const nextHour = Math.min(currentHour + 1, 22);
            const adjusted = new Date(date);
            adjusted.setHours(nextHour, 0, 0, 0);
            updateBooking({ deliveryTime: adjusted });
          }
        }
        break;
      }
      case 'deliveryTime':
        updateBooking({ deliveryTime: date });
        break;
    }
  };

  const handleNext = () => {
    const missing: string[] = [];
    if (!booking.pickupAddress.trim()) {
      missing.push('a pickup address');
    }
    if (!booking.deliveryAddress.trim()) {
      missing.push('a delivery address');
    }
    if (missing.length > 0) {
      setAlert({
        title: 'Almost there',
        message: `Please add ${missing.join(' and ')} before continuing.`,
      });
      return;
    }
    navigation.navigate('Step2');
  };

  const showBothAddresses = Boolean(booking.pickupAddress.trim() && booking.deliveryAddress.trim());

  return (
    <SafeAreaView style={styles.safeArea}>
      <BookingHeader
        title="Book a Pickup"
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scroll}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
        >
        <LinearGradient colors={GRADIENT_HERO} style={styles.hero}>
          <View style={styles.heroCircleA} />
          <View style={styles.heroCircleB} />
          <View style={styles.heroCircleC} />
          <View style={styles.heroRow}>
            <View style={styles.heroContent}>
              <View style={styles.heroTitleRow}>
                <Text style={styles.heroTitle}>Schedule your </Text>
                <LinearGradient
                  colors={GRADIENT_POP}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.heroHighlight}
                >
                  <Text style={styles.heroHighlightText}>pickup</Text>
                </LinearGradient>
              </View>
              <Text style={styles.heroSubtitle}>
                Tell us where and when to collect your laundry.
              </Text>
            </View>
            <View style={styles.heroIconWrap}>
              <LinearGradient
                colors={GRADIENT_VIBRANT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroIconCircle}
              >
                <MaterialCommunityIcons
                  name="truck-delivery-outline"
                  size={40}
                  color={colors.white}
                />
              </LinearGradient>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.progressWrap}>
          <BookingProgress current={1} title="Pickup details" />
        </View>

        <View style={styles.section}>
          <SectionHeader
            step="1"
            title="Where is your pickup?"
            icon="map-marker-question-outline"
            accent={ACCENTS.blue}
          />

          <View style={styles.typeRow}>
            <TouchableOpacity
              style={styles.typeCard}
              onPress={() => handlePickupTypeSelect('home')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={booking.pickupType === 'home' ? [ACCENTS.blue.tint, ACCENTS.blue.tint2] : ['#F5F7FA', '#EDF0F5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.typeCardInner,
                  booking.pickupType === 'home' && styles.typeCardSelected,
                ]}
              >
                <View style={[styles.typeIcon, booking.pickupType === 'home' && styles.typeIconActive]}>
                  <MaterialCommunityIcons
                    name="home-variant"
                    size={28}
                    color={booking.pickupType === 'home' ? BLUE : TEXT_MUTED}
                  />
                </View>
                <Text style={[styles.typeLabel, booking.pickupType === 'home' && styles.typeLabelActive]}>
                  My Address
                </Text>
                <Text style={styles.typeSublabel}>
                  We pick up from your door
                </Text>
                {booking.pickupType === 'home' && (
                  <View style={styles.typeCheck}>
                    <MaterialCommunityIcons name="check-circle" size={20} color={BLUE} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.typeCard}
              onPress={() => handlePickupTypeSelect('laundromat')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={booking.pickupType === 'laundromat' ? [ACCENTS.green.tint, ACCENTS.green.tint2] : ['#F5F7FA', '#EDF0F5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.typeCardInner,
                  booking.pickupType === 'laundromat' && styles.typeCardSelected,
                ]}
              >
                <View style={[styles.typeIcon, booking.pickupType === 'laundromat' && styles.typeIconActiveGreen]}>
                  <MaterialCommunityIcons
                    name="washing-machine"
                    size={28}
                    color={booking.pickupType === 'laundromat' ? '#00A85A' : TEXT_MUTED}
                  />
                </View>
                <Text style={[styles.typeLabel, booking.pickupType === 'laundromat' && styles.typeLabelActiveGreen]}>
                  At Laundromat
                </Text>
                <Text style={styles.typeSublabel}>
                  Drop off at a partner
                </Text>
                {booking.pickupType === 'laundromat' && (
                  <View style={styles.typeCheck}>
                    <MaterialCommunityIcons name="check-circle" size={20} color="#00A85A" />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {booking.pickupType === 'home' && (
          <View style={styles.section}>
            <SectionHeader
              step="2"
              title="Your address"
              icon="home-variant-outline"
              accent={ACCENTS.blue}
            />
            <LinearGradient
              colors={[ACCENTS.blue.tint, ACCENTS.blue.tint2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.inputCard}
            >
              <View style={styles.inputCardIcon}>
                <MaterialCommunityIcons name="map-marker-outline" size={20} color={BLUE} />
              </View>
              <TextInput
                style={styles.inputCardText}
                value={homeAddressInput}
                onChangeText={setHomeAddressInput}
                onBlur={handleHomeAddressSubmit}
                placeholder="Enter your address (e.g. 172 Sir Lowry Rd, Woodstock)"
                placeholderTextColor={TEXT_MUTED}
                returnKeyType="done"
              />
            </LinearGradient>

            {booking.pickupAddress.trim() && booking.assignedLaundromat ? (
              <View style={styles.laundromatCard}>
                <LinearGradient
                  colors={[GREEN_TINT, '#B8F0D0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.laundromatCardBg}
                >
                  <View style={styles.laundromatIcon}>
                    <MaterialCommunityIcons name="washing-machine" size={20} color="#00A85A" />
                  </View>
                  <View style={styles.laundromatBody}>
                    <Text style={styles.laundromatLabel}>Closest laundromat</Text>
                    <Text style={styles.laundromatName}>{booking.assignedLaundromat.name}</Text>
                    <Text style={styles.laundromatAddress}>{booking.assignedLaundromat.address}</Text>
                  </View>
                </LinearGradient>
              </View>
            ) : null}

            {booking.assignedLaundromat && (
              <View style={styles.deliveryInfo}>
                <View style={styles.deliveryInfoIcon}>
                  <MaterialCommunityIcons name="information-outline" size={16} color="#2E6BFF" />
                </View>
                <Text style={styles.deliveryInfoText}>
                  Your laundry will be delivered to {booking.assignedLaundromat.name} after washing.
                </Text>
              </View>
            )}
          </View>
        )}

        {booking.pickupType === 'laundromat' && (
          <View style={styles.section}>
            <SectionHeader
              step="2"
              title="Choose a laundromat"
              icon="washing-machine"
              accent={ACCENTS.green}
            />
            {laundromats.reduce<React.ReactNode[]>((acc, l, i) => {
              const prev = i > 0 ? laundromats[i - 1] : null;
              if (!prev || prev.area !== l.area) {
                acc.push(
                  <Text key={`area-${l.area}`} style={styles.areaHeader}>
                    {l.area}
                  </Text>
                );
              }
              acc.push(
                <TouchableOpacity
                  key={l.id}
                  style={[
                    styles.laundromatSelectCard,
                    booking.selectedLaundromatId === l.id && styles.laundromatSelectCardActive,
                  ]}
                  onPress={() => handleSelectLaundromat(l.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.laundromatSelectIcon}>
                    <MaterialCommunityIcons
                      name="washing-machine"
                      size={22}
                      color={booking.selectedLaundromatId === l.id ? '#00A85A' : TEXT_MUTED}
                    />
                  </View>
                  <View style={styles.laundromatSelectBody}>
                    <Text style={styles.laundromatSelectName}>{l.name}</Text>
                    <Text style={styles.laundromatSelectAddress}>{l.address}</Text>
                  </View>
                  {booking.selectedLaundromatId === l.id ? (
                    <MaterialCommunityIcons name="check-circle" size={22} color="#00A85A" />
                  ) : (
                    <MaterialCommunityIcons name="chevron-right" size={20} color={TEXT_MUTED} />
                  )}
                </TouchableOpacity>
              );
              return acc;
            }, [])}

            {booking.selectedLaundromatId && (
              <>
                <SectionHeader
                  step="3"
                  title="Delivery address"
                  icon="home-variant-outline"
                  accent={ACCENTS.purple}
                />
                <TouchableOpacity
                  style={styles.deliveryCard}
                  onPress={openDeliveryAddress}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[ACCENTS.purple.tint, ACCENTS.purple.tint2]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.deliveryCardBg}
                  >
                    <View style={styles.deliveryCardIcon}>
                      <MaterialCommunityIcons name="home-variant-outline" size={22} color="#7857FF" />
                    </View>
                    <View style={styles.deliveryCardBody}>
                      <Text
                        style={[styles.deliveryCardText, !booking.deliveryAddress.trim() && styles.deliveryCardPlaceholder]}
                        numberOfLines={2}
                      >
                        {booking.deliveryAddress || 'Enter your delivery address'}
                      </Text>
                      <Text style={styles.deliveryCardHint}>Where we deliver your clean laundry</Text>
                    </View>
                    <View style={styles.deliveryCardPill}>
                      <Text style={styles.deliveryCardPillText}>
                        {booking.deliveryAddress.trim() ? 'Change' : 'Add'}
                      </Text>
                      <MaterialCommunityIcons name="chevron-right" size={14} color="#7857FF" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {showBothAddresses && (
          <View style={styles.section}>
            <SectionHeader
              step={booking.pickupType === 'home' ? '3' : '4'}
              title="How many bags?"
              icon="bag-personal-outline"
              accent={ACCENTS.amber}
            />
            <View style={styles.bagCard}>
              <LinearGradient
                colors={[ACCENTS.amber.tint, ACCENTS.amber.tint2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bagCardBg}
              >
                <View style={styles.bagCounterRow}>
                  <TouchableOpacity
                    style={[styles.bagBtnFancy, booking.bagCount <= 1 && styles.bagBtnDisabledFancy]}
                    disabled={booking.bagCount <= 1}
                    activeOpacity={0.8}
                    onPress={() => updateBooking({ bagCount: booking.bagCount - 1 })}
                  >
                    <LinearGradient
                      colors={booking.bagCount <= 1 ? ['#E8ECF1', '#E8ECF1'] : [ACCENTS.amber.main, '#D47A08']}
                      style={styles.bagBtnGradient}
                    >
                      <MaterialCommunityIcons
                        name="minus"
                        size={20}
                        color={booking.bagCount <= 1 ? '#C6CFD6' : '#FFF'}
                      />
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.bagCountDisplay}>
                    <Text style={styles.bagCountNumber}>{booking.bagCount}</Text>
                    <Text style={styles.bagUnitText}>
                      {booking.bagCount === 1 ? 'bag' : 'bags'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.bagBtnFancy, booking.bagCount >= 20 && styles.bagBtnDisabledFancy]}
                    disabled={booking.bagCount >= 20}
                    activeOpacity={0.8}
                    onPress={() => updateBooking({ bagCount: booking.bagCount + 1 })}
                  >
                    <LinearGradient
                      colors={booking.bagCount >= 20 ? ['#E8ECF1', '#E8ECF1'] : [ACCENTS.amber.main, '#D47A08']}
                      style={styles.bagBtnGradient}
                    >
                      <MaterialCommunityIcons
                        name="plus"
                        size={20}
                        color={booking.bagCount >= 20 ? '#C6CFD6' : '#FFF'}
                      />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        )}

        {showBothAddresses && (
          <View style={styles.section}>
            <SectionHeader
              step={booking.pickupType === 'home' ? '4' : '5'}
              title="Price Estimate"
              icon="cash-check"
              accent={ACCENTS.green}
            />
            <View style={styles.priceEstimate}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Delivery fee</Text>
                <Text style={styles.priceValue}>{formatMoney(DELIVERY_FEE)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  {calculatingDistance
                    ? 'Calculating distance...'
                    : `Distance: ${booking.distanceKm > 0 ? booking.distanceKm.toFixed(1) : '0'} km × ${formatMoney(RATE_PER_KM)}/km`}
                </Text>
                <Text style={styles.priceValue}>
                  {calculatingDistance ? (
                    <ActivityIndicator size="small" color={BLUE} />
                  ) : (
                    formatMoney(booking.distanceFee)
                  )}
                </Text>
              </View>
              <View style={styles.priceDivider} />
              <View style={styles.priceRow}>
                <Text style={styles.priceTotalLabel}>Estimated total</Text>
                <Text style={styles.priceTotalValue}>{formatMoney(booking.total)}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <SectionHeader
            step={booking.pickupType === 'home' ? '5' : '6'}
            title="Schedule"
            icon="calendar-clock"
            accent={ACCENTS.purple}
          />
          <View style={styles.fieldRow}>
            <DateTimeCard
              icon="calendar-outline"
              label="Pickup Date"
              value={formatBookingDate(booking.pickupDate)}
              accent={ACCENTS.blue}
              onPress={() => setActivePicker('pickupDate')}
            />
            <DateTimeCard
              icon="clock-outline"
              label="Pickup Time"
              value={formatTimeWindow(booking.pickupTime)}
              accent={ACCENTS.blue}
              onPress={() => setActivePicker('pickupTime')}
            />
          </View>
          <View style={styles.fieldRow}>
            <DateTimeCard
              icon="calendar-outline"
              label="Delivery Date"
              value={formatBookingDate(booking.deliveryDate)}
              accent={ACCENTS.purple}
              onPress={() => setActivePicker('deliveryDate')}
            />
            <DateTimeCard
              icon="clock-outline"
              label="Delivery Time"
              value={formatTimeWindow(booking.deliveryTime)}
              accent={ACCENTS.purple}
              onPress={() => setActivePicker('deliveryTime')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader
            step={booking.pickupType === 'home' ? '6' : '7'}
            title="Special Instructions"
            icon="note-edit-outline"
            accent={ACCENTS.amber}
          />
          <LinearGradient
            colors={[ACCENTS.amber.tint, ACCENTS.amber.tint2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.instructionsWrap}
          >
            <View style={styles.instructionsIcon}>
              <MaterialCommunityIcons
                name="note-edit-outline"
                size={18}
                color={ACCENTS.amber.main}
              />
            </View>
            <TextInput
              style={styles.instructionsInput}
              placeholder="Anything else we should know? (optional)"
              placeholderTextColor={TEXT_MUTED}
              value={booking.instructions}
              onChangeText={(text) => updateBooking({ instructions: text })}
              onFocus={() =>
                scrollViewRef.current?.scrollToEnd({ animated: true })
              }
              multiline
              textAlignVertical="top"
            />
          </LinearGradient>
        </View>

        <View style={styles.submitWrap}>
          <Text style={styles.footerHint}>
            You can review everything before confirming.
          </Text>
          <TouchableOpacity
            style={styles.nextButtonTouch}
            activeOpacity={0.9}
            onPress={handleNext}
          >
            <LinearGradient colors={GRADIENT_NEXT} style={styles.nextButton}>
              <MaterialCommunityIcons
                name="rocket-launch-outline"
                size={20}
                color={colors.white}
                style={styles.nextIcon}
              />
              <Text style={styles.nextButtonText}>Next</Text>
              <View style={styles.nextArrow}>
                <MaterialCommunityIcons name="arrow-right" size={18} color={colors.white} />
              </View>
              <View style={styles.nextShine} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <DateTimePickerModal
        visible={activePicker !== null}
        mode={activePicker === 'pickupTime' || activePicker === 'deliveryTime' ? 'time' : 'date'}
        title={pickerTitle}
        value={pickerValue}
        onChange={onPickerSelect}
        onClose={() => setActivePicker(null)}
      />

      <FancyAlert
        visible={alert !== null}
        title={alert?.title ?? ''}
        message={alert?.message ?? ''}
        icon="alert-circle-outline"
        iconColor="#E5484D"
        iconBackground="#FDE7E8"
        buttonText="Got it"
        onClose={() => setAlert(null)}
      />

      <Modal
        visible={editingDelivery}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingDelivery(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delivery Address</Text>
            <TextInput
              style={styles.modalInput}
              value={deliveryInput}
              onChangeText={setDeliveryInput}
              placeholder="Enter delivery address"
              placeholderTextColor={TEXT_MUTED}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setEditingDelivery(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={saveDeliveryAddress}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: TEAL },
  scroll: { backgroundColor: '#F3F6FC' },
  container: {
    paddingBottom: 36,
    ...(isWeb ? { paddingHorizontal: 32, maxWidth: 600, alignSelf: 'center', width: '100%' } : {}),
  },
  hero: {
    borderRadius: 28,
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 26,
    paddingHorizontal: 22,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
  },
  heroCircleA: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(120, 87, 255, 0.22)', top: -70, right: -50,
  },
  heroCircleB: {
    position: 'absolute', width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(46, 107, 255, 0.24)', bottom: -32, right: 110,
  },
  heroCircleC: {
    position: 'absolute', width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(51, 201, 178, 0.28)', top: 18, left: -14,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroContent: { flex: 1, paddingRight: 12 },
  heroTitle: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: colors.white },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  heroHighlight: { borderRadius: 9, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 2 },
  heroHighlightText: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: colors.white },
  heroSubtitle: {
    fontFamily: 'Poppins_400Regular', fontSize: 12.5, lineHeight: 19,
    color: 'rgba(255, 255, 255, 0.82)', marginTop: 4,
  },
  heroIconWrap: { alignItems: 'center' },
  heroIconCircle: {
    width: 82, height: 82, borderRadius: 41, borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)', justifyContent: 'center', alignItems: 'center',
  },
  progressWrap: { paddingHorizontal: 20, paddingTop: 20 },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionHeaderStep: {
    width: 28, height: 28, borderRadius: 9, backgroundColor: TEAL_TINT,
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  sectionHeaderStepText: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: TEAL },
  sectionHeaderIcon: {
    width: 26, height: 26, borderRadius: 8, backgroundColor: TEAL,
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  sectionTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: TEXT_DARK },
  sectionHeaderLine: { flex: 1, height: 1, backgroundColor: BORDER, marginLeft: 10 },

  typeRow: { flexDirection: 'row', gap: 12 },
  typeCard: { flex: 1, borderRadius: 18, overflow: 'hidden' },
  typeCardInner: {
    padding: 16, borderRadius: 18, borderWidth: 2, borderColor: 'transparent',
    alignItems: 'center', minHeight: 130, justifyContent: 'center',
  },
  typeCardSelected: { borderColor: BLUE },
  typeIcon: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: colors.white,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  typeIconActive: { backgroundColor: '#EAF0FF' },
  typeIconActiveGreen: { backgroundColor: '#DDF8E8' },
  typeLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: TEXT_DARK, textAlign: 'center' },
  typeLabelActive: { color: BLUE },
  typeLabelActiveGreen: { color: '#00A85A' },
  typeSublabel: {
    fontFamily: 'Poppins_400Regular', fontSize: 11, color: TEXT_MUTED,
    textAlign: 'center', marginTop: 3,
  },
  typeCheck: { position: 'absolute', top: 10, right: 10 },

  inputCard: {
    borderRadius: 16, flexDirection: 'row', alignItems: 'center',
    padding: 14, overflow: 'hidden', marginBottom: 12,
  },
  inputCardIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.white,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  inputCardText: {
    flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 14, color: TEXT_DARK,
    padding: 0,
  },

  laundromatCard: {
    borderRadius: 16, marginBottom: 12, overflow: 'hidden',
    elevation: 1, shadowColor: '#26384A', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 8,
  },
  laundromatCardBg: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16,
  },
  laundromatIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.white,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  laundromatBody: { flex: 1 },
  laundromatLabel: { fontFamily: 'Poppins_400Regular', fontSize: 10, color: TEXT_MUTED, textTransform: 'uppercase' },
  laundromatName: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#0B7A50', marginTop: 1 },
  laundromatAddress: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: TEXT_MUTED, marginTop: 1 },

  deliveryInfo: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E4EEFF',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
  },
  deliveryInfoIcon: { marginRight: 8 },
  deliveryInfoText: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#1F4E79', lineHeight: 18 },

  areaHeader: {
    fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: TEXT_MUTED,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: 12, marginBottom: 6, marginLeft: 2,
  },

  laundromatSelectCard: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    paddingHorizontal: 14, borderRadius: 14, marginBottom: 10,
    borderWidth: 1.5, borderColor: BORDER, backgroundColor: colors.white,
  },
  laundromatSelectCardActive: { borderColor: '#00A85A', backgroundColor: '#F0FFF5' },
  laundromatSelectIcon: {
    width: 44, height: 44, borderRadius: 13, backgroundColor: '#F3F6FC',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  laundromatSelectBody: { flex: 1 },
  laundromatSelectName: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: TEXT_DARK },
  laundromatSelectAddress: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: TEXT_MUTED, marginTop: 1 },

  deliveryCard: {
    borderRadius: 18, overflow: 'hidden', elevation: 1,
    shadowColor: '#26384A', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 8,
  },
  deliveryCardBg: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 16,
  },
  deliveryCardIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: colors.white,
    justifyContent: 'center', alignItems: 'center',
  },
  deliveryCardBody: { flex: 1, marginLeft: 14 },
  deliveryCardText: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: TEXT_DARK },
  deliveryCardPlaceholder: { fontFamily: 'Poppins_400Regular', color: TEXT_MUTED },
  deliveryCardHint: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: TEXT_MUTED, marginTop: 2 },
  deliveryCardPill: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10,
    paddingVertical: 6, borderRadius: 16, backgroundColor: colors.white,
  },
  deliveryCardPillText: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: '#7857FF', marginRight: 2 },

  priceEstimate: {
    backgroundColor: colors.white, borderRadius: 18, borderWidth: 1,
    borderColor: BORDER, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 4,
  },
  priceLabel: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: TEXT_MUTED, flex: 1 },
  priceValue: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: TEXT_DARK },
  priceDivider: { height: 1, backgroundColor: BORDER, marginVertical: 8 },
  bagCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#E8860B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  bagCardBg: {
    padding: 12,
    borderRadius: 16,
  },
  bagCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  bagBtnFancy: {
    width: 42,
    height: 42,
    borderRadius: 13,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#E8860B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  bagBtnDisabledFancy: {
    elevation: 0,
    shadowOpacity: 0,
  },
  bagBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 13,
  },
  bagCountDisplay: {
    alignItems: 'center',
    flex: 1,
  },
  bagCountNumber: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    lineHeight: 30,
    color: ACCENTS.amber.main,
  },
  bagUnitText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: TEXT_MUTED,
    marginTop: -2,
  },
  priceTotalLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: TEXT_DARK },
  priceTotalValue: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: TEAL },

  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  fieldCard: {
    width: '48%', borderRadius: 18, overflow: 'hidden',
    elevation: 1, shadowColor: '#26384A', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 8,
  },
  fieldCardBg: { paddingVertical: 16, paddingHorizontal: 14 },
  fieldIcon: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: colors.white,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  fieldLabel: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: TEXT_MUTED },
  fieldValue: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: TEXT_DARK, marginTop: 2 },

  instructionsWrap: { borderRadius: 18, flexDirection: 'row', padding: 16, overflow: 'hidden' },
  instructionsIcon: {
    width: 40, height: 40, borderRadius: 13, backgroundColor: colors.white,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  instructionsInput: {
    flex: 1, minHeight: 90, padding: 0, fontFamily: 'Poppins_400Regular',
    fontSize: 14, color: TEXT_DARK,
  },

  submitWrap: { marginTop: 28, paddingHorizontal: 20 },
  footerHint: {
    fontFamily: 'Poppins_400Regular', fontSize: 11, color: TEXT_MUTED,
    textAlign: 'center', marginBottom: 8,
  },
  nextButtonTouch: { borderRadius: 18 },
  nextButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 60, borderRadius: 20, overflow: 'hidden', elevation: 6,
    shadowColor: '#0E5E73', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 14,
  },
  nextShine: {
    position: 'absolute', top: -30, left: -30, width: 90, height: 120,
    borderRadius: 45, backgroundColor: 'rgba(255, 255, 255, 0.14)',
    transform: [{ rotate: '20deg' }],
  },
  nextIcon: { marginRight: 8 },
  nextButtonText: { fontFamily: 'Poppins_600SemiBold', fontSize: 17, color: colors.white, marginRight: 10 },
  nextArrow: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.22)', justifyContent: 'center', alignItems: 'center',
  },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(18, 38, 58, 0.45)',
    justifyContent: 'center', paddingHorizontal: 24,
  },
  modalCard: { backgroundColor: colors.white, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 22 },
  modalTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: TEXT_DARK, marginBottom: 14 },
  modalInput: {
    minHeight: 52, backgroundColor: colors.white, borderRadius: 14,
    borderWidth: 1.5, borderColor: BORDER, paddingHorizontal: 16,
    fontFamily: 'Poppins_400Regular', fontSize: 15, color: TEXT_DARK,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18 },
  modalCancel: { paddingHorizontal: 18, paddingVertical: 10, marginRight: 8 },
  modalCancelText: { fontFamily: 'Poppins_500Medium', fontSize: 15, color: TEXT_MUTED },
  modalSave: { paddingHorizontal: 22, paddingVertical: 10, borderRadius: 12, backgroundColor: TEAL },
  modalSaveText: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: colors.white },
});
