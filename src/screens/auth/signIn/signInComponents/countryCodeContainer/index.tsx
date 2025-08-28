import React, { useEffect, useState } from "react";
import { TextInput, View, Text, TouchableOpacity, Button, Alert } from "react-native";
import { commonStyles } from "../../../../../styles/commonStyle";
import { external } from "../../../../../styles/externalStyle";
import { appColors } from "@src/themes";
import styles from "../../styles";
import { useValues } from "../../../../../../App";
import { useSelector } from "react-redux";
import { validateEmail, ValidatePhoneNumber } from "@src/utils/validation";
import CountryPicker, { getAllCountries } from 'react-native-country-picker-modal';

type CountryCodeContainerProps = {
  countryCode?: string;
  setCountryCode?: (code: string) => void;
  phoneNumber?: string;
  setPhoneNumber?: (number: string) => void;
  width?: number | string;
  backGroundColor?: string;
  textBgColor?: string;
  borderColor?: string;
  borderColor1?: string;
  warning?: boolean;
  setCca2?: (code: string) => void;
  smsGateway?: string;
  error: any,
  setError: any

};

export function CountryCodeContainer({
  setCca2,
  setCountryCode,
  phoneNumber,
  setPhoneNumber,
  width,
  backGroundColor,
  borderColor,
  borderColor1,
  smsGateway,
  countryCode,
  error,
  setError

}: CountryCodeContainerProps) {
  const { viewRTLStyle, isDark, textRTLStyle } = useValues();
  const [show, setShow] = useState(false);
  const { translateData, taxidoSettingData } = useSelector((state: any) => state.setting);
  const [numberShow, setNumberShow] = useState(true)

  const handleBackgroundPress = () => {
    setShow(false);
  };

  const [country, setCountry] = useState({
    callingCode: [`${taxidoSettingData?.taxido_values?.ride?.country_code || ""}`],
    cca2: '',
    emoji: '',
  });

  useEffect(() => {
    const syncCountryFromProp = async () => {
      if (!countryCode) return;

      const codeOnly = countryCode.replace('+', '');
      const countries = await getAllCountries();
      const match = countries.find((c) => c.callingCode.includes(codeOnly));

      if (match) {
        setCountry({
          callingCode: [codeOnly],
          cca2: match.cca2,
          emoji: match.emoji,
        });
      }
    };

    syncCountryFromProp();
  }, [countryCode]);




  useEffect(() => {
    const fetchCountryFromCode = async () => {
      const code = taxidoSettingData?.taxido_values?.ride?.country_code;

      if (code) {
        try {
          const countries = await getAllCountries();
          const match = countries.find((c) =>
            c.callingCode.includes(code.toString())
          );

          if (match) {
            setCountry({
              callingCode: [code.toString()],
              cca2: match.cca2,
              emoji: '',
            });
          }
        } catch (err) {
          console.error('Error fetching countries:', err);
        }
      }
    };

    fetchCountryFromCode();
  }, [taxidoSettingData?.taxido_values?.ride?.country_code]);


  const handleTextChange = (newPhoneNumber: string) => {
    if (smsGateway === 'firebase') {
      const onlyNumbers = newPhoneNumber.replace(/[^0-9]/g, '');
      setPhoneNumber(onlyNumbers);
      setNumberShow(true);
      const errorMsg = ValidatePhoneNumber(onlyNumbers);
      if (errorMsg) {
        setError(errorMsg);
      } else {
        setError('');
      }
      return;
    }
    setPhoneNumber(newPhoneNumber);
    const isNumeric = /^\d*$/.test(newPhoneNumber);
    setNumberShow(isNumeric);
    if (isNumeric) {
      const errorMsg = ValidatePhoneNumber(newPhoneNumber);
      if (errorMsg) {
        setError(errorMsg);
        return;
      }
    } else {
      const errorMsg = validateEmail(newPhoneNumber);
      if (errorMsg) {
        setError(errorMsg);
        return;
      }
    }
    setError('');
  };


  const [visible, setVisible] = useState(false);


  const onSelect = (selectedCountry) => {
    setCountry(selectedCountry);
    setVisible(false);
    if (setCountryCode) {
      setCountryCode(`+${selectedCountry.callingCode[0]}`);
    }
    if (setCca2) {
      setCca2(selectedCountry.cca2);
    }
  };

  return (
    <View onPress={handleBackgroundPress}>
      <View>
        <View
          style={[
            external.fd_row,
            external.ai_center,
            external.mt_5,
            { flexDirection: viewRTLStyle },
          ]}
        >
          {numberShow && (
            <TouchableOpacity
              style={[
                styles.countryCodeContainer,
                {
                  backgroundColor: backGroundColor,
                  borderColor: borderColor1 ? borderColor1 : isDark ? appColors.darkPrimary : appColors.border,
                },
              ]}
              onPress={() => setVisible(true)}
            >
              <View style={styles.pickerButton} >
                <CountryPicker
                  countryCode={countryCode ? countryCode : country.callingCode[0]}
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
                {country.callingCode[0] && <Text style={[styles.codeText, { color: isDark ? appColors.whiteColor : appColors.primaryText }]}>
                  {country.emoji} +{country.callingCode[0]}
                </Text>}
              </View>
            </TouchableOpacity>
          )}

          <View
            style={[
              styles.phoneNumberInput,
              {
                width: numberShow ? (width || "74%") : '100%',
                backgroundColor: backGroundColor,
                flexDirection: viewRTLStyle,
                borderColor: borderColor,
                right: numberShow ? 0 : '3%'
              },
            ]}
          >

            <TextInput
              style={[[commonStyles.regularText, { color: isDark ? appColors.whiteColor : appColors.blackColor }], [styles.inputText, { textAlign: textRTLStyle }]]}
              placeholderTextColor={isDark ? appColors.darkText : appColors.regularText}
              placeholder={translateData.enterNumberandEmailBoth}
              keyboardType={smsGateway === 'firebase' ? 'phone-pad' : 'default'}
              value={phoneNumber}
              onChangeText={handleTextChange}
            />

          </View>

        </View>
        {error && <Text style={styles.warningText}>{error}</Text>}
      </View>

    </View>
  );
}

