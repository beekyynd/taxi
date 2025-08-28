import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Text, Animated, TouchableOpacity } from 'react-native';
import { appColors } from '@src/themes';
import useValues from '../../../App'
import styles from './styles';

export const AnimatedAlert = forwardRef((props, ref,) => {
  const animated = useRef(new Animated.Value(100)).current;
  const duration = 1000;
  const { viewRTLStyle } = useValues();

  useImperativeHandle(ref, () => ({
    animate: () => {
      animate();
    },
  }));

  const animate = () => {
    setTimeout(() => {
      slideIn();
    }, 1000);
    setTimeout(() => {
      slideOut();
    }, 5000);
  };

  const slideIn = () => {
    Animated.sequence([
      Animated.timing(animated, {
        toValue: props.val || 0,
        duration: duration,
        useNativeDriver: true,
      }),
    ]).start();
  };
  const slideOut = () => {
    Animated.sequence([
      Animated.timing(animated, {
        toValue: 100,
        duration: duration,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        styles.mainContainer,
        {
          backgroundColor: props.color
            ? props.color
            : props.success
              ? appColors.lightGray
              : appColors.alertBg,
          transform: [{ translateY: animated }],
          flexDirection: viewRTLStyle,
        },
      ]}>
      <Text style={styles.text}>{props.text}</Text>
      {props.subText && <TouchableOpacity activeOpacity={0.7} onPress={props.onPress} activeOpacity={0.7}
      >
        <Text style={styles.text}>{props.subText}</Text>
      </TouchableOpacity>}
    </Animated.View>
  );
});

