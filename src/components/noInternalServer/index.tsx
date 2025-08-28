import { View, Text } from "react-native";
import React from "react";
import { styles } from "./styles";
import { useValues } from "@App";
import { appColors } from "@src/themes";
import FastImage from "react-native-fast-image";
import Images from "@src/utils/images";

export function NoInternalServer() {
  const { isDark } = useValues();



  return (
    <View style={styles.mainContainer}>
      <FastImage source={Images.internalSerivce} style={styles.image} resizeMode="contain" />
      <View style={[styles.mainView]}>
        <Text style={[styles.title, { color: isDark ? appColors.whiteColor : appColors.primaryText }]}>Internal Server Error</Text>
        <Text style={[styles.details]}>We’re currently experiencing technical issues. Our team is working to restore service as quickly as possible.</Text>
      </View>
    </View>
  );
}
