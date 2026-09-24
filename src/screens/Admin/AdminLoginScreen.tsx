import React, { useState } from 'react';
import {
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
import { useAuth } from '../../hooks/useAuth';
import FancyAlert from '../../components/FancyAlert';
import * as AuthServices from '../../services/AuthServices';
import { isEmail, isMinLength, isRequired } from '../../utils/validation';

type Props = NativeStackScreenProps<AdminStackParamList, 'Login'>;

const TEXT_DARK = '#1F2933';
const TEXT_MUTED = '#7A869A';
const WHITE = '#FFFFFF';
const BLUE = '#2E6BFF';
const PURPLE = '#7857FF';
const BORDER = '#E8ECF1';
const DANGER = '#E5484D';

const isWeb = Platform.OS === 'web';

const GRADIENT_HEADER = [BLUE, PURPLE] as const;

export default function AdminLoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [forgotVisible, setForgotVisible] = useState(false);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) return null;

  const handleLogin = async () => {
    const next: Record<string, string> = {};
    if (!isEmail(email)) next.email = 'Enter a valid admin email';
    if (!isRequired(password)) next.password = 'Enter your password';
    else if (!isMinLength(password, 6)) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoggingIn(true);
    setLoginError('');
    try {
      const user = await AuthServices.login({ role: 'admin', email, password });
      signIn('admin', user);
      navigation.replace('Dashboard');
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : 'Something went wrong.'
      );
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient colors={GRADIENT_HEADER} style={styles.headerBanner}>
          <View style={styles.decorCircleOne} />
          <View style={styles.decorCircleTwo} />
          <View style={styles.logoWrap}>
            <MaterialCommunityIcons name="shield-account-outline" size={30} color={WHITE} />
          </View>
          <Text style={styles.welcomeText}>Admin Portal</Text>
          <Text style={styles.welcomeSubtitle}>
            Welcome back! Log in to manage your laundry service.
          </Text>
        </LinearGradient>

        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Email</Text>
          <View style={[styles.inputField, errors.email && styles.inputError]}>
            <MaterialCommunityIcons name="email-outline" size={20} color={TEXT_MUTED} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="admin@gmail.com"
              placeholderTextColor={TEXT_MUTED}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <Text style={styles.inputLabel}>Password</Text>
          <View style={[styles.inputField, errors.password && styles.inputError]}>
            <MaterialCommunityIcons name="lock-outline" size={20} color={TEXT_MUTED} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={TEXT_MUTED}
              secureTextEntry
            />
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View
                style={[
                  styles.checkbox,
                  rememberMe && styles.checkboxSelected,
                ]}
              >
                {rememberMe && (
                  <MaterialCommunityIcons name="check" size={13} color={WHITE} />
                )}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setForgotVisible(true)}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {!!loginError && (
            <Text style={styles.errorText}>{loginError}</Text>
          )}

          <TouchableOpacity
            style={styles.loginButtonTouch}
            activeOpacity={0.9}
            disabled={loggingIn}
            onPress={handleLogin}
          >
            <LinearGradient colors={GRADIENT_HEADER} style={styles.loginButton}>
              <View style={styles.shine} />
              <MaterialCommunityIcons name="login-variant" size={20} color={WHITE} />
              <Text style={styles.loginButtonText}>
                {loggingIn ? 'Logging in…' : 'Log in'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <FancyAlert
        visible={forgotVisible}
        icon="email-check-outline"
        iconColor="#7958D5"
        iconBackground="#F0E9FF"
        title="Reset link sent"
        message={
          email.trim()
            ? `A password reset link has been sent to ${email.trim()}.`
            : 'A password reset link has been sent to your email.'
        }
        onClose={() => setForgotVisible(false)}
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
  headerBanner: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    alignItems: 'center',
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
  logoWrap: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: WHITE,
  },
  welcomeSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  formCard: {
    marginHorizontal: isWeb ? 'auto' : 20,
    marginTop: 24,
    backgroundColor: WHITE,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
    elevation: 3,
    shadowColor: '#26384A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    ...(isWeb ? { maxWidth: 440, width: '100%' } : {}),
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
    marginBottom: 16,
  },
  inputError: {
    borderColor: DANGER,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: TEXT_DARK,
  },
  errorText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: DANGER,
    marginTop: -10,
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  checkboxSelected: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  rememberText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: TEXT_MUTED,
  },
  forgotText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: BLUE,
  },
  loginButtonTouch: {
    borderRadius: 16,
  },
  loginButton: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
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
  loginButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: WHITE,
    marginLeft: 8,
  },
});
