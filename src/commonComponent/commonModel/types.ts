import React, { ReactNode } from 'react';
import { DimensionValue } from 'react-native';

export enum AnimationType {
  Slide = 'slide',
  Fade = 'fade',
  None = 'none',
}

export interface CommonModelTypes {
  isVisible?: boolean;
  value?: React.ReactNode;
  animationType?: any;
  paddingTop?: DimensionValue;
  justifyContent?: any;
  closeModal?: any;
  onPress?: any;
  onBackdropPress?:any;
}
