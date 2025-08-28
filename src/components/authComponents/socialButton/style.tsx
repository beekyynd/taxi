import { StyleSheet } from 'react-native';
import {appFonts, windowHeight, windowWidth, fontSizes } from '@src/themes'; 


const styles = StyleSheet.create({
  container: {
    height: windowHeight(40),
    borderRadius: windowHeight(5.9),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: appFonts.medium,
    fontSize: fontSizes.FONT20,
    fontWeight: '400',
    paddingHorizontal: windowWidth(6),
  },
});

export default styles;
