import { View } from 'react-native';
import React from 'react';
import { AuthText } from '../../../../../components/authComponents/authText/index';
import { useSelector } from 'react-redux';

export function SignInTextContainer () {
  const { translateData } = useSelector(
    (state: any) => state.setting
  );
  return (
    <View>
      <AuthText title={translateData.authTitle} subtitle={translateData.authDescription} />
    </View>
  );
};
