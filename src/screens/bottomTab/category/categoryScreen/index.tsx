import { BackHandler, SafeAreaView, ScrollView, View } from 'react-native';
import React, { useCallback } from 'react';
import { external } from '../../../../styles/externalStyle';
import { commonStyles } from '../../../../styles/commonStyle';
import { HeaderTab } from '@src/commonComponent';
import { CategoryDetail } from '../categoryDetail/index';
import { useValues } from '../../../../../App';
import { windowHeight } from '@src/themes';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

export function CategoryScreen() {
  const { bgFullStyle, linearColorStyle } = useValues();
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (navigation.canGoBack()) {
          navigation.navigate('HomeScreen'); // Normal back navigation
          return true;
        }
        return false; // Let system handle it (or show exit dialog)
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );

      return () => backHandler.remove();
    }, [navigation])
  );

  const { translateData } = useSelector((state) => state.setting);


  return (
    <SafeAreaView
      style={[external.fx_1, external.pt_13, { backgroundColor: bgFullStyle }]}>
      <View style={[commonStyles.heightHeader]}>
        <HeaderTab tabName={translateData?.services} />
      </View>
      <ScrollView
        contentContainerStyle={[external.Pb_10]}
        showsVerticalScrollIndicator={false}
        style={[
          commonStyles.flexContainer,
          { paddingTop: windowHeight(10) },
          { backgroundColor: linearColorStyle },
        ]}>
        <CategoryDetail />
      </ScrollView>
    </SafeAreaView>
  );
};
