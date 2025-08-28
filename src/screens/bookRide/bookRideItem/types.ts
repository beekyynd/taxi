import react from 'react';
import {ImageSourcePropType} from 'react-native';

export interface bookRideItemType {
  item: {
    img: ImageSourcePropType;
    title: string;
  };
  onPress: () => void;
  onPressAlternate: () => void;
  isSelected: any;
  isDisabled: boolean;
  couponsData: any;
  onPriceCalculated: any;
}
