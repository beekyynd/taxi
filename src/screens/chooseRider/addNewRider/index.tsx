import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';
import { Header, InputText, Button } from '@src/commonComponent';
import { styles } from './styles';
import { useValues } from '../../../../App';
import { useAppNavigation } from '@src/utils/navigation';
import { useSelector } from 'react-redux';
import { appColors, appFonts } from '@src/themes';
import { useRoute } from '@react-navigation/native';
import { commonStyles } from '@src/styles/commonStyle';
import { ValidatePhoneNumber } from '@src/utils/validation';
import CountryPicker from 'react-native-country-picker-modal';

export function AddNewRider() {
  const { replace } = useAppNavigation();
  const { bgFullStyle, linearColorStyle, isDark, textColorStyle, textRTLStyle, viewRTLStyle } = useValues();
  const [country, setCountry] = useState({ callingCode: ['1'], cca2: 'US', emoji: '' });
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const { translateData } = useSelector(state => state.setting);
  const route = useRoute();
  const { destination, stops, pickupLocation, service_ID, zoneValue, scheduleDate, service_category_ID } = route.params || {};
  const onSelect = (selectedCountry) => {
    setCountry(selectedCountry);
    setVisible(false);
  }


  return (
    <View style={[styles.mainContainer, { backgroundColor: linearColorStyle }]}>
      <Header
        value={translateData.ridertitle}
        container={
          <View>
            <Text
              style={[
                styles.textContainer,
                { color: textColorStyle, textAlign: textRTLStyle },
              ]}>
              {translateData.riderSubTitle}
            </Text>
            <View
              style={[styles.inputContainer, { backgroundColor: bgFullStyle }]}>
              <View style={styles.firstName}>
                <InputText
                  placeholder={translateData.enterYourName}
                  title={translateData.firstName}
                  value={name}
                  onChangeText={text => setName(text)}
                  showTitle={true}
                  backgroundColor={
                    isDark ? appColors.bgDark : appColors.lightGray
                  }
                  borderColor={isDark ? appColors.bgDark : appColors.lightGray}
                />
              </View>
              <View style={styles.lastName}>
                <InputText
                  placeholder={translateData.enterLastName}
                  title={translateData.lastName}
                  showTitle={true}
                  backgroundColor={
                    isDark ? appColors.bgDark : appColors.lightGray
                  }
                  borderColor={isDark ? appColors.bgDark : appColors.lightGray}
                />
              </View>
              <Text
                style={{
                  color: isDark ? appColors.whiteColor : appColors.primaryText,
                  fontFamily: appFonts.medium,
                  textAlign: textRTLStyle,
                }}>
                {translateData.addNewRiderPhoneNumber}
              </Text>

              <View
                style={[styles.codeContainer, { flexDirection: viewRTLStyle, }]}>
                <View
                  style={[
                    styles.countryCodeContainer,
                    {
                      alignItems: 'center',
                      backgroundColor:
                        isDark ? appColors.bgDark : appColors.lightGray,
                      borderColor: isDark ? appColors.bgDark : appColors.lightGray
                    },
                  ]}>

                  <TouchableOpacity style={styles.pickerButton} onPress={() => setVisible(true)}>
                    <CountryPicker
                      countryCode={country.cca2}
                      withFilter={true}
                      withFlag={true}
                      withCallingCode={true}
                      withAlphaFilter={true}
                      withEmoji={true}
                      onSelect={onSelect}
                      visible={visible}
                      onClose={() => setVisible(false)}
                    />
                    <Text style={[styles.codeText, { color: isDark ? appColors.whiteColor : appColors.primaryText }]}>
                      {country.emoji} +{country.callingCode[0]}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={[
                    styles.phoneNumberInput,
                    {
                      width: '71%',
                      flexDirection: viewRTLStyle,
                      backgroundColor:
                        isDark ? appColors.bgDark : appColors.lightGray,
                      borderColor: isDark ? appColors.bgDark : appColors.lightGray

                    },
                  ]}>
                  <TextInput
                    style={[
                      commonStyles.regularText,
                      styles.inputText,
                      {
                        color: isDark
                          ? appColors.whiteColor
                          : appColors.blackColor,
                        textAlign: textRTLStyle,

                      },
                    ]}
                    placeholderTextColor={
                      isDark ? appColors.darkText : appColors.regularText
                    }
                    placeholder={translateData.enterNumberandEmailBoth}
                    keyboardType="number-pad"
                    value={phoneNumber}

                    onChangeText={text => {
                      const phoneNoError = ValidatePhoneNumber(text);
                      setPhoneNumber(text);
                    }}
                  />
                </View>
              </View>
            </View>
          </View>
        }
      />

      <View style={styles.viewContainer}>
        <Button
          title={translateData.addRider}
          onPress={() =>
            replace('BookRide', {
              destination,
              stops,
              pickupLocation,
              service_ID,
              zoneValue,
              scheduleDate,
              service_category_ID,
              otherContect: phoneNumber,
              otherName: name
            })
          }
        />
      </View>
    </View>
  );
}


