import React, { useEffect, useState } from "react";
import { Alert, BackHandler, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AuthContainer } from "../../../components/authComponents/authContainer/index";
import { InputText, Button, notificationHelper } from "@src/commonComponent";
import { AuthText } from "../../../components/authComponents/authText/index";
import { external } from "../../../styles/externalStyle";
import { appColors, windowHeight } from "@src/themes";
import { useValues } from "../../../../App";
import { EyeClose, EyeOpen } from "@utils/icons";
import styles from "./styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { selfData, userRegistration } from "@src/api/store/actions";
import { setValue } from "@src/utils/localstorage";
import { useAppNavigation, useAppRoute } from "@src/utils/navigation";
import { commonStyles } from "@src/styles/commonStyle";
import CountryPicker from 'react-native-country-picker-modal';
import { ValidatePhoneNumber } from "@src/utils/validation";
import messaging from '@react-native-firebase/messaging';
import { useNavigation } from "@react-navigation/native";

export function SignUp() {
  const { isDark, textRTLStyle, setToken, viewRTLStyle } = useValues();
  const [isEmailUser, setIsEmailUser] = useState(false);
  const [userName, setUserName] = useState("");
  const route = useAppRoute();
  const usercredentialCode = route?.params?.countryCode ?? "91";
  const usercredential = route?.params?.phoneNumber ?? "1234567890";
  const rawCode = route.params?.countryCode ?? "91";
  const cleanCode = rawCode.replace('+', '');
  const [countryCode, setCountryCode] = useState({
    callingCode: [cleanCode],
    cca2: route?.params?.cca2 ?? 'US',
  });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [userNameError, setUserNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [numberError, setNumberError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [fcmToken, setFcmToken] = useState<string>("");
  const dispatch = useDispatch();
  const [success, setSuccess] = useState<boolean>(false);
  const { replace } = useAppNavigation();
  const { translateData } = useSelector((state: any) => state.setting);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);


  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(usercredential.trim());

    setIsEmailUser(isEmail);

    if (isEmail) {
      setEmail(usercredential.trim());
    } else {
      setPhoneNumber(usercredential.trim());
    }
  }, [usercredential]);

  useEffect(() => {
    const fetchToken = async () => {
      const token = await AsyncStorage.getItem("fcmToken");
      setFcmToken(token || "");
    };

    fetchToken();
  }, [dispatch]);


  const handleRegister = () => {
    let isValid = true;

    if (!userName.trim()) {
      setUserNameError(true);
      isValid = false;
    }

    if (!email.trim()) {
      setEmailError(true);
      isValid = false;
    } else if (emailError) {
      setEmailError(false);
    }

    if (phoneNumber) {
      const errorMsg = ValidatePhoneNumber(phoneNumber, (key) => translateData[key]);
      setNumberError(errorMsg);
      if (errorMsg) {
        isValid = false;
      }
    } else {
      setNumberError(translateData.validNo);
      isValid = false;

    }

    if (!password) {
      setPasswordError(translateData.errorPassword);
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError(translateData.passwordDigit);
      isValid = false;
    } else {
      setPasswordError("");
    }

    if (!confirmPassword) {
      setConfirmPasswordError(translateData.confirmPasswordErrorrrrrr);

      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError(translateData.passwordErrorrrrr);
      isValid = false;
    } else {
      setConfirmPasswordError("");
    }

    if (!isValid) {
      return;
    }
    setLoading(true)
    const payload = {
      username: userName,
      name: userName,
      email: email,
      country_code: countryCode.callingCode[0],
      phone: phoneNumber,
      fcm_token: fcmToken,
      password: password,
      password_confirmation: confirmPassword,
    };

    dispatch(userRegistration(payload))
      .unwrap()
      .then((res) => {

        if (res?.success) {

          if (res?.id) {
            messaging()
              .subscribeToTopic(`user_${res?.id}`)  // or 'users', 'offers', etc.
              .then(() => {
              });
          }

          setValue("token", res.access_token);
          setToken(res.access_token);
          replace("MyTabs");
          dispatch(selfData());
          setSuccess(false);
          setLoading(false)
        } else {
          setSuccess(false);
          notificationHelper('', res.message, 'error')
          setLoading(false);
        }
      })
      .finally(() => setLoading(false));
  };


  const [visible, setVisible] = useState(false);
  const onSelect = (country) => {
    setCountryCode(country);
    setVisible(false);
  };
  const navigation = useNavigation<any>();

  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={external.main}>
        <AuthContainer
          imageShow={false}
          topSpace={windowHeight(100)}
          container={
            <View>
              <AuthText
                title={translateData.createAccount}
                subtitle={translateData.registerContent}
              />
              <View>
                <InputText
                  showTitle={true}
                  title={translateData.nameeee}
                  borderColor={isDark ? appColors.bgDark : appColors.lightGray}
                  placeholder={translateData.enterYourNameeeeeeeee}
                  placeholderTextColor={
                    isDark ? appColors.darkText : appColors.regularText
                  }
                  customColor={
                    isDark ? appColors.whiteColor : appColors.blackColor
                  }
                  backgroundColor={
                    isDark ? appColors.bgDark : appColors.lightGray
                  }
                  show
                  value={userName}
                  onChangeText={(text) => {
                    setUserName(text);
                    setUserNameError(!text.trim());
                  }}
                  warningText={
                    userNameError ? `${translateData.enteryourNameeErrorrrr}` : ""
                  }
                />

                <Text style={[styles.numberTitle, { textAlign: textRTLStyle, color: isDark ? appColors.whiteColor : appColors.primaryText }]}>
                  {translateData.mobileNumber}
                </Text>
                <View style={styles.countryCodeContainer}>

                  <View>
                    <View
                      style={[
                        external.fd_row,
                        external.ai_center,
                        external.mt_5,
                        { flexDirection: viewRTLStyle },
                      ]}
                    >
                      <View
                        style={[
                          styles.countryCodeContainer1,
                          {
                            borderColor: isDark ? appColors.bgDark : appColors.lightGray,
                            alignItems: 'center',

                          },
                        ]}
                      >

                        <View>
                          <TouchableOpacity style={styles.pickerButton} onPress={() => {
                            if (isEmailUser) {
                              setVisible(true);
                            }
                            else {
                              setVisible(false)
                            }
                          }}>
                            <CountryPicker
                              countryCode={countryCode.cca2}
                              withFilter={true}
                              withFlag={true}
                              withCallingCode={true}
                              withAlphaFilter={true}
                              withEmoji={true}
                              onSelect={onSelect}
                              visible={visible}
                              onClose={() => setVisible(false)}
                              withFlagButton={false}
                            />

                            <Text style={[styles.codeText, { color: isDark ? appColors.whiteColor : appColors.primaryText }]}>
                              +{countryCode.callingCode[0]}
                            </Text>
                          </TouchableOpacity>


                        </View>


                      </View>
                      <View
                        style={[
                          styles.phoneNumberInput,
                          {
                            width: "74%",
                            backgroundColor: isDark ? appColors.bgDark : appColors.lightGray,
                            flexDirection: viewRTLStyle,
                            borderColor: isDark ? appColors.bgDark : appColors.lightGray,
                          },
                        ]}
                      >
                        <TextInput
                          style={[[commonStyles.regularText, { color: isDark ? appColors.whiteColor : appColors.blackColor }], [styles.inputText, { textAlign: textRTLStyle }]]}
                          placeholderTextColor={isDark ? appColors.darkText : appColors.regularText}
                          placeholder={translateData.enterPhone}
                          keyboardType="number-pad"
                          editable={isEmailUser}
                          value={phoneNumber}

                          onChangeText={(text) => {
                            const numericText = text.replace(/[^0-9]/g, "");
                            setPhoneNumber(numericText);
                            const errorMsg = ValidatePhoneNumber(numericText, (key) => translateData[key]);
                            setNumberError(errorMsg);
                          }}

                        />
                      </View>
                    </View>
                    {numberError && (
                      <Text style={styles.warningText}>
                        {translateData.validNo}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.emailView}>
                  <InputText
                    showTitle={true}
                    title={translateData.email}
                    placeholder={translateData.enterEmail}
                    borderColor={
                      isDark ? appColors.bgDark : appColors.lightGray
                    }
                    customColor={
                      isDark ? appColors.darkText : appColors.regularText
                    }
                    placeholderTextColor={
                      isDark ? appColors.darkText : appColors.regularText
                    }
                    backgroundColor={
                      isDark ? appColors.bgDark : appColors.lightGray
                    }
                    keyboard={"email-address"}
                    editable={!isEmailUser}
                    show
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      setEmailError(!emailRegex.test(text.trim()));
                    }}
                    warningText={
                      emailError ? `${translateData.enterEmailIdddd}` : ""
                    }
                  />
                </View>
                <View style={styles.passwordView}>
                  <InputText
                    showTitle={true}
                    title={translateData.password}
                    placeholder={translateData.enterPassword}
                    borderColor={
                      isDark ? appColors.bgDark : appColors.lightGray
                    }
                    customColor={
                      isDark ? appColors.darkText : appColors.regularText
                    }
                    placeholderTextColor={
                      isDark ? appColors.darkText : appColors.regularText
                    }
                    backgroundColor={
                      isDark ? appColors.bgDark : appColors.lightGray
                    }
                    show
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setPasswordError(text && text.length < 8 ? translateData.passwordDigit : "");
                    }}
                    rightIcon={
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        style={{ paddingHorizontal: windowHeight(0) }}
                      >
                        {isPasswordVisible ? <EyeOpen /> : <EyeClose />}
                      </TouchableOpacity>
                    }
                    secureText={!isPasswordVisible}
                    warningText={passwordError}
                  />
                </View>
                <View style={styles.confirmPasswordView}>
                  <InputText
                    showTitle={true}
                    title={translateData.confirmPassword}
                    placeholder={translateData.enterConfirmPassword}
                    borderColor={
                      isDark ? appColors.bgDark : appColors.lightGray
                    }
                    customColor={
                      isDark ? appColors.darkText : appColors.regularText
                    }
                    placeholderTextColor={
                      isDark ? appColors.darkText : appColors.regularText
                    }
                    backgroundColor={
                      isDark ? appColors.bgDark : appColors.lightGray
                    }
                    show
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);

                    }} rightIcon={
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() =>
                          setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
                        }
                        style={{ paddingHorizontal: windowHeight(0) }}
                      >
                        {isConfirmPasswordVisible ? <EyeOpen /> : <EyeClose />}
                      </TouchableOpacity>
                    }
                    secureText={!isConfirmPasswordVisible}
                    warningText={confirmPasswordError}
                  />
                </View>
              </View>
              <View style={styles.btn}>
                <Button
                  title={translateData.register}
                  onPress={handleRegister}
                  loading={loading}
                  textColor={appColors.whiteColor}
                  backgroundColor={appColors.primary}
                />
              </View>
            </View>
          }
        />
      </View>
    </ScrollView >
  );
}

