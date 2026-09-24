import React, { useState } from 'react';
import {
  Alert,
  Linking,
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
import { useOrders } from '../../context/OrdersContext';
import { useSupport } from '../../context/SupportContext';
import { useAuth } from '../../hooks/useAuth';
import { isOrderActive } from '../../data/orders';
import type { CustomerStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CustomerStackParamList, 'Support'>;

type Icon = keyof typeof MaterialCommunityIcons.glyphMap;

type ContactChannel = {
  label: string;
  hint: string;
  icon: Icon;
  tint: string;
  color: string;
  onPress: () => void;
};

type FaqItem = {
  question: string;
  answer: string;
};

const TEAL = '#0E9AA7';
const TEAL_TINT = '#D6F0F4';
const GREEN = '#00A85A';
const GREEN_TINT = '#DDF8E8';
const BLUE = '#2E6BFF';
const BLUE_TINT = '#E4EEFF';
const PURPLE = '#7857FF';
const PURPLE_TINT = '#EFEBFF';
const TEXT_DARK = '#1F2933';
const TEXT_MUTED = '#7A869A';
const BORDER = '#E8ECF1';
const WHITE = '#FFFFFF';
const SECTION = '#0E7A86';

const GRADIENT_VIBRANT = ['#2E6BFF', '#7857FF'] as const;

const SUPPORT_PHONE = '+27108765432';
const SUPPORT_WHATSAPP = '27829876543';
const SUPPORT_EMAIL = 'support@laundrypickuppro.app';

const isWeb = Platform.OS === 'web';

const faqs: FaqItem[] = [
  {
    question: 'How do I book a laundry pickup?',
    answer:
      'Tap the Book tab, choose your pickup and delivery addresses and times, review the details, and confirm your payment. We will handle the rest.',
  },
  {
    question: 'How do I track my order?',
    answer:
      'Open the Track tab to see live updates for your active orders, or open the order from My Orders and tap Track Order.',
  },
  {
    question: 'How do I cancel or change an order?',
    answer:
      'Orders can be cancelled from the order details screen as long as they are still in the Scheduled status. Contact support for changes after pickup.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept card payments, EFT, and cash paid to the driver at pickup. Card payments are processed securely.',
  },
  {
    question: 'What if my laundry is damaged or lost?',
    answer:
      'Please report any issues within 48 hours of delivery through this screen or email us, and we will resolve it for you.',
  },
];

export default function SupportScreen({ navigation }: Props) {
  const { orders } = useOrders();
  const { addMessage } = useSupport();
  const { user } = useAuth();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  if (!fontsLoaded) return null;

  const activeOrderWithDriver = orders.find(
    (o) => isOrderActive(o.status) && o.driver
  );

  const channels: ContactChannel[] = [
    {
      label: 'Call us',
      hint: SUPPORT_PHONE,
      icon: 'phone-outline',
      tint: GREEN_TINT,
      color: GREEN,
      onPress: () => Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => undefined),
    },
    {
      label: 'WhatsApp',
      hint: 'Chat with our team',
      icon: 'whatsapp',
      tint: TEAL_TINT,
      color: TEAL,
      onPress: () =>
        Linking.openURL(
          `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent('Hi, I need help with my laundry order.')}`
        ).catch(() => undefined),
    },
    {
      label: 'Email us',
      hint: SUPPORT_EMAIL,
      icon: 'email-outline',
      tint: BLUE_TINT,
      color: BLUE,
      onPress: () =>
        Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => undefined),
    },
  ];

  const handleSubmit = async () => {
    if (!user || user.role !== 'customer') {
      Alert.alert(
        'Sign in required',
        'Only registered customers can send support messages. Please sign in to your account.'
      );
      return;
    }
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Missing details', 'Please add a subject and a message.');
      return;
    }
    try {
      await addMessage({
        customerId: user.id,
        customerName: user.name,
        customerEmail: user.email,
        subject: subject.trim(),
        message: message.trim(),
      });
    } catch {
      Alert.alert(
        'Could not send message',
        'Something went wrong. Please try again.'
      );
      return;
    }
    Alert.alert(
      'Message sent',
      'Thanks! Our support team will get back to you within 24 hours.'
    );
    setSubject('');
    setMessage('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <BookingHeader title="Help & Support" onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeOrderWithDriver && (
          <View style={styles.driverCard}>
            <LinearGradient
              colors={['#7857FF', '#5334E0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.driverCardBg}
            >
              <View style={styles.driverShine} />
              <View style={styles.driverIconWrap}>
                <MaterialCommunityIcons name="account-circle-outline" size={28} color={WHITE} />
              </View>
              <View style={styles.driverBody}>
                <Text style={styles.driverLabel}>Your driver</Text>
                <Text style={styles.driverName}>{activeOrderWithDriver.driver}</Text>
                <Text style={styles.driverOrder}>
                  {activeOrderWithDriver.reference} · {activeOrderWithDriver.status}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.driverChatBtn}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('Chat', {
                    orderId: activeOrderWithDriver.reference ?? activeOrderWithDriver.id,
                    orderLabel: activeOrderWithDriver.reference,
                    contactName: activeOrderWithDriver.driver!,
                    myRole: 'customer',
                    myName: user?.name ?? 'Customer',
                  })
                }
              >
                <MaterialCommunityIcons name="chat-outline" size={18} color="#7857FF" />
                <Text style={styles.driverChatBtnText}>Chat</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        <Text style={styles.sectionTitle}>Contact us</Text>
        <View style={styles.channelRow}>
          {channels.map((channel) => (
            <TouchableOpacity
              key={channel.label}
              style={styles.channelCard}
              activeOpacity={0.85}
              onPress={channel.onPress}
            >
              <View style={[styles.channelIcon, { backgroundColor: channel.tint }]}>
                <MaterialCommunityIcons name={channel.icon} size={24} color={channel.color} />
              </View>
              <Text style={styles.channelLabel}>{channel.label}</Text>
              <Text style={styles.channelHint} numberOfLines={1}>
                {channel.hint}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Frequently asked questions</Text>
        <View style={styles.faqCard}>
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <TouchableOpacity
                key={faq.question}
                style={[styles.faqRow, index === faqs.length - 1 && styles.faqRowLast]}
                activeOpacity={0.85}
                onPress={() => setOpenFaq(isOpen ? null : index)}
              >
                <View style={styles.faqQuestionRow}>
                  <View style={styles.faqIcon}>
                    <MaterialCommunityIcons name="help-circle-outline" size={18} color={PURPLE} />
                  </View>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <MaterialCommunityIcons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={TEAL}
                  />
                </View>
                {isOpen && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Report a problem</Text>
        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Subject</Text>
          <View style={styles.inputField}>
            <MaterialCommunityIcons name="tag-outline" size={18} color={TEXT_MUTED} />
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="What went wrong?"
              placeholderTextColor={TEXT_MUTED}
            />
          </View>

          <Text style={styles.inputLabel}>Message</Text>
          <View style={[styles.inputField, styles.messageField]}>
            <MaterialCommunityIcons
              name="message-text-outline"
              size={18}
              color={TEXT_MUTED}
              style={styles.messageIcon}
            />
            <TextInput
              style={[styles.input, styles.messageInput]}
              value={message}
              onChangeText={setMessage}
              placeholder="Tell us more about the issue…"
              placeholderTextColor={TEXT_MUTED}
              multiline
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={styles.submitTouch}
            activeOpacity={0.9}
            onPress={handleSubmit}
          >
            <LinearGradient colors={GRADIENT_VIBRANT} style={styles.submitButton}>
              <View style={styles.shine} />
              <Text style={styles.submitText}>Send Message</Text>
              <MaterialCommunityIcons name="send" size={18} color={WHITE} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
    ...(isWeb ? { maxWidth: 600, alignSelf: 'center', width: '100%' } : {}),
  },
  channelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  channelCard: {
    width: '31%',
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#1F2933',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  channelIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  channelLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: TEXT_DARK,
    marginTop: 10,
  },
  channelHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 9,
    color: TEXT_MUTED,
    marginTop: 2,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: SECTION,
    marginBottom: 10,
  },
  driverCard: {
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#7857FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
  },
  driverCardBg: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  driverShine: {
    position: 'absolute',
    top: -30,
    left: -30,
    width: 90,
    height: 120,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ rotate: '20deg' }],
  },
  driverIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverBody: {
    flex: 1,
  },
  driverLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  driverName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: WHITE,
    marginTop: 1,
  },
  driverOrder: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  driverChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  driverChatBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#7857FF',
    marginLeft: 6,
  },
  faqCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 22,
    overflow: 'hidden',
    shadowColor: '#1F2933',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  faqRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F4',
  },
  faqRowLast: {
    borderBottomWidth: 0,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: PURPLE_TINT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  faqQuestion: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: SECTION,
    marginRight: 10,
  },
  faqAnswer: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_MUTED,
    marginTop: 10,
  },
  formCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    shadowColor: '#1F2933',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
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
  messageField: {
    height: 120,
    alignItems: 'flex-start',
    paddingTop: 14,
  },
  messageIcon: {
    marginTop: 2,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: TEXT_DARK,
  },
  messageInput: {
    padding: 0,
    minHeight: 90,
  },
  submitTouch: {
    borderRadius: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
  },
  submitText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: WHITE,
    marginRight: 8,
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
