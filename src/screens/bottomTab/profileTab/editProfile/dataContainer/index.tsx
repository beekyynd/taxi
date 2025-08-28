import React, { useState, useEffect } from "react";
import {
  TouchableWithoutFeedback,
  View,
  BackHandler,
  TouchableOpacity,
  Text,
  TextInput,
} from "react-native";
import { InputText } from "@src/commonComponent";
import { styles } from "../style";
import { useValues } from "../../../../../../App";
import { appColors, appFonts, windowHeight, windowWidth } from "@src/themes";
import { commonStyles } from "@src/styles/commonStyle";
import { useLoadingContext } from "@src/utils/context";
import { SkeletonInput } from "./component";
import { useSelector } from "react-redux";
import { Country, CountryCode, getAllCountries } from "react-native-country-picker-modal";
import AsyncStorage from "@react-native-async-storage/async-storage";

const findCountryByCallingCode = async (code: string) => {
  const countries = await getAllCountries();
  return countries.find((country) => country.callingCode.includes(code));
};

export function DataContainer({
  data,
  width,
  setForm: setParentForm,
}) {
  const { isDark, viewRTLStyle, isRTL, textColorStyle, textRTLStyle, bgContainer } =
    useValues();
  const { translateData } = useSelector((state: any) => state.setting);
  const [currentCallingCode, setCurrentCallingCode] = useState(
    data?.country_code || "+1"
  );
  const [cca2Code, setCca2Code] = useState<CountryCode | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const { addressLoaded, setAddressLoaded } = useLoadingContext();

  const [phoneNumber, setPhoneNumber] = useState(
    data?.phone ? data.phone.toString() : ""
  );
  const [form, setForm] = useState({
    username: data?.name || "",
    email: data?.email || "",
    countryCode: data?.country_code || "+1",
    cca2: cca2Code,
    phoneNumber: data?.phone ? data.phone.toString() : "",
  });

  // 🔄 keep parent in sync whenever form changes
  useEffect(() => {
    setParentForm?.(form);
  }, [form, setParentForm]);

  // ------------------- LOADING --------------------
  useEffect(() => {
    if (!addressLoaded) {
      setLoading(true);
      setLoading(false);
      setAddressLoaded(true);
    }
  }, [addressLoaded, setAddressLoaded]);

  // ------------------- SKELETON -------------------
  const SkeletonLoader = ({ variant }) => {
    let rectProps = { x: "0%", y: "0", width: "100%" };
    if (variant === 4) {
      rectProps = { x: "0%", y: "80%", width: "100%" };
    }
    return <SkeletonInput x={rectProps.x} width={rectProps.width} />;
  };

  // ------------------- HANDLE INPUT -------------------
  const onChange = (name: string, value: string) => {
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  // ------------------- COUNTRY PICKER -------------------
  const [visible, setVisible] = useState(false);

  const closeCountryPicker = () => setVisible(false);

  const handleBackgroundPress = () => closeCountryPicker();

  const handleBackPress = () => {
    if (visible) {
      setVisible(false);
      return true;
    }
    return false;
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );
    return () => backHandler.remove();
  }, [visible]);

  useEffect(() => {
    const loadCountry = async () => {
      try {
        const saved = await AsyncStorage.getItem("userCountry");
        let selected = null;
        if (saved) {
          selected = JSON.parse(saved);
        } else if (data?.country_code) {
          const rawCode = data.country_code.replace("+", "");
          const found = await findCountryByCallingCode(rawCode);
          if (found) {
            selected = {
              code: `+${found.callingCode[0]}`,
              cca2: found.cca2,
            };
          }
        }

        if (selected) {
          setCurrentCallingCode(selected.code);
          setCca2Code(selected.cca2);
          onChange("countryCode", selected.code);
          onChange("cca2", selected.cca2);
        }
      } catch (err) {
      }
    };
    loadCountry();
  }, [data]);

  const onSelect = (selectedCountry: Country) => {
    const newCode = `+${selectedCountry.callingCode[0]}`;
    const newCca2 = selectedCountry.cca2;
    setCurrentCallingCode(newCode);
    setCca2Code(newCca2);
    onChange("countryCode", newCode);
    onChange("cca2", newCca2);
    setVisible(false);
    AsyncStorage.setItem(
      "userCountry",
      JSON.stringify({ code: newCode, cca2: newCca2 })
    );
  };

  const editable = !phoneNumber;

  // ------------------- UI -------------------
  return (
    <View style={styles.inputContainer}>
      {loading ? (
        <View style={{ marginTop: windowHeight(20), right: windowHeight(7) }}>
          {[1, 2, 3, 4].map((variant) => (
            <View key={variant} style={{ marginBottom: windowHeight(10) }}>
              <SkeletonLoader variant={variant} />
            </View>
          ))}
        </View>
      ) : (
        <>
          {/* USERNAME */}
          <InputText
            title={translateData.userName}
            showTitle={true}
            borderColor={isDark ? bgContainer : appColors.lightGray}
            backgroundColor={isDark ? bgContainer : appColors.lightGray}
            placeholder={translateData.enterUserName}
            placeholderTextColor={
              isDark ? appColors.darkText : appColors.regularText
            }
            value={form.username}
            onChangeText={(value) => onChange("username", value)}
          />

          {/* PHONE LABEL */}
          <Text
            style={{
              color: isDark ? appColors.whiteColor : appColors.primaryText,
              fontFamily: appFonts.medium,
              textAlign: textRTLStyle,
              marginTop: windowHeight(8),
            }}
          >
            {translateData.mobileNumber}
          </Text>

          {/* PHONE FIELD */}
          <View style={styles.countryMainView}>
            <View style={{ flexDirection: viewRTLStyle }}>
              {/* Country Code */}
              <View
                style={[
                  styles.countryCodeContainer,
                  {
                    backgroundColor: isDark ? bgContainer : appColors.lightGray,
                    borderColor: isDark ? bgContainer : appColors.lightGray,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setVisible(true)}
                >
                  <Text
                    style={[
                      styles.codeText,
                      {
                        color: isDark
                          ? appColors.whiteColor
                          : appColors.regularText,
                      },
                    ]}
                  >
                    {currentCallingCode}
                  </Text>
                </TouchableOpacity>
                {visible && (
                  <TouchableWithoutFeedback onPress={handleBackgroundPress}>
                    <View style={styles.touchbleView} />
                  </TouchableWithoutFeedback>
                )}
              </View>

              {/* Phone Number */}
              <View
                style={[
                  styles.phoneNumberInput,
                  {
                    width: width || "71%",
                    backgroundColor: isDark ? bgContainer : appColors.lightGray,
                    borderColor: isDark ? bgContainer : appColors.lightGray,
                  },
                ]}
              >
                <TextInput
                  style={[
                    commonStyles.regularText,
                    {
                      left: isRTL ? windowWidth(145) : windowWidth(13),
                      color: editable ? textColorStyle : appColors.regularText,
                    },
                  ]}
                  placeholderTextColor={
                    isDark ? appColors.darkText : appColors.regularText
                  }
                  placeholder={translateData.enterPhone}
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={(val) => {
                    setPhoneNumber(val);
                    onChange("phoneNumber", val); // ✅ sync to form
                  }}
                  editable={editable}
                />
              </View>
            </View>
          </View>

          {/* EMAIL */}
          <InputText
            title={translateData.email}
            showTitle={true}
            borderColor={isDark ? bgContainer : appColors.lightGray}
            backgroundColor={isDark ? bgContainer : appColors.lightGray}
            placeholder={translateData.enterEmail}
            placeholderTextColor={
              isDark ? appColors.darkText : appColors.regularText
            }
            value={form.email}
            onChangeText={(value) => onChange("email", value)}
            editable={!form.email}
          />
        </>
      )}
    </View>
  );
}
