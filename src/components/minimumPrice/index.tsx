import { Text, View } from 'react-native';
import React from 'react';
import { external } from '../../styles/externalStyle';
import { commonStyles } from '../../styles/commonStyle';
import { useValues } from '../../../App';
import { styles } from './styles';
import { useSelector } from 'react-redux';
import { RootState } from '@src/api/store';

export function MinimumPrice () {
  const { textColorStyle, bgContainer} = useValues();
  const { translateData } = useSelector((state:RootState) => state.setting);

  return (
    <View style={[styles.container, { backgroundColor: bgContainer }]}>
      <Text
        style={[
          external.ti_center,
          external.pv_10,
          external.ph_30,
          commonStyles.mediumTextBlack12,
          { color: textColorStyle },
        ]}>
        {translateData.minPrice}
      </Text>
    </View>
  );
};
