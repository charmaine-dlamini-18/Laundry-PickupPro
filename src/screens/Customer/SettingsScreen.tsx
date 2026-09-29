import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
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
import { useAuth } from '../../hooks/useAuth';
import type { CustomerStackParamList } from '../../navigation/types';
import { ROLE_LABELS } from '../../types';

type Props = NativeStackScreenProps<CustomerStackParamList, 'Settings'>;

type Icon = keyof typeof MaterialCommunityIcons.glyphMap;

type ToggleRow = {
  label: string;
  hint: string;
  icon: Icon;
  tint: string;
  color: string;
  key: 'push' | 'email' | 'sms' | 'location';
};

const TEAL = '#0E9AA7';
const ICON_DARK = '#2B3642';
const TEXT_DARK = '#1F2933';
const TEXT_MUTED = '#7A869A';
const BORDER = '#E8ECF1';
const WHITE = '#FFFFFF';
const DANGER = '#E5484D';
const SECTION = '#0E7A86';

const GRADIENT_RED = ['#FF7A70', '#E5484D'] as const;

const isWeb = Platform.OS === 'web';

const toggleRows: ToggleRow[] = [
  {
    label: 'Push Notifications',
    hint: 'Order status reminders',
    icon: 'bell-outline',
    tint: '#E4EEFF',
    color: '#2E6BFF',
    key: 'push',
  },
  {
    label: 'Email Notifications',
    hint: 'Receipts and confirmations',
    icon: 'email-outline',
    tint: '#EFEBFF',
    color: '#7857FF',
    key: 'email',
  },
  {
    label: 'SMS Updates',
    hint: 'Delivery time updates',
    icon: 'message-text-outline',
    tint: '#D6F0F4',
    color: '#0E9AA7',
    key: 'sms',
  },
  {
    label: 'Location Services',
    hint: 'Faster pickup and drop-off',
    icon: 'map-marker-radius-outline',
    tint: '#DDF8E8',
    color: '#00A85A',
    key: 'location',
  },
];

export default function SettingsScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [prefs, setPrefs] = useState({
    push: true,
    email: true,
    sms: false,
    location: true,
  });

  if (!fontsLoaded) return null;

  const displayName = user?.name ?? 'Matthew Yako';
  const displayEmail = user?.email ?? 'matthew@example.com';
  const roleLabel = user?.role ? ROLE_LABELS[user.role] : 'Customer';

  const toggle = (key: keyof typeof prefs) =>
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));

  const confirmLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <BookingHeader
        title="Settings"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>
              {displayName}
            </Text>

            <Text
              style={styles.email}
              numberOfLines={1}
            >
              {displayEmail}
            </Text>

            <Text style={styles.role}>
              {roleLabel}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Notifications
        </Text>

        <View style={styles.card}>
          {toggleRows.map((row, index) => (
            <View
              key={row.key}
              style={[
                styles.row,
                index === toggleRows.length - 1 &&
                  styles.rowLast,
              ]}
            >
              <View
                style={[
                  styles.rowIcon,
                  { backgroundColor: row.tint },
                ]}
              >
                <MaterialCommunityIcons
                  name={row.icon}
                  size={20}
                  color={row.color}
                />
              </View>

              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>
                  {row.label}
                </Text>

                <Text style={styles.rowHint}>
                  {row.hint}
                </Text>
              </View>

              <Switch
                value={prefs[row.key]}
                onValueChange={() => toggle(row.key)}
                trackColor={{
                  false: '#D5DCE3',
                  true: '#0E9AA7',
                }}
                thumbColor={
                  prefs[row.key]
                    ? '#FFFFFF'
                    : '#F5F7FA'
                }
              />
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>
          Account
        </Text>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              Alert.alert(
                'Change password',
                'A reset link will be sent to your email.'
              )
            }
          >
            <View
              style={[
                styles.rowIcon,
                { backgroundColor: '#FFF0B8' },
              ]}
            >
              <MaterialCommunityIcons
                name="lock-reset"
                size={20}
                color="#E8960C"
              />
            </View>

            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>
                Change password
              </Text>

              <Text style={styles.rowHint}>
                Update your account password
              </Text>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={TEXT_MUTED}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.row,
              styles.rowLast,
            ]}
            onPress={() =>
              Alert.alert(
                'Privacy & Security',
                'Your data is encrypted and never shared.'
              )
            }
          >
            <View
              style={[
                styles.rowIcon,
                { backgroundColor: '#FCE7F3' },
              ]}
            >
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={20}
                color="#EC5E9B"
              />
            </View>

            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>
                Privacy & Security
              </Text>

              <Text style={styles.rowHint}>
                Manage your privacy preferences
              </Text>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={TEXT_MUTED}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={confirmLogout}
        >
          <LinearGradient
            colors={GRADIENT_RED}
            style={styles.logoutButton}
          >
            <View style={styles.shine} />

            <MaterialCommunityIcons
              name="logout"
              size={20}
              color={WHITE}
            />

            <Text style={styles.logoutButtonText}>
              Log out
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },

  scroll: {
    backgroundColor: '#F7F9FB',
  },

  container: {
    paddingHorizontal: isWeb ? 32 : 20,
    paddingTop: 8,
    paddingBottom: 40,
    ...(isWeb
      ? {
          maxWidth: 600,
          alignSelf: 'center',
          width: '100%',
        }
      : {}),
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 22,
    shadowColor: '#1F2933',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: TEAL,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  avatarText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: WHITE,
  },

  profileInfo: {
    flex: 1,
  },

  name: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: TEXT_DARK,
  },

  email: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 2,
  },

  role: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: TEAL,
    marginTop: 2,
  },

  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: SECTION,
    marginBottom: 10,
  },

  card: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 22,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F4',
  },

  rowLast: {
    borderBottomWidth: 0,
  },

  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  rowBody: {
    flex: 1,
  },

  rowLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: TEXT_DARK,
  },

  rowHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: TEXT_MUTED,
    marginTop: 1,
  },

  logoutButton: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: DANGER,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.22,
    shadowRadius: 10,
  },

  logoutButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: WHITE,
    marginLeft: 8,
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
});