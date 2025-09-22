import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

const ActionButton = ({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  icon = null,
  requiredCharges = 0,
  availableCharges = 0,
  style = {},
  textStyle = {},
  showChargeRequirement = false,
}) => {
  const isChargeInsufficient = requiredCharges > availableCharges;
  const isDisabled = disabled || isChargeInsufficient;

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          button: isDisabled ? styles.secondaryButtonDisabled : styles.secondaryButton,
          text: isDisabled ? styles.secondaryTextDisabled : styles.secondaryText,
        };
      case 'danger':
        return {
          button: isDisabled ? styles.dangerButtonDisabled : styles.dangerButton,
          text: isDisabled ? styles.dangerTextDisabled : styles.dangerText,
        };
      case 'success':
        return {
          button: isDisabled ? styles.successButtonDisabled : styles.successButton,
          text: isDisabled ? styles.successTextDisabled : styles.successText,
        };
      default: // primary
        return {
          button: isDisabled ? styles.primaryButtonDisabled : styles.primaryButton,
          text: isDisabled ? styles.primaryTextDisabled : styles.primaryText,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          button: styles.smallButton,
          text: styles.smallText,
        };
      case 'large':
        return {
          button: styles.largeButton,
          text: styles.largeText,
        };
      default: // medium
        return {
          button: styles.mediumButton,
          text: styles.mediumText,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        styles.baseButton,
        variantStyles.button,
        sizeStyles.button,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={isDisabled ? 1 : 0.7}
    >
      <View style={styles.buttonContent}>
        {icon && (
          <Text style={[styles.icon, variantStyles.text]}>{icon}</Text>
        )}
        <Text style={[
          styles.baseText,
          variantStyles.text,
          sizeStyles.text,
          textStyle,
        ]}>
          {title}
        </Text>
        {showChargeRequirement && requiredCharges > 0 && (
          <Text style={[
            styles.chargeRequirement,
            variantStyles.text,
            isChargeInsufficient && styles.insufficientCharges,
          ]}>
            ⚡ {requiredCharges}
          </Text>
        )}
      </View>
      {isChargeInsufficient && showChargeRequirement && (
        <Text style={styles.insufficientLabel}>
          Need {requiredCharges - availableCharges} more charges
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  baseText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  icon: {
    fontSize: 16,
  },
  chargeRequirement: {
    fontSize: 12,
    fontWeight: '500',
  },
  insufficientCharges: {
    color: '#ff4444',
  },
  insufficientLabel: {
    fontSize: 10,
    color: '#ff4444',
    fontStyle: 'italic',
    marginTop: 4,
  },
  
  // Size variants
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  smallText: {
    fontSize: 12,
  },
  mediumButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  mediumText: {
    fontSize: 14,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  largeText: {
    fontSize: 16,
  },

  // Primary variant
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonDisabled: {
    backgroundColor: '#ccc',
  },
  primaryText: {
    color: 'white',
  },
  primaryTextDisabled: {
    color: '#999',
  },

  // Secondary variant
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonDisabled: {
    backgroundColor: '#f8f9fa',
    borderColor: '#ccc',
  },
  secondaryText: {
    color: '#007AFF',
  },
  secondaryTextDisabled: {
    color: '#999',
  },

  // Danger variant
  dangerButton: {
    backgroundColor: '#ff4444',
  },
  dangerButtonDisabled: {
    backgroundColor: '#ffcccc',
  },
  dangerText: {
    color: 'white',
  },
  dangerTextDisabled: {
    color: '#999',
  },

  // Success variant
  successButton: {
    backgroundColor: '#28a745',
  },
  successButtonDisabled: {
    backgroundColor: '#ccffcc',
  },
  successText: {
    color: 'white',
  },
  successTextDisabled: {
    color: '#999',
  },
});

export default ActionButton;