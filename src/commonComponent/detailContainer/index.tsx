import { Text, View } from 'react-native';
import React from 'react';
import { external } from '../../styles/externalStyle';
import { commonStyles } from '../../styles/commonStyle';
import { DetailContainerProps } from './types';
import { useValues } from '../../../App';

export function DetailContainer({ title, value }: DetailContainerProps) {
  const { textColorStyle, viewRTLStyle, textRTLStyle } = useValues();
  return (
    <View style={[, external.js_space, external.ai_center, { flexDirection: viewRTLStyle }]}>
      <Text style={[commonStyles.regularText, { textAlign: textRTLStyle }]}>{title}</Text>
      <Text style={[commonStyles.regularText, { color: textColorStyle, textAlign: textRTLStyle }]}>
        {value}
      </Text>
    </View>
  );
};
