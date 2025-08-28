
import { Image, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import React, { useEffect } from 'react';
import { external } from '../../../styles/externalStyle';
import { styles } from '../styles';
import { commonStyles } from '../../../styles/commonStyle';
import { appColors, appFonts, fontSizes, windowHeight, windowWidth } from '@src/themes';
import { Info } from '@src/utils/icons';
import { bookRideItemType } from './types';
import { useValues } from '../../../../App';

export function BookRideItem({
  item,
  onPress,
  isSelected,
  onPressAlternate,
  isDisabled,
  couponsData,
  onPriceCalculated,
}: bookRideItemType) {
  const { bgContainer, bgFullLayout, isDark } = useValues();

  const originalFare = Number(item?.charges?.total ?? 0);
  if (originalFare <= 0) return null;

  const isCouponApplicable =
    couponsData?.success &&
    (couponsData?.is_apply_all === 1 || couponsData?.applicable_vehicles?.includes(item?.id));

  let discountedFare = originalFare;
  let couponSaving = 0;

  if (isCouponApplicable) {
    const discountValue = `${couponsData?.amount}` ?? 0;
    const flatValue = couponsData?.total_coupon_discount ?? 0;

    if (couponsData?.coupon_type === 'percentage') {
      couponSaving = originalFare * (Number(discountValue) / 100);
    } else {
      couponSaving = flatValue;
    }

    couponSaving = Number(couponSaving.toFixed(2));
    discountedFare = Math.max(0, Number((originalFare - couponSaving).toFixed(2)));
  }

  const finalPrice = discountedFare.toFixed(2);

  useEffect(() => {
    if (onPriceCalculated) {
      onPriceCalculated(item?.id, finalPrice);
    }
  }, [finalPrice]);

  const handlePress = (item) => {
    if (isSelected) {
      onPressAlternate?.(item);
    } else {
      onPress?.(item);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          borderColor: isSelected ? appColors.primary : bgContainer,
          backgroundColor: isDark ? appColors.bgDark : appColors.lightGray,
        },
      ]}
      onPress={() => handlePress(item)}
      disabled={isDisabled}
    >
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          height: windowWidth(55),
          backgroundColor: isSelected ? appColors.selectPrimary : bgFullLayout,
          margin: windowHeight(2),
          borderRadius: windowHeight(4),
        }}
      >
        <Image
          style={[
            styles.img,
            isDisabled && !isSelected && { opacity: 0.5 },
          ]}
          source={{ uri: item?.vehicle_image_url }}
        />
      </View>

      <View style={[external.fd_row, external.js_space, external.mh_8]}>
        <Text
          style={[
            commonStyles.regularText,
            styles.vehicleName,
            isDisabled && !isSelected && { color: 'gray' },
          ]}
        >
          {item?.name}
        </Text>
        <View>
          <Info />
        </View>
      </View>

      <View style={{ marginHorizontal: windowWidth(12), marginBottom: windowWidth(5) }}>
        {isCouponApplicable ? (
          <>
            <Text
              style={{
                fontFamily: appFonts.regular,
                fontSize: fontSizes.FONT12,
                textDecorationLine: 'line-through',
                color: appColors.grayText,
              }}
            >
              {item?.currency_symbol}{originalFare.toFixed(2)}
            </Text>
            <Text
              style={{
                fontFamily: appFonts.medium,
                fontSize: fontSizes.FONT14,
                color: appColors.price,
              }}
            >
              {item?.currency_symbol}{discountedFare.toFixed(2)}
            </Text>
          </>
        ) : (
          <Text
            style={{
              fontFamily: appFonts.regular,
              fontSize: fontSizes.FONT14,
              color: isDark ? appColors.darkText : appColors.price,
            }}
          >
            {item?.currency_symbol}{originalFare.toFixed(2)}
          </Text>
        )}
      </View>

      {isDisabled && !isSelected && (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: appColors.transparentBlack,
            borderRadius: styles.container.borderRadius,
          }}
          pointerEvents="none"
        />
      )}
    </TouchableOpacity>
  );
}
