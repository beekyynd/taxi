import { View } from 'react-native';
import React from 'react';
import { external } from '../../../../../styles/externalStyle';
import { Apple, Google } from '@utils/icons';
import { SocialButton } from '../../../../../components/authComponents/socialButton/index';
import { useValues } from '../../../../../../App';
import { useSelector } from 'react-redux';

export function SocialContainer() {
  const { bgFullStyle } = useValues();
  const { translateData } = useSelector(
    (state: any) => state.setting
  );

  return (
    <View>
      <View style={[external.mb_10]}>
        <SocialButton value={<Google />} title={translateData.googleId} />
      </View>
      <SocialButton
        value={<Apple color={bgFullStyle} />}
        title={translateData.appleId}
      />
    </View>
  );
};