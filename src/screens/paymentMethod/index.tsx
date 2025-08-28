import { View, Text, Image, TouchableOpacity, TextInput, FlatList, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Header, Button, RadioButton, notificationHelper } from '@src/commonComponent';
import { useValues } from '../../../App';
import styles from './styles';
import { appColors, appFonts, fontSizes, windowHeight, windowWidth } from '@src/themes';
import { paymentsData } from '../../api/store/actions/paymentAction';
import { useDispatch, useSelector } from 'react-redux';
import PaymentDetails from './component';
import { allpayment, allRides, couponVerifyData, walletData } from '@src/api/store/actions';
import { CustomBackHandler } from '@src/components';
import { useAppNavigation, useAppRoute } from '@src/utils/navigation';
import { external } from '@src/styles/externalStyle';
import { clearValue } from '@src/utils/localstorage';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import { CustomRadioButton } from '@src/commonComponent/radioButton/customRadioButton';
import { Cash, OnlinePayment, Wallet } from '@src/utils/icons';
import NotificationHelper from '@src/components/helper/localNotificationHelper';

export function PaymentMethod() {
  const { navigate } = useAppNavigation();
  const route = useAppRoute();
  const dispatch = useDispatch();
  const { rideData } = route?.params || {};
  const { zoneValue } = useSelector(state => state.zone);
  const { translateData, taxidoSettingData } = useSelector((state: any) => state.setting);
  const { linearColorStyle, bgContainer, textColorStyle, textRTLStyle, viewRTLStyle, isDark, notificationValue } = useValues();
  const tipValues = [
    zoneValue?.currency_symbol + 5,
    zoneValue?.currency_symbol + 10,
    zoneValue?.currency_symbol + 15,
    translateData.custom,
  ];
  const [selectedValue, setSelectedValue] = useState(null);
  const [customTip, setCustomTip] = useState();
  const [coupon, setCoupon] = useState(null);
  const [isValid, setIsValid] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [inputValue, setInputValue] = useState(coupon?.code || '');
  const navigation = useNavigation();
  const [rideDetails, setRideDetails] = useState();
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'online' | 'wallet' | null>('cash');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const { walletTypedata } = useSelector((state: any) => state.wallet);

  const getRideData = async (rideId: string) => {
    try {
      const doc = await firestore().collection('rides').doc(rideId.toString()).get();

      if (doc.exists) {
        const data = doc.data();
        setRideDetails(data);
        return data;
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching ride data:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchRide = async () => {
      const data = await getRideData(rideData?.id);
      if (data) {

      }
    };

    fetchRide();
  }, []);

  useEffect(() => {
    setInputValue(coupon?.code || '');
  }, [coupon]);

  useEffect(() => {
    dispatch(paymentsData())
      .unwrap()
      .then((res: any) => {

        if (res?.status == 403) {
          notificationHelper(
            '',
            translateData.loginAgain,
            'error',
          );
          clearValue('token').then(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'SignIn' }],
            });
          });
        }
      })
      .catch((error: any) => {
        console.error('Error in paymentsData:', error);
      });
  }, []);

  const handlePressTips = (value: any) => {
    setSelectedValue(prevValue => (prevValue === value ? null : value));

    if (value !== translateData.custom) {
      setCustomTip('');
    }
  };

  const paymentData = async (index: number, name: any) => {
    setSelectedItem(index === selectedItem ? null : index);
    setSelectedPaymentMethod(index === selectedItem ? null : name);

    try {
      const rideDocRef = firestore().collection('rides').doc(rideData?.id.toString());
      await rideDocRef.update({ payment_method: name });
    } catch (error) {
      console.error('Error updating payment method:', error);
    }
  };

  const calculateTipAmount = () => {
    if (selectedValue === 'payment.custom') {
      return parseFloat(customTip) || 0;
    }
    return (
      parseFloat(selectedValue?.replace(zoneValue?.currency_symbol, '')) || 0
    );
  };

  const calculateCouponDiscount = totalBill => {
    if (!coupon || !coupon.type) return 0;
    if (coupon.type === 'fixed') {
      return parseFloat(coupon.amount);
    }
    if (coupon.type === 'percentage') {
      return (totalBill * parseFloat(coupon.amount)) / 100;
    }
    return 0;
  };

  const handlePress = () => {
    const payload = {
      coupon: inputValue,
      service_id: rideData?.service_id,
      vehicle_type_id: rideData?.vehicle_type_id,
      locations: rideData?.location_coordinates,
      hourly_package_id: rideData?.hourly_package_id,
      service_category_id: rideData?.service_category_id,
      weight: rideData?.weight
    };

    dispatch(couponVerifyData(payload)).then((res: any) => {
      if (res?.payload?.success) {
        setSuccessMessage(translateData.couponsApply);
        setCouponDiscount(res?.payload?.total_coupon_discount)
      } else {
        setCouponDiscount(0)
        notificationHelper('', res?.payload?.message, 'error')
        setSuccessMessage('');
      }
    })
  };

  const gotoCoupon = () => {
    navigate('PromoCodeScreen', { from: 'payment', getCoupon });
  };

  const getCoupon = val => {
    setCoupon(val);
  };

  const gotoPay = async () => {
    setPaymentLoading(true)
    const formattedCoupon = inputValue.replace('#', '');
    const tipamount = selectedValue ? selectedValue.slice(1) : '0';


    let payload: PaymentInterface = {
      ride_id: rideData?.id,
      driver_tip: tipamount,
      commnet: 'Excellet Ride',
      coupon: formattedCoupon,
      payment_method: selectedPaymentMethod,
    };

    dispatch(allpayment(payload))
      .unwrap()
      .then(async (res: any) => {

        setPaymentLoading(false)
        if (res?.is_redirect && res?.url) {
          navigate('PaymentWebView', {
            url: res?.url,
            selectedPaymentMethod: selectedPaymentMethod,
            dataValue: res
          });
        } else if (res?.payment_status == 'COMPLETED') {
          dispatch(allRides())
          navigate('MyTabs')
          dispatch(walletData());
          notificationHelper('', `${translateData.paymentComplete}`, 'success');
          try {
            const rideDocRef = firestore().collection('rides').doc(rideData?.id.toString());
            const docSnapshot = await rideDocRef.get();
            if (docSnapshot.exists) {
              await rideDocRef.update({ payment_status: 'COMPLETED' });
              navigation.navigate('MyTabs');
              dispatch(walletData());
              NotificationHelper.showNotification({
                title: 'Payment Completed',
                message: 'Your payment has been processed successfully. Thank you for riding with us! 🎉',
              })
            } else {
              console.warn('Ride document does not exist');
            }
          } catch (error) {
            console.error('Error updating payment method:', error);
          }

        } else {
          notificationHelper(
            "",
            res?.message,
            'error',
          );
        }
      });
  };

  const renderItem = ({ item, index, length }) => (
    <TouchableOpacity
      onPress={() => paymentData(index, item?.slug)}
      activeOpacity={0.7}>
      <View
        style={[
          styles.modalPaymentView,
          { backgroundColor: bgContainer, flexDirection: viewRTLStyle },
        ]}>
        <CustomBackHandler />
        <View style={[external.main, { flexDirection: viewRTLStyle }]}>
          <View style={styles.imageBg}>
            <Image source={{ uri: item.image }} style={styles.paymentImage} />
          </View>
          <View style={styles.mailInfo}>
            <Text
              style={[
                styles.mail,
                { color: textColorStyle, textAlign: textRTLStyle },
              ]}>
              {item.name}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.payBtn} activeOpacity={0.7}>
          <RadioButton
            checked={index === selectedItem}
            color={appColors.primary}
          />
        </TouchableOpacity>
      </View>
      {index !== length - 1 && <View style={styles.borderPayment} />}

    </TouchableOpacity>
  );


  const cashSelect = async () => {
    try {
      setSelectedPaymentMethod('cash');
      setSelectedMethod('cash');

      const rideId = rideData?.id;
      const rideDocRef = firestore().collection('rides').doc(rideId.toString());
      const docSnapshot = await rideDocRef.get();

      if (docSnapshot.exists) {
        const currentPaymentMethod = docSnapshot.data()?.payment_method;

        if (currentPaymentMethod !== 'cash') {
          await rideDocRef.update({ payment_method: 'cash' });
        } else {
        }
      } else {
        console.warn('Ride document does not exist');
      }
    } catch (error) {
      console.error('Error updating payment method:', error);
    }
  }

  const walletSelect = () => {
    setSelectedPaymentMethod('wallet');
    setSelectedMethod('wallet')
  }

  const onlineSelect = () => {
    setSelectedMethod('online')
  }

  return (
    <View style={[external.main, { backgroundColor: linearColorStyle }]}>
      <View style={styles.headerView}>
        <Header value={translateData.payment} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent} >

        <View style={styles.sideSpace}>
          {taxidoSettingData?.taxido_values?.activation?.driver_tips == 1 ? (
            <View>
              <Text
                style={[
                  styles.tips,
                  { color: textColorStyle, textAlign: textRTLStyle },
                ]}>
                {translateData.tip}
              </Text>

              <View style={[styles.buttonContainer, { flexDirection: viewRTLStyle }]}>
                {tipValues?.map((value, index) => (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    key={index}
                    style={[
                      styles.button,
                      {
                        borderColor:
                          selectedValue === value
                            ? appColors.primary
                            : isDark
                              ? appColors.darkBorder
                              : appColors.border,
                        backgroundColor: bgContainer,
                      },
                    ]}
                    onPress={() => handlePressTips(value)}>
                    <Text
                      style={[
                        styles.buttonText,
                        {
                          color:
                            selectedValue === value
                              ? appColors.primary
                              : '#797D83',
                        },
                      ]}>
                      {value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={external.mb_10} />
          )}


          {selectedValue === 'Custom' ? (
            <TextInput
              style={[
                styles.inputTip,
                {
                  backgroundColor: bgContainer,
                  color: textColorStyle,
                  borderColor: isDark ? appColors.darkBorder : appColors.border,
                },
              ]}
              placeholder={translateData.tipAmount}
              placeholderTextColor={appColors.regularText}
              keyboardType="number-pad"
              value={customTip}
              onChangeText={text => setCustomTip(text)}
            />
          ) : null}

          {taxidoSettingData?.taxido_values?.activation?.coupon_enable == 1 &&
            (
              <>
                <View
                  style={[
                    styles.containerCoupon,
                    { flexDirection: viewRTLStyle },
                    {
                      backgroundColor: bgContainer,
                      borderColor: isDark ? appColors.darkBorder : appColors.border,
                    },
                  ]}>
                  <TextInput
                    style={[styles.input, { color: textColorStyle }]}
                    value={inputValue}
                    onChangeText={setInputValue}
                    placeholder={translateData.applyPromoCode}
                    placeholderTextColor={appColors.regularText}
                  />
                  <TouchableOpacity
                    style={styles.buttonAdd}
                    onPress={handlePress}
                    activeOpacity={0.7}>
                    <Text style={styles.buttonAddText}>{translateData.apply}</Text>
                  </TouchableOpacity>
                </View>

                <View>
                  {successMessage && (
                    <Text style={styles.successMessage}>{successMessage}</Text>
                  )}
                  <TouchableOpacity onPress={gotoCoupon} activeOpacity={0.7}>
                    <Text style={styles.viewCoupon}>{translateData.allCoupon}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          <Text style={[styles.bill, { color: textColorStyle }]}>
            {translateData.billSummary}
          </Text>
          <View
            style={[
              styles.billContainer,
              {
                backgroundColor: bgContainer,
                borderColor: isDark ? appColors.darkBorder : appColors.border,
              },
            ]}>
            {rideData?.ride_fare > 0 && (
              <PaymentDetails
                title={translateData.rideFare}
                rideAmount={rideData?.ride_fare}
              />
            )}
            {rideData?.tax > 0 && (
              <PaymentDetails
                title={translateData.tax}
                rideAmount={rideData?.tax}
              />
            )}
            {calculateTipAmount() > 0 && (
              <View style={[styles.rideContainer, { flexDirection: viewRTLStyle }]}>
                <Text style={[styles.billTitle, { color: textColorStyle }]}>
                  {translateData.driverTips}
                </Text>
                <Text style={{ color: textColorStyle }}>{selectedValue}</Text>
              </View>
            )}
            {rideData?.platform_fees > 0 && (
              <PaymentDetails
                title={translateData.platformFees}
                rideAmount={rideData?.platform_fees}
              />
            )}
            {rideData?.vehicle_rent > 0 && (
              <PaymentDetails
                title={translateData.vehicleFare}
                rideAmount={rideData?.vehicle_rent}
              />
            )}
            {rideData?.driver_rent > 0 && (
              <PaymentDetails
                title={translateData.driverFare}
                rideAmount={rideData?.driver_rent}
              />
            )}
            {rideData?.additional_distance_charge > 0 && (
              <PaymentDetails
                title={translateData.additionalFare}
                rideAmount={rideData?.additional_distance_charge}
              />
            )}
            {rideData?.additional_minute_charge > 0 && (
              <PaymentDetails
                title={translateData.minuteFare}
                rideAmount={rideData?.additional_minute_charge}
              />
            )}
            {rideData?.commission > 0 && (
              <PaymentDetails
                title={translateData.commission}
                rideAmount={rideData?.commission}
              />
            )}
            {coupon && couponDiscount > 0 && (
              <View
                style={[styles.rideContainer, { flexDirection: viewRTLStyle }]}
              >
                <Text style={[styles.billTitle, { color: textColorStyle }]}>{translateData.couponSavings}</Text>
                <Text style={{ color: appColors.price }}>-{zoneValue?.currency_symbol}{couponDiscount}</Text>
              </View>
            )}
            <View
              style={[
                styles.billBorder,
                { borderColor: isDark ? appColors.darkBorder : appColors.border },
              ]}
            />
            <View style={[styles.totalBillView, { flexDirection: viewRTLStyle }]}>
              <Text style={[styles.billTitle, { color: textColorStyle }]}>
                {translateData.totalBill}
              </Text>
              <Text style={styles.totalAmount}>
                {rideData?.currency_symbol}
                {rideData?.total - couponDiscount}
              </Text>
            </View>
          </View>
          <Text
            style={[
              styles.payment,
              { color: textColorStyle, textAlign: textRTLStyle },
            ]}>
            {translateData.paymentMethod}
          </Text>
          {taxidoSettingData?.taxido_values?.activation?.rider_wallet == 1 && (
            <TouchableOpacity onPress={walletSelect}
              activeOpacity={0.9}
              style={{
                borderWidth: 1,
                borderColor: appColors.border,
                borderRadius: windowHeight(5),
                backgroundColor: appColors.whiteColor,
                height: windowHeight(40),
                marginBottom: windowHeight(10),
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
              <View style={{ flexDirection: 'row', marginHorizontal: windowWidth(10) }}>
                <Wallet colors={appColors.primaryText} />
                <Text style={{ marginHorizontal: windowWidth(15), fontFamily: appFonts.regular }}>Wallet Balance</Text>
                <Text style={{ fontFamily: appFonts.medium, color: appColors.price, fontSize: fontSizes?.FONT20 }}>{zoneValue?.currency_symbol}{walletTypedata?.balance * zoneValue?.exchange_rate}</Text>
              </View>
              <CustomRadioButton
                selected={selectedMethod === 'wallet'}
                onPress={walletSelect}
              />
            </TouchableOpacity>
          )}
          <View
            style={{
              flexDirection: viewRTLStyle,
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: windowHeight(10)
            }}
          >

            {taxidoSettingData?.taxido_values?.activation?.cash_payments == 1 && (
              <TouchableOpacity
                onPress={cashSelect}
                activeOpacity={0.9}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: windowWidth(200),
                  height: windowHeight(40),
                  borderWidth: 1.5,
                  borderColor: isDark ? appColors.darkBorder : appColors.border,
                  borderRadius: windowHeight(5),
                  paddingHorizontal: 10,
                  justifyContent: 'space-between',
                  backgroundColor: isDark ? appColors.darkPrimary : appColors.whiteColor
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Cash colors={isDark ? appColors.whiteColor : appColors.primaryText} />
                  <Text style={{ fontFamily: appFonts.medium, marginLeft: 6, color: isDark ? appColors.whiteColor : appColors.blackColor }}>Cash</Text>
                </View>
                <View style={{ marginHorizontal: windowWidth(-20) }}>
                  <CustomRadioButton
                    selected={selectedMethod === 'cash'}
                    onPress={cashSelect}
                  />
                </View>
              </TouchableOpacity>
            )}
            {taxidoSettingData?.taxido_values?.activation?.online_payments == 1 && (
              <TouchableOpacity
                onPress={onlineSelect}
                activeOpacity={0.9}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: windowWidth(200),
                  height: windowHeight(40),
                  borderWidth: 1.5,
                  borderColor: isDark ? appColors.darkBorder : appColors.border,
                  borderRadius: windowHeight(5),
                  paddingHorizontal: 10,
                  justifyContent: 'space-between',
                  backgroundColor: isDark ? appColors.darkPrimary : appColors.whiteColor
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <OnlinePayment colors={isDark ? appColors.whiteColor : appColors.primaryText} />
                  <Text style={{ fontFamily: appFonts.medium, marginLeft: 6, color: isDark ? appColors.whiteColor : appColors.blackColor }}>Online</Text>
                </View>
                <View style={{ marginHorizontal: windowWidth(-20) }}>
                  <CustomRadioButton
                    selected={selectedMethod === 'online'}
                    onPress={onlineSelect}
                  />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {selectedMethod === 'online' && (
            <View
              style={[
                styles.paymentContainer,
                { borderColor: isDark ? appColors.darkBorder : appColors.border },
              ]}>
              <FlatList
                data={zoneValue?.payment_method?.filter(item => item.name.toLowerCase() !== 'cash')}
                renderItem={({ item, index }) =>
                  renderItem({
                    item,
                    index,
                    length: zoneValue?.payment_method?.filter(i => i.name.toLowerCase() !== 'cash').length,
                  })
                }
                keyExtractor={item => item.id}
              />

            </View>
          )}
        </View>

      </ScrollView>
      <View style={[styles.buttonContainer2, { backgroundColor: isDark ? appColors.darkHeader : appColors.whiteColor }]}>
        <Button
          backgroundColor={appColors.primary}
          textColor={appColors.whiteColor}
          title={translateData.proceedtoPay}
          onPress={gotoPay}
          loading={paymentLoading}
        />
      </View>
    </View>
  );
}
