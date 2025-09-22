import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const AnimationEngine = ({ 
  children, 
  animations = [], 
  onAnimationComplete,
  style = {} 
}) => {
  const animationValues = useRef({}).current;

  useEffect(() => {
    if (animations.length === 0) return;

    const activeAnimations = animations.map(animation => {
      const { id, type, duration = 1000, delay = 0, ...config } = animation;
      
      // Initialize animation value if it doesn't exist
      if (!animationValues[id]) {
        animationValues[id] = new Animated.Value(0);
      }

      const animatedValue = animationValues[id];

      switch (type) {
        case 'damage':
          return createDamageAnimation(animatedValue, duration, delay, config);
        case 'heal':
          return createHealAnimation(animatedValue, duration, delay, config);
        case 'charge':
          return createChargeAnimation(animatedValue, duration, delay, config);
        case 'block':
          return createBlockAnimation(animatedValue, duration, delay, config);
        case 'burn':
          return createBurnAnimation(animatedValue, duration, delay, config);
        case 'fadeIn':
          return createFadeInAnimation(animatedValue, duration, delay, config);
        case 'fadeOut':
          return createFadeOutAnimation(animatedValue, duration, delay, config);
        case 'shake':
          return createShakeAnimation(animatedValue, duration, delay, config);
        case 'pulse':
          return createPulseAnimation(animatedValue, duration, delay, config);
        case 'slide':
          return createSlideAnimation(animatedValue, duration, delay, config);
        default:
          return null;
      }
    }).filter(Boolean);

    if (activeAnimations.length > 0) {
      Animated.parallel(activeAnimations).start((finished) => {
        if (finished && onAnimationComplete) {
          onAnimationComplete();
        }
      });
    }
  }, [animations]);

  const createDamageAnimation = (animatedValue, duration, delay, config) => {
    animatedValue.setValue(0);
    return Animated.sequence([
      Animated.delay(delay),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: duration * 0.3,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: duration * 0.7,
        useNativeDriver: true,
      }),
    ]);
  };

  const createHealAnimation = (animatedValue, duration, delay, config) => {
    animatedValue.setValue(0);
    return Animated.sequence([
      Animated.delay(delay),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: duration * 0.5,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: duration * 0.5,
        useNativeDriver: true,
      }),
    ]);
  };

  const createChargeAnimation = (animatedValue, duration, delay, config) => {
    animatedValue.setValue(0);
    return Animated.sequence([
      Animated.delay(delay),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      }),
    ]);
  };

  const createBlockAnimation = (animatedValue, duration, delay, config) => {
    animatedValue.setValue(0);
    return Animated.sequence([
      Animated.delay(delay),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: duration * 0.2,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: duration * 0.8,
        useNativeDriver: true,
      }),
    ]);
  };

  const createBurnAnimation = (animatedValue, duration, delay, config) => {
    animatedValue.setValue(0);
    return Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: duration * 0.5,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: duration * 0.5,
          useNativeDriver: true,
        }),
      ]),
      { iterations: 3 }
    );
  };

  const createFadeInAnimation = (animatedValue, duration, delay, config) => {
    animatedValue.setValue(0);
    return Animated.sequence([
      Animated.delay(delay),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
    ]);
  };

  const createFadeOutAnimation = (animatedValue, duration, delay, config) => {
    animatedValue.setValue(1);
    return Animated.sequence([
      Animated.delay(delay),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }),
    ]);
  };

  const createShakeAnimation = (animatedValue, duration, delay, config) => {
    animatedValue.setValue(0);
    return Animated.sequence([
      Animated.delay(delay),
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: duration / 8,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: -1,
            duration: duration / 8,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: duration / 8,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 }
      ),
    ]);
  };

  const createPulseAnimation = (animatedValue, duration, delay, config) => {
    animatedValue.setValue(1);
    return Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(animatedValue, {
          toValue: 1.2,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 }
    );
  };

  const createSlideAnimation = (animatedValue, duration, delay, config) => {
    const { from = 0, to = 1 } = config;
    animatedValue.setValue(from);
    return Animated.sequence([
      Animated.delay(delay),
      Animated.timing(animatedValue, {
        toValue: to,
        duration,
        useNativeDriver: true,
      }),
    ]);
  };

  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});

export default AnimationEngine;