import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import styles from './style';
import { external } from '../../../styles/externalStyle';
import { SocialButtonProps } from './types';
import { useValues } from '../../../../App';
import { useAppNavigation } from '@src/utils/navigation';
import { appColors } from '@src/themes';

export function SocialButton({ value, title }: SocialButtonProps) {
  const { navigate } = useAppNavigation();
  const { bgFullLayout, isDark } = useValues();

  return (
    <TouchableOpacity onPress={() => navigate('Payment')}
      activeOpacity={0.7}

      style={[styles.container, { backgroundColor: bgFullLayout }]}>
      <View style={[external.fd_row, external.ai_center]}>
        {value}
        <Text style={[styles.title, { color: isDark ? appColors.primaryText : appColors.whiteColor }]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};
