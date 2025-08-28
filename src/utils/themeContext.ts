export interface ThemeContextType {
  isRTL: boolean;
  setIsRTL: React.Dispatch<React.SetStateAction<boolean>>;
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
  ShadowContainer: string;
  bgContainer: string;
  bgFullLayout: string;
  linearColorStyleTwo: string;
  linearColorStyle: string;
  textColorStyle: string;
  iconColorStyle: string;
  bgFullStyle: string;
  textRTLStyle: any;
  viewRTLStyle: any | string;
  imageRTLStyle: number;
  viewSelfRTLStyle: string | any;
  setToken: any;
  Google_Map_Key: string;
  notificationValue: any;
  setNotificationValues: React.Dispatch<React.SetStateAction<string>>;
  Google_Sign_Key: string;
  firebaseConfig: any
}
