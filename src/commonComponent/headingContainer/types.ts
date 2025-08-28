import {ReactNode} from 'react';

export interface headerPropType {
  value?: string;
  show?: boolean;
  icon?: ReactNode;
  onPressIcon?: () => void;
}
