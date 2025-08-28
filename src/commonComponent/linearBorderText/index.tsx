import { Text, View } from 'react-native';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { appColors } from '@src/themes'; 
import styles from './styles';
import { or } from '../../constant';

export function LinearBorderText () {

  return (
    <View style={[styles.linearView]}>
      <LinearGradient
        start={{ x: 0.0, y: 3.0 }}
        end={{ x: 1.0, y: 5.0 }}
        style={styles.linearBorderStyle}
        colors={[appColors.linearBorder, appColors.subtitle]}
      />
      <Text style={[styles.orText]}>{or}</Text>
      <LinearGradient
        start={{ x: 0.0, y: 3.0 }}
        end={{ x: 1.0, y: 5.0 }}
        style={styles.linearBorderStyle}
        colors={[appColors.subtitle, appColors.linearBorder]}
      />
    </View>
  );
};
