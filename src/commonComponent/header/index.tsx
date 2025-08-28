import { View } from 'react-native';
import React from 'react';
import { HeaderContainer } from '../headingContainer/index';
import { HeaderTypes } from './types';
import { styles } from './styles';
import { useValues } from '../../../App';

export function Header({ value, container, backgroundColor }: HeaderTypes) {
  const { bgFullStyle, linearColorStyle } = useValues();
  return (
    <View
      style={{ backgroundColor: linearColorStyle }}>
      <View style={[styles.headerView, { backgroundColor: bgFullStyle }, backgroundColor ? { backgroundColor } : {}]}>
        <HeaderContainer value={value} />
      </View>
      <View>{container}</View>
    </View>
  );
};
