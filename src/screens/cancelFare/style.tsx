import { StyleSheet } from 'react-native';
import { commonStyles } from '../../styles/commonStyle';
import { windowHeight, windowWidth } from '@src/themes';
import { external } from '../../styles/externalStyle';

const styles = StyleSheet.create({
  container: {
    marginVertical: windowHeight(8),
    borderRadius: windowHeight(6),
    overflow: 'hidden',
    paddingBottom: windowHeight(9),
  },
  img: {
    width: windowHeight(28),
    height: windowHeight(28),
    borderRadius: windowHeight(26),
  },
  titleText: {
    ...commonStyles.mediumTextBlack12,
    ...external.mh_5,
  },
  totalRating: {
    ...commonStyles.regularText,
  },
  headerContainer: {
    height: windowHeight(60),
  },
  rating: {
    marginVertical: windowHeight(3),
    marginHorizontal: windowWidth(3)
  },
  row: {
    flexDirection: "row"
  },
  modelView: { alignSelf: 'center', width: windowWidth(260) },
});
export { styles };
