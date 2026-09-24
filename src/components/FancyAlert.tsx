import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type Icon = keyof typeof MaterialCommunityIcons.glyphMap;

const TEAL = '#0F363F';
const TEAL_MID = '#1E5660';

const GRADIENT_TEAL = [TEAL_MID, TEAL] as const;

type Props = {
  visible: boolean;
  title: string;
  message: string;
  icon?: Icon;
  iconColor?: string;
  iconBackground?: string;
  buttonText?: string;
  onClose: () => void;
};

export default function FancyAlert({
  visible,
  title,
  message,
  icon = 'information-outline',
  iconColor = TEAL,
  iconBackground = '#E2ECEB',
  buttonText = 'OK',
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: iconBackground }]}>
            <MaterialCommunityIcons name={icon} size={34} color={iconColor} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity
            style={styles.buttonTouch}
            activeOpacity={0.85}
            onPress={onClose}
          >
            <LinearGradient colors={GRADIENT_TEAL} style={styles.button}>
              <Text style={styles.buttonText}>{buttonText}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 38, 58, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 26,
    alignItems: 'center',
    elevation: 14,
    shadowColor: '#0F363F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#1F2933',
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: '#7A869A',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonTouch: {
    alignSelf: 'stretch',
    borderRadius: 15,
  },
  button: {
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  buttonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
