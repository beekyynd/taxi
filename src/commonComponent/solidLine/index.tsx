import React from 'react';
import { View, ViewStyle } from 'react-native';
import { solidLineProps } from './types';
import { appColors } from '@src/themes'; 

export function SolidLine (props:solidLineProps) {
  const { width, height, color, marginVertical } = props;

  const containerStyle: ViewStyle = {
    width: typeof width === 'number' ? width : '100%',
    height: height || 1,
    backgroundColor: color || appColors.lightGray,
    marginVertical: marginVertical || 5,
  };

  return <View style={containerStyle} />;
};
