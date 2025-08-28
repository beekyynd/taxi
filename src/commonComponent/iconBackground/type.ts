import {ReactNode} from 'react';

export interface IconBgPropType {
  onPress?: () => void;
  icon?: ReactNode;
  height?: number;
  backgroundColor?: string;
  borderColor: string;
}
