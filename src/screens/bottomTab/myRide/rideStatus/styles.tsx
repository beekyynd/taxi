import { StyleSheet } from 'react-native';
import { appColors, windowWidth } from '@src/themes';
import { commonStyles } from '../../../../styles/commonStyle';
import { windowHeight } from '@src/themes';

const styles = StyleSheet.create({
  mainView: { paddingVertical: windowHeight(18),paddingHorizontal:windowHeight(8) },
  container: {
    backgroundColor: appColors.whiteColor,
    marginHorizontal: windowHeight(5.9),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: windowHeight(5),
    borderWidth: windowHeight(1),
    paddingHorizontal: windowHeight(8),
    paddingVertical: windowHeight(6.7),
    right: windowWidth(1),
    ...commonStyles.shadowContainer,
    borderColor: appColors.border,
    left:windowWidth(0.5)
  },
});
export { styles };
