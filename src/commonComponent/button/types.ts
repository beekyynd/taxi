import {DimensionValue} from 'react-native';

export interface ButtonProps {
  title?: string;
  onPress?: () => void;
  width?: DimensionValue;
  backgroundColor?: string;
  textColor?: string;
  loading?: string;
}
