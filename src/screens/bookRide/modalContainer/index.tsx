import { Image, Text, View } from 'react-native';
import React from 'react';
import { styles } from '../styles';
import { external } from '../../../styles/externalStyle';
import { commonStyles } from '../../../styles/commonStyle';
import { appColors, appFonts, fontSizes, windowHeight, windowWidth } from '@src/themes';
import { SolidLine, Button } from '@src/commonComponent';
import { modalItemType } from './types';
import { useValues } from '../../../../App';
import { UserFillSmall } from '@utils/icons';
import { useTheme } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import Images from '@src/utils/images';

export function ModalContainers({ onPress, selectedItemData, couponsData }: modalItemType) {
  const { viewRTLStyle, textRTLStyle, textColorStyle, bgContainer, isDark } = useValues();
  const { colors } = useTheme();
  const { zoneValue } = useSelector((state: any) => state.zone);
  const { translateData, taxidoSettingData } = useSelector((state) => state.setting);

  const originalFare = Number(selectedItemData?.charges?.total ?? 0);
  const isCouponApplicable =
    couponsData?.success &&
    (couponsData?.is_apply_all === 1 ||
      couponsData?.applicable_vehicles?.includes(selectedItemData?.id));

  let discountedFare = originalFare;
  let couponSaving = 0;
  let discountPercentage = '';

  if (isCouponApplicable) {
    const discountValue = couponsData?.amount ?? 0;
    const flatValue = couponsData?.total_coupon_discount ?? 0;

    if (couponsData?.coupon_type === 'percentage') {
      discountPercentage = `${discountValue}%`;
      couponSaving = (originalFare * discountValue) / 100;
    } else {
      couponSaving = flatValue;
    }

    discountedFare = originalFare - couponSaving;
    discountedFare = Number(discountedFare?.toFixed(2));
    couponSaving = Number(couponSaving?.toFixed(2));
  }

  return (
    <View style={{ marginHorizontal: windowWidth(18) }}>
      <View style={{ backgroundColor: bgContainer }} >
        <View style={[styles.modalTitle, { flexDirection: viewRTLStyle }]}>
          <View style={{ flexDirection: viewRTLStyle, justifyContent: 'center', height: windowHeight(18), alignItems: 'center' }}>
            <Text style={[{ color: isDark ? appColors.whiteColor : appColors.primaryText }, styles.boldText]}>{selectedItemData?.name}</Text>
            <View style={[styles.verticalLine, { borderRightColor: colors.border }]} />
            <UserFillSmall />
            <Text style={{ color: appColors.primaryText, fontFamily: appFonts.medium }}>{selectedItemData?.seat}</Text>
          </View>
          <View style={{ flexDirection: viewRTLStyle }}>
            <Text style={styles.price}>
              {selectedItemData?.currency_symbol}{originalFare}
            </Text>
          </View>
        </View>

        <View style={styles.solidLine}>
          <SolidLine />
        </View>

        <Image style={styles.carTwo} source={{ uri: selectedItemData?.vehicle_image_url }} />
        {taxidoSettingData?.taxido_values?.activation?.bidding === 1 && (
          <Text style={[commonStyles.regularText, { textAlign: textRTLStyle }]}>
            {translateData.minimumFare} {selectedItemData?.currency_symbol}{originalFare} {translateData.ownPrice}
          </Text>
        )}

        <View style={styles.solidLine}>
          <SolidLine />
        </View>

        <Text style={[styles.termsText, { color: textColorStyle, textAlign: textRTLStyle }]}>{translateData.billSummary}</Text>
        {[
          [translateData.baseFare, selectedItemData?.charges?.base_fare_charge],
          [translateData.additionalFare, selectedItemData?.charges?.additional_distance_charge],
          [translateData.timeFare, selectedItemData?.charges?.additional_minute_charge],
          [translateData.platformFees, selectedItemData?.charges?.platform_fee],
          [translateData.tax, selectedItemData?.charges?.tax],
          [translateData.commission, selectedItemData?.charges?.commission],
          [translateData.parcelFare, selectedItemData?.charges?.additional_weight_charge]
        ]
          .filter(([_, value]) => !!value)
          .map(([label, value], i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: windowHeight(1.5)
              }}
            >
              <Text style={{ fontFamily: appFonts.regular, color: appColors.primaryText }}>{label}</Text>
              <Text style={{ fontFamily: appFonts.regular, color: appColors.primaryText }}>
                {selectedItemData?.currency_symbol}
                {value}
              </Text>
            </View>
          ))}

        <View style={{ borderBottomWidth: 1, borderColor: appColors.border, borderStyle: 'dashed', marginVertical: windowHeight(2) }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: windowHeight(1.5), alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: appFonts.medium, color: appColors.primaryText }}>{translateData.total}</Text>
          {isCouponApplicable ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 13, color: appColors.grayText, textDecorationLine: 'line-through', fontFamily: appFonts.regular }}>
                {selectedItemData?.currency_symbol}{originalFare}
              </Text>
              <Text style={{ fontSize: 16, color: appColors.price, fontFamily: appFonts.bold }}>
                {selectedItemData?.currency_symbol}{discountedFare}
              </Text>
            </View>
          ) : (
            <Text style={{ fontFamily: appFonts.medium, color: appColors.price }}>
              {selectedItemData?.currency_symbol}{originalFare}
            </Text>
          )}
        </View>

        {isCouponApplicable && (
          <View
            style={{
              marginTop: windowHeight(1),
              alignItems: 'center',
              justifyContent: 'flex-end',
              flexDirection: 'row',
              height: windowHeight(20),
            }}
          >
            <FastImage
              source={Images.offer}
              style={{
                height: windowHeight(20),
                width: windowHeight(20),
                marginRight: 8,
              }}
            />

            <Text
              style={{
                fontSize: fontSizes.FONT16,
                color: appColors.success,
                fontFamily: appFonts.regular,
              }}
            >
              {translateData.youSaved}{' '}
              <Text style={{ fontFamily: appFonts.medium, color: appColors.primary }}>
                {selectedItemData?.currency_symbol}
                {couponSaving}
              </Text>{' '}
              {translateData.withCoupon} {discountPercentage ? `(${discountPercentage})` : ''}
            </Text>
          </View>
        )}

        <View style={styles.solidLine}>
          <SolidLine />
        </View>

        <Text style={[styles.termsText, { color: textColorStyle, textAlign: textRTLStyle }]}>
          {translateData.terms}
        </Text>
        <View>
          <Text style={[commonStyles.regularText, external.mb_15, { textAlign: textRTLStyle }]}>
            {'\u2022'} {translateData.bookRideCancelCharge}
            <Text style={{ color: appColors.alertRed }}> {zoneValue.currency_symbol}{selectedItemData?.vehicle_type_zone?.cancellation_charge_for_rider}</Text> {translateData.deducted}
          </Text>
          <Text style={[commonStyles.regularText, external.mb_15, { textAlign: textRTLStyle }]}>
            {'\u2022'} {translateData.after} {selectedItemData?.vehicle_type_zone?.free_waiting_time_before_start_ride} {translateData.minutesWait} {selectedItemData?.currency_symbol}{selectedItemData?.vehicle_type_zone?.per_minute_charge} {translateData.perMinute}
          </Text>
        </View>

        <View style={[external.mv_10]}>
          <Button title={translateData.done} onPress={onPress} />
        </View>
      </View>
    </View>
  );
}
