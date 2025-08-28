import { BackHandler, Image, SafeAreaView, Text, View } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Button, HeaderTab } from "@src/commonComponent";
import { commonStyles } from "../../../../styles/commonStyle";
import { RideStatus } from "../rideStatus/index";
import { styles } from "./styles";
import { useValues } from "../../../../../App";
import Images from "@src/utils/images";
import { appColors } from "@src/themes";
import { clearValue, getValue } from "@src/utils/localstorage";
import { useDispatch, useSelector } from "react-redux";
import { resetState } from "@src/api/store/reducers";
import { allRides, settingDataGet } from "@src/api/store/actions";
import { useAppNavigation } from "@src/utils/navigation";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

export function RideScreen() {
  const { bgFullStyle, linearColorStyle, setIsRTL, setIsDark } = useValues();
  const dispatch = useDispatch();
  const { settingData, translateData } = useSelector((state) => state.setting);
  const { reset } = useAppNavigation();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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

  useFocusEffect(
    useCallback(() => {
      dispatch(allRides());
    }, [dispatch])
  );


  useEffect(() => {
    getValue("token").then((value) => {
      setToken(value);
      setLoading(false);
    });
  }, []);

  const gotoSignIn = () => {
    clearValue();
    dispatch(resetState());
    setIsRTL();
    setIsDark();
    dispatch(settingDataGet());

    reset({
      index: 0,
      routes: [
        { name: "SignIn" },
      ],
    });
  };

  return (
    <SafeAreaView style={[styles.safeAreaContainer, { backgroundColor: bgFullStyle }]}>
      <View style={[styles.container, commonStyles.heightHeader, { backgroundColor: bgFullStyle }]}>
        <HeaderTab tabName={translateData.rideTitle} />
      </View>
      <View style={[commonStyles.flexContainer, { backgroundColor: linearColorStyle }]}>
        {loading ? null : token ? (
          <RideStatus />
        ) : (
          <View style={styles.mainView}>
            <Image source={Images.noSignin} style={styles.imag} />
            <Text style={styles.signInText}>{translateData.signIn}</Text>
            <Text style={styles.accountText}>{translateData.signInNote}</Text>
            <View style={styles.buttonMainView}>
              <View style={styles.buttonView}>
                <Button
                  title={translateData.signIn}
                  textColor={appColors.whiteColor}
                  backgroundColor={appColors.primary}
                  onPress={gotoSignIn}
                />
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}