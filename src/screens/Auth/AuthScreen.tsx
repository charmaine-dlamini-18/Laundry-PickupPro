import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuth } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import * as AuthServices from '../../services/AuthServices';
import { colors } from '../../theme/colors';
import {
  isEmail,
  isMinLength,
  isPhone,
  isRequired,
  matches,
} from '../../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Auth'>;

type Mode = 'login' | 'register';

const ACCENT = '#0F363F';
const TEXT_DARK = '#1F2933';
const TEXT_MUTED = '#7A869A';
const BORDER = '#E8ECF1';
const LIGHT_BLUE = '#E4EEFF';
const LIGHT_BLUE_ACCENT = '#2E6BFF';

const isWeb = Platform.OS === 'web';

const SEGMENTS: {
  key: Mode;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { key: 'login', label: 'Log In', icon: 'login-variant' },
  { key: 'register', label: 'Register', icon: 'account-plus-outline' },
];

const DRIVER_SEGMENTS: {
  key: Mode;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { key: 'login', label: 'Log In', icon: 'login-variant' },
];

type RegisterErrors = {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirm?: string;
  terms?: string;
};

export default function AuthScreen({ navigation, route }: Props) {
  const { role } = route.params;
  const { signIn } = useAuth();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [mode, setMode] = useState<Mode>(route.params.mode ?? 'login');

  const isDriver = role === 'driver';
  const canRegister = role === 'customer';
  const activeSegments = canRegister ? SEGMENTS : DRIVER_SEGMENTS;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [regErrors, setRegErrors] = useState<RegisterErrors>({});
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccessEmail, setRegSuccessEmail] = useState('');
  const [regDialog, setRegDialog] = useState<
    | { kind: 'sent'; email: string }
    | { kind: 'error'; message: string }
    | null
  >(null);
  const [resendNotice, setResendNotice] = useState('');

  if (!fontsLoaded) return null;

  const switchMode = (next: Mode) => {
    setMode(next);
    setEmailError('');
    setPasswordError('');
    setRegErrors({});
    setRegSuccessEmail('');
    setRegDialog(null);
    setResendNotice('');
    setLoginError('');
  };

  const handleLogin = async () => {
    const nextEmailError = isRequired(email)
      ? isEmail(email)
        ? ''
        : 'Enter a valid email address.'
      : 'Email is required.';
    const nextPasswordError = isRequired(password)
      ? ''
      : 'Password is required.';

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setLoginError('');

    if (nextEmailError || nextPasswordError) return;

    setLoginLoading(true);
    try {
      const user = await AuthServices.login({ role, email, password });
      signIn(role, user);
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : 'Something went wrong.'
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const validateRegister = (): RegisterErrors => {
    const next: RegisterErrors = {};

    if (!isRequired(regName)) next.name = 'Full name is required.';

    if (!isRequired(regEmail)) {
      next.email = 'Email is required.';
    } else if (!isEmail(regEmail)) {
      next.email = 'Enter a valid email address.';
    }

    if (regPhone.trim() && !isPhone(regPhone)) {
      next.phone = 'Enter a valid phone number.';
    }

    if (!isRequired(regPassword)) {
      next.password = 'Password is required.';
    } else if (!isMinLength(regPassword, 8)) {
      next.password = 'Password must be at least 8 characters.';
    }

    if (!matches(regConfirm, regPassword)) {
      next.confirm = 'Passwords do not match.';
    }

    if (!agree) next.terms = 'Please accept the terms and conditions.';

    return next;
  };

  const handleRegister = async () => {
    const nextErrors = validateRegister();
    setRegErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setRegLoading(true);
    try {
      await AuthServices.register({
        role,
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
      });

      setRegSuccessEmail(regEmail.trim());
      setRegPassword('');
      setRegConfirm('');
      setResendNotice('');
      setRegDialog({ kind: 'sent', email: regEmail.trim() });
    } catch (error) {
      setRegDialog({
        kind: 'error',
        message:
          error instanceof Error ? error.message : 'Something went wrong.',
      });
    } finally {
      setRegLoading(false);
    }
  };

  const handleResend = async (email: string) => {
    try {
      await AuthServices.resendConfirmationEmail(email);
      setResendNotice(`A new confirmation link was sent to ${email}.`);
    } catch (error) {
      setResendNotice(
        error instanceof Error ? error.message : 'Could not resend.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Role');
            }
          }}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textStrong} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {mode === 'login' ? 'Welcome Back!' : 'Create your account'}
          </Text>

          {activeSegments.length > 1 && (
            <View style={styles.segment}>
              {activeSegments.map((item) => {
                const active = mode === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.segmentItem,
                      active && styles.segmentItemActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => switchMode(item.key)}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={18}
                      color={active ? ACCENT : 'rgba(255, 255, 255, 0.75)'}
                    />
                    <Text
                      style={[
                        styles.segmentText,
                        active && styles.segmentTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {isDriver && (
            <View style={styles.driverNotice}>
              <MaterialCommunityIcons name="information-outline" size={14} color="rgba(255,255,255,0.75)" />
              <Text style={styles.driverNoticeText}>
                Drivers sign in with credentials provided by your administrator.
              </Text>
            </View>
          )}
        </View>

        {mode === 'login' ? (
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="example@gmail.com"
              icon="email-outline"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={emailError}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              icon="lock-outline"
              value={password}
              onChangeText={setPassword}
              secure
              error={passwordError}
            />

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
                    <MaterialCommunityIcons
                      name="check"
                      size={14}
                      color={colors.white}
                    />
                  )}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Forgot', { role })}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {!!loginError && (
              <Text style={styles.loginErrorText}>{loginError}</Text>
            )}

            <Button
              title="Log In"
              onPress={handleLogin}
              loading={loginLoading}
              style={styles.submitButton}
            />

            <View style={styles.socialSection}>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() =>
                  Alert.alert('Google', 'Sign in with Google coming soon.')
                }
              >
                <MaterialCommunityIcons name="google" size={20} color="#DB4437" />
                <Text style={styles.socialText}>Continue with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() =>
                  Alert.alert('Apple', 'Sign in with Apple coming soon.')
                }
              >
                <MaterialCommunityIcons name="apple" size={20} color="#171717" />
                <Text style={styles.socialText}>Continue with Apple</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : regSuccessEmail ? (
          <View style={styles.successCard}>
            <MaterialCommunityIcons
              name="email-check-outline"
              size={52}
              color={ACCENT}
            />
            <Text style={styles.successTitle}>Check your email</Text>
            <Text style={styles.successText}>
              We sent a confirmation link to{' '}
              <Text style={styles.successEmail}>{regSuccessEmail}</Text>.
              Click the link to activate your account, then log in.
            </Text>
            <Button
              title="Resend email"
              onPress={() => {
                void handleResend(regSuccessEmail);
              }}
              style={styles.submitButton}
            />
            {!!resendNotice && (
              <Text style={styles.resendNotice}>{resendNotice}</Text>
            )}
            <Button
              title="Back to Log In"
              onPress={() => switchMode('login')}
              style={styles.submitButton}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <Input
              label="Full name"
              placeholder="Your full name"
              icon="account-outline"
              value={regName}
              onChangeText={setRegName}
              autoCapitalize="words"
              error={regErrors.name}
            />

            <Input
              label="Email"
              placeholder="you@example.com"
              icon="email-outline"
              value={regEmail}
              onChangeText={setRegEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={regErrors.email}
            />

            <Input
              label="Phone number"
              placeholder="+27 12 345 6789"
              icon="phone-outline"
              value={regPhone}
              onChangeText={setRegPhone}
              keyboardType="phone-pad"
              error={regErrors.phone}
            />

            <Input
              label="Password"
              placeholder="At least 8 characters"
              icon="lock-outline"
              value={regPassword}
              onChangeText={setRegPassword}
              secure
              error={regErrors.password}
            />

            <Input
              label="Confirm password"
              placeholder="Re-enter your password"
              icon="lock-check-outline"
              value={regConfirm}
              onChangeText={setRegConfirm}
              secure
              error={regErrors.confirm}
            />

            <View style={styles.termsRow}>
              <TouchableOpacity
                style={styles.termsCheckboxTouch}
                onPress={() => setAgree(!agree)}
              >
                <View
                  style={[
                    styles.checkbox,
                    agree && styles.checkboxSelected,
                  ]}
                >
                  {agree && (
                    <MaterialCommunityIcons
                      name="check"
                      size={14}
                      color={colors.white}
                    />
                  )}
                </View>
              </TouchableOpacity>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>
            {!!regErrors.terms && (
              <Text style={styles.termsError}>{regErrors.terms}</Text>
            )}

            <Button
              title="Create account"
              onPress={handleRegister}
              loading={regLoading}
              style={styles.submitButton}
            />
          </View>
        )}

        <View style={styles.footer}>
          {role === 'customer' && (
            <Text style={styles.footerText}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <Text
                style={styles.footerLink}
                onPress={() => switchMode(mode === 'login' ? 'register' : 'login')}
              >
                {mode === 'login' ? 'Sign Up' : 'Log In'}
              </Text>
            </Text>
          )}
          {role !== 'customer' && (
            <Text style={styles.footerText}>
              {isDriver
                ? 'Drivers are registered by the administrator.'
                : 'Admin accounts are managed by the system.'}
            </Text>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={regDialog !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRegDialog(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View
              style={[
                styles.modalIconCircle,
                regDialog?.kind === 'error' && styles.modalIconCircleError,
              ]}
            >
              <MaterialCommunityIcons
                name={
                  regDialog?.kind === 'error'
                    ? 'alert-circle-outline'
                    : 'email-check-outline'
                }
                size={40}
                color={
                  regDialog?.kind === 'error' ? colors.danger : ACCENT
                }
              />
            </View>
            <Text style={styles.modalTitle}>
              {regDialog?.kind === 'error'
                ? 'Registration failed'
                : 'Email sent'}
            </Text>
            <Text style={styles.modalText}>
              {regDialog?.kind === 'error'
                ? regDialog?.message
                : `We sent a confirmation link to ${regDialog?.email}. Please check your inbox to confirm your address, then log in.`}
            </Text>

            {regDialog?.kind === 'error' ? (
              <Button
                title="Try Again"
                onPress={() => setRegDialog(null)}
                style={styles.submitButton}
              />
            ) : (
              <>
                {!!resendNotice && (
                  <Text style={styles.resendNotice}>{resendNotice}</Text>
                )}
                <Button
                  title="Resend email"
                  onPress={() => {
                    void handleResend(regDialog?.email ?? '');
                  }}
                  style={styles.submitButton}
                />
                <Button
                  title="Back to Log In"
                  onPress={() => {
                    setRegDialog(null);
                    switchMode('login');
                  }}
                  style={styles.submitButton}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 16,
    padding: 4,
    marginTop: 20,
  },
  segmentItem: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  segmentItemActive: {
    backgroundColor: colors.white,
    elevation: 2,
  },
  segmentText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  segmentTextActive: {
    color: ACCENT,
    fontFamily: 'Poppins_600SemiBold',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    ...(isWeb ? {
      maxWidth: 480,
      alignSelf: 'center',
      width: '100%',
    } : {}),
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F6F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    backgroundColor: ACCENT,
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 24,
    marginBottom: 22,
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: colors.white,
  },
  driverNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  driverNoticeText: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 17,
  },
  form: {
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 24,
    elevation: 3,
    shadowColor: '#26384A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  successCard: {
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 24,
    paddingTop: 34,
    paddingBottom: 30,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#26384A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  successTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: TEXT_DARK,
    marginTop: 16,
  },
  successText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  successEmail: {
    fontFamily: 'Poppins_600SemiBold',
    color: ACCENT,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 22,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#C3D1CF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxSelected: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  rememberText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: TEXT_MUTED,
  },
  forgotText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: LIGHT_BLUE_ACCENT,
  },
  submitButton: {
    marginTop: 6,
  },
  socialSection: {
    marginTop: 20,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER,
  },
  dividerText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    marginHorizontal: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: colors.white,
    marginBottom: 12,
  },
  socialText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    color: TEXT_DARK,
    marginLeft: 10,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
    marginBottom: 4,
  },
  termsCheckboxTouch: {
    marginRight: 8,
  },
  termsText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    flex: 1,
    lineHeight: 18,
  },
  termsLink: {
    color: LIGHT_BLUE_ACCENT,
    fontWeight: '600',
  },
  termsError: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.danger,
    marginBottom: 8,
  },
  loginErrorText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 10,
  },
  footer: {
    alignItems: 'center',
    marginTop: 22,
  },
  footerText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: TEXT_MUTED,
  },
  footerLink: {
    fontFamily: 'Poppins_600SemiBold',
    color: ACCENT,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 54, 63, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#26384A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
  },
  modalIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E5F0EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalIconCircleError: {
    backgroundColor: '#FBE9E9',
  },
  resendNotice: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: ACCENT,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
  modalTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: TEXT_DARK,
    marginTop: 14,
  },
  modalText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
});
