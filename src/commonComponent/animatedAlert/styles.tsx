import { StyleSheet } from 'react-native';
import { fontSizes, windowHeight, windowWidth } from '@src/themes';
import { appColors, appFonts } from '@src/themes';

const styles = StyleSheet.create({
  mainContainer: {
    width: '100%',
    paddingHorizontal: windowWidth(6),
    marginTop: windowHeight(1),
    position: 'absolute',
    bottom: windowHeight(0),
    alignItems: 'center',
    justifyContent: 'center',
    height: windowHeight(45),
  },
  text: {
    color: appColors.whiteColor,
    fontFamily: appFonts.medium,
    fontSize: fontSizes.FONT18,
    marginLeft: windowWidth(10),
  },
});

export default styles;

