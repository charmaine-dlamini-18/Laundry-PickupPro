import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost' | 'white';
  style?: ViewStyle;
};

export default function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
}: Props) {
  const isDisabled = disabled || loading;

  const getContainerStyle = () => {
    if (variant === 'outline') return styles.outline;
    if (variant === 'ghost') return styles.ghost;
    if (variant === 'white') return styles.white;
    return styles.primary;
  };

  const getTextStyle = () => {
    if (variant === 'outline') return styles.outlineText;
    if (variant === 'ghost') return styles.ghostText;
    if (variant === 'white') return styles.whiteText;
    return styles.primaryText;
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        getContainerStyle(),
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    width: '100%',
  },
  primary: {
    backgroundColor: colors.accent,
  },
  outline: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  white: {
    backgroundColor: colors.white,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.55,
  },
  primaryText: {
    ...typography.button,
    color: colors.white,
  },
  outlineText: {
    ...typography.button,
    color: colors.accent,
  },
  ghostText: {
    ...typography.button,
    color: colors.accent,
  },
  whiteText: {
    ...typography.button,
    color: colors.accent,
  },
});
