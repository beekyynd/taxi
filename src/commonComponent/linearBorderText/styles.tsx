import { StyleSheet } from 'react-native';
import { appFonts, fontSizes, windowHeight, appColors } from '../../themes';
import { external } from '../../styles/externalStyle';

const styles = StyleSheet.create({
  linearView: {
    ...external.fd_row,
    ...external.js_center,
    ...external.ai_center,
    ...external.mt_20,
    ...external.mb_10,
  },
  linearBorderStyle: {
    width: '30%',
    height: windowHeight(1.5),
  },
  orText: {
    fontSize: fontSizes.FONT17,
    fontWeight: '400',
    color: appColors.subtitle,
    fontFamily: appFonts.regular,
    ...external.mh_8,
  },

});

export default styles;
