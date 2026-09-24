import React, { useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FancyAlert from '../../components/FancyAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import { useAuth } from '../../hooks/useAuth';
import { useOrders } from '../../context/OrdersContext';
import { useNotifications } from '../../context/NotificationsContext';
import { addCustomerReview } from '../../services/adminOrderServices';
import {
  isOrderActive,
  type CustomerOrder,
} from '../../data/orders';
import type { CustomerTabNavigation } from '../../navigation/types';

const isWeb = Platform.OS === 'web';
const TEAL = '#0F363F';
const TEAL_MID = '#1E5660';
const TEXT_DARK = '#1F2933';
const TEXT_MUTED = '#7A869A';
const WHITE = '#FFFFFF';
const AMBER_DARK = '#B45309';

const GRADIENT_HEADER = ['#14B8A6', '#0E9F6E'] as const;
const GRADIENT_BOOK = ['#DCF5E9', '#F2FBF6'] as const;
const GRADIENT_REFER = ['#FFF3D6', '#FFE9C2'] as const;

type QuickAction = {
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  tint: string;
  color: string;
  compact?: boolean;
  opensRating?: boolean;
  onPress: (navigation: CustomerTabNavigation, activeOrder?: CustomerOrder) => void;
};

const quickActions: QuickAction[] = [
  {
    title: 'Track Order',
    icon: 'map-marker-outline',
    tint: '#DDF8E8',
    color: '#00A85A',
    onPress: (navigation, activeOrder) =>
      activeOrder
        ? navigation.navigate('Track', { order: activeOrder })
        : navigation.navigate('Track'),
  },
  {
    title: 'Order History',
    icon: 'history',
    tint: '#EAE6FF',
    color: '#5B48F7',
    onPress: (navigation) => navigation.navigate('Orders'),
  },
  {
    title: 'Notifications',
    icon: 'bell-outline',
    tint: '#FFF0B8',
    color: '#E8960C',
    compact: true,
    onPress: (navigation) => navigation.navigate('Notifications'),
  },
  {
    title: 'Addresses',
    icon: 'map-marker-multiple-outline',
    tint: '#D6F0F4',
    color: '#0E9AA7',
    onPress: (navigation) => navigation.navigate('Addresses'),
  },
  {
    title: 'Support',
    icon: 'headset',
    tint: '#FCE7F3',
    color: '#EC5E9B',
    onPress: (navigation) => navigation.navigate('Support'),
  },
  {
    title: 'Rate the App',
    icon: 'star-outline',
    tint: '#E4EEFF',
    color: '#2E6BFF',
    opensRating: true,
    onPress: () => {},
  },
];

export default function CustomerHomeScreen() {
  const { user, signOut } = useAuth();
  const { orders } = useOrders();
  const { unreadCount } = useNotifications();
  const navigation = useNavigation<CustomerTabNavigation>();
  const [menuVisible, setMenuVisible] = useState(false);
  const [ratingVisible, setRatingVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingThanksVisible, setRatingThanksVisible] = useState(false);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) return null;

  const activeOrder = orders.find((order) => isOrderActive(order.status));
  const userName = user?.name ?? 'Matthew';

  const goProfile = () => {
    setMenuVisible(false);
    navigation.navigate('Profile');
  };

  const goSettings = () => {
    setMenuVisible(false);
    navigation.navigate('Settings');
  };

  const goLogout = () => {
    setMenuVisible(false);
    signOut();
  };

  const shareReferral = async () => {
    try {
      await Share.share({
        message:
          'Hey! I use Laundry Pickup Pro for laundry pickup & delivery. ' +
          `Use my referral code ${(user?.name ?? 'MATT').toUpperCase().slice(0, 5)}50 ` +
          'to get R50 off your first order. Download: https://laundrypickuppro.app',
      });
    } catch {
      // sharing dismissed
    }
  };

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
            <TouchableOpacity style={styles.avatar} onPress={() => setMenuVisible(true)}>
              <Text style={styles.avatarText}>
                {(user?.name ?? 'Matthew').charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <MaterialCommunityIcons name="bell-outline" size={22} color={WHITE} />
              {unreadCount > 0 && <View style={styles.bellBadge} />}
            </TouchableOpacity>
          </View>

          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Hi, {userName}!</Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Book')}
          >
            <LinearGradient colors={GRADIENT_BOOK} style={styles.bookCard}>
              <View style={styles.bookIcon}>
                <MaterialCommunityIcons name="truck-fast-outline" size={24} color="#0B7A50" />
              </View>
              <View style={styles.bookText}>
                <Text style={styles.bookTitle}>Place new Order</Text>
                <Text style={styles.bookSubtitle}>Pickup and Delivery</Text>
              </View>
              <View style={styles.bookArrow}>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#0B7A50" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.grid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.title}
                style={[styles.gridCard, action.compact && styles.gridCardCompact]}
                activeOpacity={0.85}
                onPress={() => {
                  if (action.opensRating) {
                    setRating(0);
                    setRatingVisible(true);
                  } else {
                    action.onPress(navigation, activeOrder);
                  }
                }}
              >
                <View
                  style={[
                    styles.gridIcon,
                    action.compact && styles.gridIconCompact,
                    { backgroundColor: action.tint },
                  ]}
                >
                  <MaterialCommunityIcons name={action.icon} size={24} color={action.color} />
                  {action.title === 'Track Order' && activeOrder && (
                    <View style={styles.gridDot} />
                  )}
                  {action.title === 'Notifications' && unreadCount > 0 && (
                    <View style={styles.gridDot} />
                  )}
                </View>
                <Text
                  style={[styles.gridLabel, action.compact && styles.gridLabelCompact]}
                  numberOfLines={action.compact ? 1 : undefined}
                >
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={shareReferral}
          >
            <LinearGradient colors={GRADIENT_REFER} style={styles.referralBanner}>
              <View style={styles.referralIcon}>
                <MaterialCommunityIcons name="gift-outline" size={24} color="#C77700" />
              </View>
              <View style={styles.referralText}>
                <Text style={styles.referralTitle}>Refer a friend</Text>
                <Text style={styles.referralSubtitle}>
                  Get R50 off your next order!
                </Text>
              </View>
              <View style={styles.referralArrow}>
                <MaterialCommunityIcons name="share-variant" size={18} color="#C77700" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.menuBackdrop}>
          <TouchableOpacity
            style={styles.menuBackdropTouch}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />
          <View style={styles.menuSheet}>
            <View style={styles.menuHandle} />
            <LinearGradient colors={GRADIENT_HEADER} style={styles.menuHeader}>
              <View style={styles.menuAvatar}>
                <Text style={styles.menuAvatarText}>
                  {(user?.name ?? 'Matthew').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.menuHeaderText}>
                <Text style={styles.menuHeaderTitle}>Hey, {userName}!</Text>
                <Text style={styles.menuHeaderSubtitle}>
                  What would you like to do?
                </Text>
              </View>
            </LinearGradient>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={goProfile}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#E4EEFF' }]}>
                <MaterialCommunityIcons name="account-outline" size={22} color="#2E6BFF" />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>My Account</Text>
                <Text style={styles.menuDesc}>View your profile and details</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#C3CDD7" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={goSettings}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#D6F0F4' }]}>
                <MaterialCommunityIcons name="cog-outline" size={22} color="#0E9AA7" />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>Settings</Text>
                <Text style={styles.menuDesc}>Preferences, notifications and more</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#C3CDD7" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={goLogout}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#FDE7E8' }]}>
                <MaterialCommunityIcons name="logout" size={22} color="#E5484D" />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuTitle, { color: '#E5484D' }]}>Log out</Text>
                <Text style={styles.menuDesc}>Sign out of your account</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#C3CDD7" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={ratingVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRatingVisible(false)}
      >
        <View style={styles.ratingOverlay}>
          <View style={styles.ratingCard}>
            <View style={styles.ratingIcon}>
              <MaterialCommunityIcons name="star-outline" size={32} color="#E8960C" />
            </View>
            <Text style={styles.ratingTitle}>Love Laundry Pickup Pro?</Text>
            <Text style={styles.ratingSubtitle}>
              Tap a star to rate your experience.
            </Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  activeOpacity={0.7}
                  onPress={() => setRating(star)}
                >
                  <MaterialCommunityIcons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={40}
                    color={star <= rating ? '#F5A623' : '#D4DBE3'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingHint}>
              {rating === 0
                ? 'Your feedback helps us improve'
                : rating >= 4
                  ? 'Thank you! We appreciate it.'
                  : 'Thanks for being honest.'}
            </Text>

            <TouchableOpacity
              style={styles.ratingSubmitTouch}
              activeOpacity={0.85}
              disabled={rating === 0 || ratingSubmitting}
              onPress={async () => {
                setRatingSubmitting(true);
                try {
                  await addCustomerReview('', rating, '');
                } catch {
                  // Persist best-effort; still show thanks.
                } finally {
                  setRatingSubmitting(false);
                }
                setRatingVisible(false);
                setRatingThanksVisible(true);
              }}
            >
              <LinearGradient colors={GRADIENT_HEADER} style={styles.ratingSubmit}>
                <Text style={styles.ratingSubmitText}>
                  {ratingSubmitting ? 'Submitting…' : 'Submit rating'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ratingCancel}
              onPress={() => setRatingVisible(false)}
            >
              <Text style={styles.ratingCancelText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <FancyAlert
        visible={ratingThanksVisible}
        icon="star-circle"
        iconColor="#E8960C"
        iconBackground="#FFF0B8"
        title="Thank you!"
        message="Your rating helps us keep improving the Laundry Pickup Pro experience."
        onClose={() => setRatingThanksVisible(false)}
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
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: isWeb ? 32 : 20,
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
    marginBottom: 22,
    ...(isWeb ? { maxWidth: 600, alignSelf: 'center', width: '100%' } : {}),
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
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: WHITE,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#FFC24B',
    borderWidth: 1.5,
    borderColor: '#13A884',
  },
  hero: {},
  heroTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 27,
    lineHeight: 36,
    color: WHITE,
  },
  content: {
    paddingHorizontal: isWeb ? 32 : 20,
    marginTop: -16,
    ...(isWeb ? { maxWidth: 600, alignSelf: 'center', width: '100%' } : {}),
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBEADB',
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#0E9F6E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  bookIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#A9E8C8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookText: {
    flex: 1,
    marginLeft: 14,
  },
  bookTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: '#0B5C3F',
  },
  bookSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#3E7A61',
    marginTop: 2,
  },
  bookArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#A9E8C8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: TEAL_MID,
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  gridCard: {
    width: isWeb ? '31%' : '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8ECF1',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#26384A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    ...(isWeb ? { cursor: 'pointer' } : {}),
  },
  gridIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#FFC24B',
    borderWidth: 2,
    borderColor: WHITE,
  },
  gridCardCompact: {
    paddingHorizontal: 12,
  },
  gridIconCompact: {
    width: 40,
    height: 40,
  },
  gridLabelCompact: {
    fontSize: 12,
    marginLeft: 8,
  },
  gridLabel: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: TEXT_DARK,
    marginLeft: 10,
  },
  referralBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F5E3B8',
    paddingVertical: 18,
    paddingHorizontal: 18,
    elevation: 2,
    shadowColor: '#E8960C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  referralIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: 'rgba(232, 150, 12, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  referralText: {
    flex: 1,
    marginLeft: 14,
  },
  referralTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#8A5B00',
  },
  referralSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#A16207',
    marginTop: 2,
  },
  referralArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 38, 58, 0.55)',
    justifyContent: 'flex-end',
  },
  menuBackdropTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuSheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 30,
    shadowColor: '#0F363F',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 16,
    ...(isWeb ? { maxWidth: 480, alignSelf: 'center', width: '100%' } : {}),
  },
  menuHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D8DFE6',
    marginTop: 10,
    marginBottom: 14,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 6,
  },
  menuAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuAvatarText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: WHITE,
  },
  menuHeaderText: {
    flex: 1,
  },
  menuHeaderTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: WHITE,
  },
  menuHeaderSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.82)',
    marginTop: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: TEXT_DARK,
  },
  menuDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#EEF1F5',
    marginVertical: 2,
  },
  ratingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 38, 58, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  ratingCard: {
    backgroundColor: WHITE,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 26,
    alignItems: 'center',
    elevation: 14,
    shadowColor: '#0F363F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    ...(isWeb ? { maxWidth: 420, alignSelf: 'center', width: '100%' } : {}),
  },
  ratingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF0B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  ratingTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: TEXT_DARK,
    textAlign: 'center',
  },
  ratingSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: 4,
  },
  starsRow: {
    flexDirection: 'row',
    marginTop: 18,
  },
  ratingHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 12,
  },
  ratingSubmitTouch: {
    alignSelf: 'stretch',
    borderRadius: 15,
    marginTop: 20,
  },
  ratingSubmit: {
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#0E9F6E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  ratingSubmitText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: WHITE,
  },
  ratingCancel: {
    marginTop: 12,
    paddingVertical: 6,
  },
  ratingCancelText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: TEXT_MUTED,
  },
});
