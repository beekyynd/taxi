import { View } from 'react-native';
import React from 'react';
import { styles } from './styles';
import { VerticalLineType } from './types';
import { useValues } from '@App';
import { appColors } from '@src/themes';

export function VerticalLine ({ dynamicHeight }:VerticalLineType) {
  const {isDark}=useValues()
  return (
    <View style={[styles.verticalLine, { height: dynamicHeight || '100%' },{backgroundColor:isDark?appColors.darkBorder:appColors.border}]} />
  );
};
