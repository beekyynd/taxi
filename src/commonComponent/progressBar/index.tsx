import React from 'react';
import { View } from 'react-native';
import ProgressBarAnimated from 'react-native-progress-bar-animated';
import { windowWidth } from '@src/themes';
import { appColors } from '@src/themes';

type progressbarProps = {
  value: number | string | any
}
export function ProgressBar({ value }: progressbarProps) {
  return (
    <View>
      <ProgressBarAnimated
        width={windowWidth(600)}
        value={value}
        backgroundColorOnComplete={appColors.primary}
        backgroundColor={appColors.primary}
        height={7}
        borderRadius={0}
      />
    </View>
  );
};
