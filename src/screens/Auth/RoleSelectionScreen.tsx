import React from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';


import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import type { Role } from '../../types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<AuthStackParamList, 'Role'>;

const isWeb = Platform.OS === 'web';

type RoleOption = {
  role: Role;
  title: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  tint: string;
  accent: string;
  tag?: string;
};

const roleOptions: RoleOption[] = [
  {
    role: 'customer',
    title: 'Customer',
    description: 'Book laundry pickups and track your deliveries.',
    icon: 'account',
    iconColor: colors.accent,
    tint: '#DDEBEA',
    accent: colors.accent,
    tag: 'Most popular',
  },
  {
    role: 'driver',
    title: 'Driver',
    description: 'Fulfill orders, pickups and deliveries.',
    icon: 'car',
    iconColor: colors.success,
    tint: '#D6F5E4',
    accent: colors.success,
  },
  {
    role: 'admin',
    title: 'Administrator',
    description: 'Manage orders, users, pricing and reports.',
    icon: 'shield-account',
    iconColor: colors.tertiary,
    tint: '#E9E2FF',
    accent: colors.tertiary,
  },
];

export default function RoleSelectionScreen({ navigation }: Props) {
  return (
    <LinearGradient
      colors={['#E3D1FF', '#C7E3FF', '#CCF4E4']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.decorGlowOne} />
      <View style={styles.decorGlowTwo} />
      <View style={styles.decorCircleOne} />
      <View style={styles.decorCircleTwo} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Splash')}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textStrong} />
          </TouchableOpacity>

          <Image
  source={require('../../../assets/logo-purple.png')}
  style={styles.logo}
  resizeMode="contain"
/>

          <View style={styles.header}>
            <Text style={styles.title}>Get started</Text>
            <Text style={styles.subtitle}>
              Select how you'd like to continue.
            </Text>
          </View>

          <View style={styles.cardList}>
            {roleOptions.map((option) => (
              <TouchableOpacity
                key={option.role}
                style={[styles.card, { borderLeftColor: option.accent }]}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('Auth', { role: option.role })
                }
              >
                {!!option.tag && (
                  <View style={[styles.tag, { backgroundColor: option.tint }]}>
                    <Text style={[styles.tagText, { color: option.accent }]}>
                      {option.tag}
                    </Text>
                  </View>
                )}

                <View style={[styles.iconBubble, { backgroundColor: option.tint }]}>
                  <View
                    style={[styles.iconHalo, { backgroundColor: option.accent }]}
                  />
                  <MaterialCommunityIcons
                    name={option.icon}
                    size={30}
                    color={option.iconColor}
                  />
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{option.title}</Text>
                  <Text style={styles.cardDescription}>
                    {option.description}
                  </Text>
                </View>

                <View style={[styles.arrowBubble, { backgroundColor: option.tint }]}>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={22}
                    color={option.accent}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.footerNote}>
            Need help choosing? Most users join as a customer.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 16,
    ...(isWeb ? {
      maxWidth: 520,
      alignSelf: 'center',
      width: '100%',
    } : {}),
  },
  decorGlowOne: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    top: -120,
    right: -140,
  },
  decorGlowTwo: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    bottom: -100,
    left: -120,
  },
  decorCircleOne: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: 'rgba(91, 72, 247, 0.14)',
    top: '22%',
    left: -130,
  },
  decorCircleTwo: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    bottom: '18%',
    right: -70,
  },
  logo: {
  width: 116,
  height: 116,
  alignSelf: 'center',
  marginBottom: 4,
},
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  header: {
    marginTop: 8,
    marginBottom: 14,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#5B48F7',
    marginBottom: 6,
  },
  title: {
    ...typography.hero,
    color: '#4636A8',
  },
  subtitle: {
    ...typography.subtitle,
    color: '#6F63AD',
    marginTop: 6,
  },
  cardList: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 20,
    borderLeftWidth: 5,
    paddingVertical: 20,
    paddingHorizontal: 18,
    elevation: 4,
    shadowColor: '#3D2C6E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
  },
  tag: {
    position: 'absolute',
    top: 0,
    right: 20,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  iconBubble: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconHalo: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    opacity: 0.12,
  },
  cardBody: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  cardTitle: {
    ...typography.sectionTitle,
    fontSize: 18,
    color: colors.textStrong,
  },
  cardDescription: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 5,
    lineHeight: 17,
  },
  arrowBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerNote: {
    ...typography.caption,
    color: '#4B4A66',
    textAlign: 'center',
    marginTop: 14,
  },
});
