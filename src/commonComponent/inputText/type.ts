import { ReactNode } from "react";

export interface InputTextProps {
  title?: string;
  placeholder: string;
  icon?: ReactNode;
  show?: boolean;
  marginVertical?: number;
  backgroundColor?: string;
  placeholderTextColor?: string;
  rightIcon?: ReactNode;
  onPress?: () => void;
  value?: string;
  warningText?: string;
  keyboard?:  'default' | 'numeric' | 'email-address' | 'phone-pad' | "number-pad";
  showTitle?: boolean;
  secureText?: boolean;
  onChangeText?:(text: string) => void;
  customColor?:string;
  borderColor?:string,
  editable?:string,
}
