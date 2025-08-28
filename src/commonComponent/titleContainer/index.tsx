import {Text, View} from 'react-native';
import React from 'react';
import {commonStyles} from '../../styles/commonStyle';
import {TitleProps} from './types';
import {useValues} from '../../../App';

export function TitleContainer ({title}:TitleProps) {
  const {textColorStyle, textRTLStyle} = useValues();
  return (
    <View>
      <Text
        style={[
          commonStyles.mediumText23,
          {color: textColorStyle},
          {textAlign: textRTLStyle},
        ]}>
        {title}
      </Text>
    </View>
  );
};
