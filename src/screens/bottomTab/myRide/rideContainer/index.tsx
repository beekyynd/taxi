import { FlatList, Image, Linking, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import Images from '@utils/images';
import { styles } from './style';
import { commonStyles } from '../../../../styles/commonStyle';
import { LocationDetails } from '@src/commonComponent';
import { useValues } from '../../../../../App';
import { CalenderSmall, ClockSmall, Info, Message, PickLocation, RatingEmptyStart, RatingHalfStar, RatingStar, SafetyCall } from '@utils/icons';
import { useSelector } from 'react-redux';
import { useTheme } from '@react-navigation/native';
import { appColors, appFonts, fontSizes, windowHeight, windowWidth } from '@src/themes';
import { useAppNavigation } from '@src/utils/navigation';
import { RideLoader } from './rideLoader';
import { external } from '@src/styles/externalStyle';
import { apiformatDates } from '@src/utils/functions';

export default function RideContainer({ status }) {

  const { navigate } = useAppNavigation();
  const { bgFullStyle, textColorStyle, viewRTLStyle, textRTLStyle, isDark, iconColorStyle } = useValues();
  const { colors } = useTheme();
  const { rideDatas } = useSelector(state => state.allRide);
  const { allVehicle } = useSelector(state => state.vehicleType);
  const { translateData } = useSelector(state => state.setting);
  const { zoneValue } = useSelector((state: any) => state.zone);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [page, setPage] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const acceptedRides = rideDatas?.data?.filter(ride => {
    const rideStatus = ride?.ride_status?.slug?.toLowerCase();
    const categorySlug = ride?.service_category?.name?.toLowerCase();
    const currentStatus = status?.toLowerCase()?.trim();


    if (!rideStatus) return false;

    if (currentStatus === 'schedule') {
      return categorySlug === 'schedule';
    }
    if (currentStatus === 'accepted') {
      return (
        categorySlug !== 'schedule' &&
        rideStatus !== 'completed' &&
        rideStatus !== 'cancelled'
      );
    }
    return rideStatus === currentStatus;
  });

  const statusMapping = {
    accepted: {
      text: 'Pending',
      color: appColors.completeColor,
      backgroundColor: appColors.lightYellow,
    },
    started: {
      text: 'Active',
      color: appColors.activeColor,
      backgroundColor: appColors.grayLight,
    },
    schedule: {
      text: 'Scheduled',
      color: appColors.scheduleColor,
      backgroundColor: appColors.lightPink,
    },
    cancelled: {
      text: 'Cancel',
      color: appColors.alertRed,
      backgroundColor: appColors.iconRed,
    },
    completed: {
      text: 'Completed',
      color: appColors.primary,
      backgroundColor: appColors.selectPrimary,
    },
    arrived: {
      text: 'Pending',
      color: appColors.completeColor,
      backgroundColor: appColors.lightYellow,
    },
  };

  useEffect(() => {
    if (rideDatas?.data) {
      setInitialLoading(false);
    }
  }, [rideDatas]);

  const gotoMessage = item => {
    navigate('ChatScreen', {
      driverId: item?.driver?.id,
      riderId: item?.rider?.id,
      rideId: item?.id,
      driverName: item?.driver?.name,
      driverImage: item?.driver?.profile_image?.original_url,
    });
  };

  const gotoCall = item => {
    const phoneNumber = `${item?.driver?.phone}`;
    Linking.openURL(`tel:${phoneNumber}`);
  };
  const paginatedData = acceptedRides?.slice(0, page * 5) || [];

  const loadMoreData = () => {
    if (!paginationLoading && hasMoreData) {
      setPaginationLoading(true);
      setTimeout(() => {
        if (paginatedData.length < acceptedRides.length) {
          setPage(prev => prev + 1);
        } else {
          setHasMoreData(false);
        }
        setPaginationLoading(false);
      }, 1000);
    }
  };

  const handlePress = (selectedItem, vehicleData) => {
    let rideStatus =
      status === 'Schedule'
        ? statusMapping[selectedItem?.service_category?.service_category_type]
          ?.text
        : statusMapping[selectedItem.ride_status.slug]?.text;
    navigate('PendingRideScreen', {
      item: selectedItem,
      vehicleDetail: vehicleData,
      rideStatus: rideStatus,
    });
  };

  const renderItem = ({ item }) => {
    const { vehicle_type_id } = item.vehicle_type_id || {};
    const vehicleData = Array.isArray(allVehicle)
      ? allVehicle.find(vehicle => vehicle?.id == vehicle_type_id)
      : undefined;
    const formattedDate = apiformatDates(item.created_at);
    const hasProfileImage = !!item?.driver?.driver_profile_image_url;

    return (
      <View>
        <TouchableOpacity
          style={[styles.container, { backgroundColor: bgFullStyle }]}
          onPress={() => handlePress(item, vehicleData)}
          activeOpacity={0.7}>
          <View
            style={[styles.rideInfoContainer, { backgroundColor: bgFullStyle }]}>
            <View
              style={[
                styles.profileInfoContainer,
                { flexDirection: viewRTLStyle },
              ]}>
              {hasProfileImage ? (
                <Image
                  style={styles.profileImage}
                  source={{ uri: item.driver.driver_profile_image_url }}
                />
              ) : (
                <View
                  style={{
                    width: windowHeight(35),
                    height: windowHeight(35),
                    borderRadius: windowHeight(21),
                    backgroundColor: appColors.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{
                      fontSize: fontSizes.FONT19,
                      fontFamily: appFonts.bold,
                      color: appColors.whiteColor,
                    }}>
                    {item?.driver?.name?.charAt(0)?.toUpperCase() || 'D'}
                  </Text>
                </View>
              )}
              <View style={styles.profileTextContainer}>
                <Text
                  style={[
                    styles.profileName,
                    { color: textColorStyle },
                    { textAlign: textRTLStyle },
                  ]}>
                  {item?.driver?.name}
                </Text>
                <View
                  style={[
                    styles.carInfoContainer,
                    { flexDirection: viewRTLStyle },
                  ]}>
                  <Text style={[styles.carInfoText, { textAlign: textRTLStyle }]}>
                    {item?.vehicle_model}
                  </Text>
                </View>
              </View>
              <View style={styles.starContainer}>
                <View
                  style={{
                    flexDirection: viewRTLStyle,
                    justifyContent: 'center',
                    alignSelf: 'center',
                    marginHorizontal: windowHeight(0),
                  }}>
                  <View
                    style={{
                      flexDirection: viewRTLStyle,
                      paddingHorizontal: windowHeight(3),
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                    {Array.from({ length: 5 }).map((_, index) => {
                      const fullStarThreshold = index + 1;
                      const halfStarThreshold = index + 0.5;
                      if (item?.driver?.rating_count >= fullStarThreshold) {
                        return <RatingStar key={index} />;
                      } else if (
                        item?.driver?.rating_count >= halfStarThreshold
                      ) {
                        return <RatingHalfStar key={index} />;
                      } else {
                        return <RatingEmptyStart key={index} />;
                      }
                    })}
                  </View>

                  <View
                    style={{
                      flexDirection: viewRTLStyle,
                      marginTop: windowHeight(0),
                      paddingHorizontal: windowWidth(0),
                    }}>
                    <Text
                      style={[
                        commonStyles.mediumTextBlack12,
                        {
                          marginHorizontal: windowWidth(4),
                          color: isDark
                            ? appColors.whiteColor
                            : appColors.primaryText,
                        },
                      ]}>
                      {Number(item?.driver?.rating_count).toFixed(1)}
                    </Text>
                    <Text style={[styles.carInfoText]}>
                      ({item?.driver?.review_count})
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View
              style={[styles.serviceMainView, { flexDirection: viewRTLStyle }]}>
              <View style={[styles.serviceView, { flexDirection: viewRTLStyle }]}>
                <View style={styles.service_name_view}>
                  <Text style={styles.service_name}>{item?.service?.name}</Text>
                </View>
                {item?.service?.service_type !== 'ambulance' && (
                  <View style={styles.service_category_view}>
                    <Text style={styles.service_category}>
                      {item?.service_category?.name}
                    </Text>
                  </View>
                )}
              </View>
              {item?.ride_status?.slug === 'accepted' &&
                item?.ride_status?.slug === 'pending' &&
                item?.ride_status?.slug === 'schedule' && (
                  <View
                    style={[
                      styles.MessageMainView,
                      {
                        flexDirection: viewRTLStyle,
                      },
                    ]}>
                    <TouchableOpacity
                      style={[
                        styles.MessageView,
                        {
                          borderColor: isDark
                            ? appColors.darkBorder
                            : colors.border,
                        },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => gotoMessage(item)}>
                      <Message />
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.safetyCallView,
                        {
                          borderColor: isDark
                            ? appColors.darkBorder
                            : colors.border,
                        },
                      ]}
                      onPress={() => gotoCall(item)}>
                      <SafetyCall color={appColors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
              {item?.ride_status?.slug !== 'completed' &&
                item?.ride_status?.slug !== 'cancelled' && (
                  <View
                    style={[
                      styles.MessageMainView,
                      {
                        flexDirection: viewRTLStyle,
                      },
                    ]}>
                    <TouchableOpacity
                      style={[
                        styles.MessageView,
                        {
                          borderColor: isDark
                            ? appColors.darkBorder
                            : colors.border,
                        },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => gotoMessage(item)}>
                      <Message />
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.safetyCallView,
                        {
                          borderColor: isDark
                            ? appColors.darkBorder
                            : colors.border,
                        },
                      ]}
                      onPress={() => gotoCall(item)}>
                      <SafetyCall color={appColors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
            </View>
            <View
              style={[
                styles.dashedLine,
                { borderColor: isDark ? appColors.darkBorder : colors.border },
              ]}
            />
            <View style={{ flexDirection: viewRTLStyle }}>
              <Image
                style={styles.tripImage}
                source={{ uri: item?.vehicle_type?.vehicle_image_url }}
              />
              <View style={styles.tripTextContainer}>
                <Text
                  style={[
                    styles.tripIDText,
                    { color: textColorStyle, textAlign: textRTLStyle },
                  ]}>
                  #{item?.ride_number}
                </Text>
                <Text style={[styles.tripCostText, { textAlign: textRTLStyle }]}>
                  {zoneValue.currency_symbol}
                  {item.total}
                </Text>
              </View>
              <View style={styles.iconMainView}>
                <View style={[styles.iconView, { flexDirection: viewRTLStyle }]}>
                  <CalenderSmall />
                  <Text style={styles.tripDateText}>{formattedDate.date}</Text>
                </View>
                <View style={[styles.iconView, { flexDirection: viewRTLStyle }]}>
                  <ClockSmall />
                  <Text style={styles.tripDateText}>{formattedDate.time}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={external.mh_10}>
            <View
              style={[
                styles.dashedLine,
                { borderColor: isDark ? appColors.darkBorder : colors.border, marginTop: windowHeight(-4) },
              ]}
            />
          </View>
          <View>
            {item?.service?.service_type !== 'ambulance' && (
              <LocationDetails locationDetails={item?.locations} />
            )}
            {item?.service?.service_type === 'ambulance' && (
              <View
                style={[
                  styles.addressContainer1,
                  { flexDirection: viewRTLStyle },
                  { backgroundColor: bgFullStyle },
                ]}>
                <View style={[external.fd_column, external.mh_15, external.mt_8]}>
                  <PickLocation height={12} width={12} colors={iconColorStyle} />
                </View>
                <View style={[external.pv_10]}>
                  <Text
                    style={[
                      styles.itemStyle1,
                      { color: textColorStyle },
                      { textAlign: textRTLStyle },
                    ]}>
                    {item.locations}
                  </Text>
                </View>
              </View>
            )}
          </View>
          {/* <LineContainer /> */}

        </TouchableOpacity>
      </View >
    );
  };

  return (
    <View style={styles.main}>
      {initialLoading ? (
        <RideLoader />
      ) : acceptedRides?.length === 0 ? (
        <View style={styles.noDataView}>
          <Image
            source={isDark ? Images.noRideDark : Images.noRide}
            style={styles.noRideImage}
            resizeMode="contain"
          />
          <View style={[styles.noRIdeView, { flexDirection: viewRTLStyle }]}>
            <Text
              style={[
                styles.noRIde,
                {
                  color: isDark ? appColors.whiteColor : appColors.primaryText,
                  fontFamily: appFonts.bold,
                },
              ]}>
              {translateData.noRIde}
            </Text>
            <View style={styles.Info}>
              <Info />
            </View>
          </View>
          <Text
            style={[
              styles.noRideDes,
              {
                color: isDark ? appColors.whiteColor : appColors.regularText,
                fontFamily: appFonts.regular,
              },
            ]}>
            {translateData.noRideDes}
          </Text>
        </View>
      ) : (
        <View style={styles.flatlistView}>
          <FlatList
            data={paginatedData}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            onEndReached={loadMoreData}
            onEndReachedThreshold={0.9}
            contentContainerStyle={styles.containerStyle}
            ListFooterComponent={() => {
              if (
                paginationLoading &&
                hasMoreData &&
                acceptedRides.length > paginatedData.length
              ) {
                return (
                  <ActivityIndicator
                    size="large"
                    color={appColors.buttonBg}
                    style={{ marginTop: 10 }}
                  />
                );
              }
              return null;
            }}
          />
        </View>
      )}
    </View>
  );
}
