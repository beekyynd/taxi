import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Ac, Back, Bag, Right, Star1 } from "@src/utils/icons";
import { CarType } from "@src/assets/icons/carType";
import { FuelType } from "@src/assets/icons/fuelType";
import { Milage } from "@src/assets/icons/milage";
import { GearType } from "@src/assets/icons/gearType";
import { Seat } from "@src/assets/icons/seat";
import { Speed } from "@src/assets/icons/speed";
import { styles } from "./styles";
import { external } from "@src/styles/externalStyle";
import { useNavigation, useRoute } from "@react-navigation/native";
import { RentalBookinginterface } from "@src/api/interface/rentalinterface";
import { rentalRideRequests, updateRideRequest } from "@src/api/store/actions";
import { useDispatch, useSelector } from "react-redux";
import { Button, notificationHelper } from "@src/commonComponent";
import { useValues } from "@App";
import { appColors, appFonts, windowHeight } from "@src/themes";
import { clearValue } from "@src/utils/localstorage";
import firestore from "@react-native-firebase/firestore";
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

export function RentalCarDetails() {
  const route = useRoute();
  const { startDates, pickUpCoords, pickupLocation, dropLocation, dropCoords, endDates, convertedStartTime, convertedEndTime, getDriver } = route.params;
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { rentalVehicleListsDetails } = useSelector((state: any) => state.rentalVehicle);
  const { zoneValue } = useSelector((state: any) => state.zone);
  const { translateData, settingData } = useSelector((state) => state.setting);
  const { viewRTLStyle, isDark } = useValues();
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [bookLoading, setBookloading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [rideCancelLoading, setRideCancelLoading] = useState(false);
  const [ride_req_id, setRideReqId] = useState(null);
  const totalSeconds = 60;
  const startDate = new Date(startDates);
  const endDate = new Date(endDates);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['40%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      setIsBottomSheetVisible(false);
    }
  }, []);

  const handlePresentModalPress = useCallback(() => {
    bottomSheetRef.current?.expand();
    setIsBottomSheetVisible(true);
  }, []);

  const handleCloseModalPress = useCallback(() => {
    bottomSheetRef.current?.close();
    setIsBottomSheetVisible(false);
  }, []);

  const diffTime = endDate.getTime() - startDate.getTime();

  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));


  useEffect(() => {
    if (!ride_req_id) return;

    const rideReqId = String(ride_req_id);

    const unsubscribe = firestore()
      .collection('ride_requests')
      .doc(rideReqId)
      .collection('rental_request')
      .doc(rideReqId)
      .onSnapshot(async (docSnapshot) => {
        if (docSnapshot.exists) {
          const data = docSnapshot.data();
          if (data?.status === 'canceled') {
            modelClose();
            notificationHelper("", translateData.driverRejectReq, 'error');
          } else if (data?.status === 'accepted') {
            handleCloseModalPress();
            await firestore()
              .collection('ride_requests')
              .doc(rideReqId)
              .collection('rental_request')
              .doc(rideReqId)
              .delete();

            const rideDoc = await firestore()
              .collection('rides')
              .doc(data.ride_id.toString())
              .get();

            if (rideDoc.exists) {
              const fullRideData = rideDoc.data();
              notificationHelper('', translateData.driverAcceptReq, 'success');
              navigation.navigate('PaymentMethod', { rideData: fullRideData });
            } else {
              console.warn('Ride data not found for ride_id:', data.ride_id);
            }
          }
        }
      });
    return () => unsubscribe();
  }, [ride_req_id, handleCloseModalPress, navigation]);

  const modelClose = async () => {
    setRideCancelLoading(true);
    handleCloseModalPress();
    setBookloading(false);
    dispatch(updateRideRequest({ payload: '', ride_id: ride_req_id }))
      .then((res: any) => {
        setRideCancelLoading(false);
        if (res?.payload?.id) {
          notificationHelper("", translateData.rideReqCancel, "error")
        }
      })
  };

  const carDetails = [
    { Icon: CarType, title: rentalVehicleListsDetails.vehicle_subtype },
    { Icon: FuelType, title: rentalVehicleListsDetails.fuel_type },
    { Icon: Milage, title: `${rentalVehicleListsDetails.mileage}` },
    { Icon: GearType, title: rentalVehicleListsDetails.gear_type },
    { Icon: Seat, title: `${rentalVehicleListsDetails?.seatingCapacity || 1} Seat` },
    { Icon: Speed, title: `${rentalVehicleListsDetails.vehicle_speed}` },
    { Icon: Ac, title: rentalVehicleListsDetails.is_ac == 1 ? 'AC' : 'Non AC' },
    { Icon: Bag, title: `${rentalVehicleListsDetails.bag_count}` },
  ];

  const [mainImage, setMainImage] = useState('');
  React.useEffect(() => {
    if (rentalVehicleListsDetails?.rental_vehicle_galleries?.length > 0) {
      setMainImage(rentalVehicleListsDetails.rental_vehicle_galleries[0]);
    } else if (rentalVehicleListsDetails?.normal_image_url) {
      setMainImage(rentalVehicleListsDetails.normal_image_url);
    }
  }, [rentalVehicleListsDetails]);

  const bookRental = async () => {
    setBookloading(true);
    const is_with_driver = getDriver ? "1" : "0";
    let dropLocations =
      dropLocation && dropLocation.trim() ? dropLocation : pickupLocation;

    let payload: RentalBookinginterface = {
      locations: [`${pickupLocation}`, `${dropLocations}`],
      location_coordinates: [
        {
          lat: `${pickUpCoords.lat}`,
          lng: `${pickUpCoords.lng}`,
        },
        {
          lat: `${dropCoords?.lat ?? pickUpCoords.lat}`,
          lng: `${dropCoords?.lng ?? pickUpCoords.lng}`,
        },
      ],
      service_id: '1',
      service_category_id: "5",
      vehicle_type_id: `${rentalVehicleListsDetails.vehicle_type_id}`,
      rental_vehicle_id: `${rentalVehicleListsDetails.id}`,
      is_with_driver: `${is_with_driver}`,
      payment_method: "cash",
      start_time: `${startDates} ${convertedStartTime}`,
      end_time: `${endDates} ${convertedEndTime}`,
      currency_code: zoneValue?.currency_code,
    };

    dispatch(rentalRideRequests(payload))
      .unwrap()
      .then(async (res) => {
        setBookloading(false);
        if (res.status == 403) {
          notificationHelper('', translateData.loginAgain, 'error');
          clearValue('token').then(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'SignIn' }],
            });
          });
          return;
        }
        if (res?.id) {
          setRideReqId(res?.id);
          handlePresentModalPress();
          notificationHelper("", translateData.rentalReqSend, "success");
          try {
          } catch (err) {
            console.error('❌ Firestore error:', err);
            notificationHelper("", translateData.failedSendReq, "error");
            handleCloseModalPress();
          }
        } else {
          notificationHelper("", res.message, "error");
        }
      })
      .catch((error) => {
        console.error("Error in booking rental:", error);
        notificationHelper("", translateData.unexpectedError, "error");
        setBookloading(false);
      });
  };

  useEffect(() => {
    if (!isBottomSheetVisible) return;
    setSecondsLeft(60);
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (isBottomSheetVisible) {
            modelClose();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isBottomSheetVisible]);

  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };





  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        style={[
          styles.backBtn,
          { backgroundColor: isDark ? appColors.darkPrimary : appColors.whiteColor },
          { borderColor: isDark ? appColors.darkBorder : appColors.border },
        ]}
        onPress={() => navigation.goBack()}
      >
        <Back />
      </TouchableOpacity>

      <ScrollView style={{ backgroundColor: isDark ? appColors.bgDark : appColors.whiteColor }} showsVerticalScrollIndicator={false}>
        <View>
          <Image source={{ uri: mainImage }} style={styles.mainImg} />
        </View>
        <View style={[styles.subImgContainer, { flexDirection: viewRTLStyle }, { backgroundColor: isDark ? appColors.bgDark : appColors.whiteColor }]}>
          {rentalVehicleListsDetails?.rental_vehicle_galleries
            ?.map((img, index) => (
              <TouchableOpacity
                activeOpacity={0.7}
                key={index}
                style={[
                  styles.subImgView,
                  mainImage === img && styles.selectedSubImg,
                ]}
                onPress={() => setMainImage(img)}
              >
                <Image source={{ uri: img }} style={styles.subImg} />
              </TouchableOpacity>
            ))}
        </View>
        <View style={[styles.container]}>
          <View style={[styles.subContainer, { backgroundColor: isDark ? appColors.darkPrimary : appColors.whiteColor }, { borderColor: isDark ? appColors.darkBorder : appColors.border }]}>
            <View style={[styles.titleView, { flexDirection: viewRTLStyle }]}>
              <Text style={[styles.title, { color: isDark ? appColors.whiteColor : appColors.primaryText }]}>{rentalVehicleListsDetails.name}</Text>
              <View style={[styles.rateContainer, { flexDirection: viewRTLStyle }]}>
                <Star1 />
                <Text style={styles.rating}>
                  {(rentalVehicleListsDetails?.driver?.rating_count ?? 0).toFixed(1)}
                </Text>
              </View>
            </View>

            <View style={[styles.detailContainer, { flexDirection: viewRTLStyle }]}>
              <Text style={styles.detail}>{rentalVehicleListsDetails.description}</Text>
              <View style={external.fd_row}>
                <Text style={styles.price}>
                  {zoneValue?.currency_symbol}{rentalVehicleListsDetails.vehicle_per_day_price}
                  <Text style={styles.day}>/{translateData.day}</Text>
                </Text>
              </View>
            </View>
            <View style={[styles.border, { borderBottomColor: isDark ? appColors.darkBorder : appColors.border }]} />
            <View style={[styles.driverContainer, { flexDirection: viewRTLStyle }]}>
              <Text style={[styles.title, { color: isDark ? appColors.whiteColor : appColors.primaryText }]}>{translateData.driverPriceText}</Text>
              <View style={external.fd_row}>
                <Text style={styles.price}>
                  {zoneValue?.currency_symbol}{rentalVehicleListsDetails.driver_per_day_charge}
                  <Text style={styles.day}>/{translateData.day}</Text>
                </Text>
              </View>
            </View>

            <View style={[styles.carDetails, { flexDirection: viewRTLStyle }]}>
              {carDetails?.map((detail, index) => (
                <View key={index} style={[styles.detailIcon, { flexDirection: viewRTLStyle }, { backgroundColor: isDark ? appColors.bgDark : appColors.lightGray }]}>
                  <detail.Icon color={isDark ? appColors.darkText : appColors.regularText} />
                  <Text style={[styles.detailTitle, { color: isDark ? appColors.darkText : appColors.primaryText }]}>{detail.title}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.title, external.mt_5, { color: isDark ? appColors.whiteColor : appColors.primaryText }]}>{translateData.moreInfoText}</Text>
            {rentalVehicleListsDetails?.interior?.map((detail: any, index: number) => (
              <Text key={index} style={styles.description}>
                <Right /> {` ${detail}`}
              </Text>
            ))}
            <Text style={[styles.title, external.mt_15, { color: isDark ? appColors.whiteColor : appColors.primaryText }]}>{translateData.billSummary}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: windowHeight(5) }}>
              <Text style={{ fontFamily: appFonts.regular, color: isDark ? appColors.darkText : appColors.primaryText }}>{translateData.vehicleFare}</Text>
              <Text style={{ fontFamily: appFonts.regular, color: isDark ? appColors.darkText : appColors.primaryText }}>{rentalVehicleListsDetails?.currency_symbol}{rentalVehicleListsDetails?.charge?.vehicle_rent} ({`${rentalVehicleListsDetails?.charge?.no_of_days} day`})</Text>
            </View>
            {getDriver && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: windowHeight(3) }}>
                <Text style={{ fontFamily: appFonts.regular, color: isDark ? appColors.darkText : appColors.primaryText }}>{translateData.driverFare}</Text>
                <Text style={{ fontFamily: appFonts.regular, color: isDark ? appColors.darkText : appColors.primaryText }}>{rentalVehicleListsDetails?.currency_symbol}{rentalVehicleListsDetails?.charge?.driver_rent} ({`${rentalVehicleListsDetails?.charge?.no_of_days} day`})</Text>
              </View>
            )}
            {rentalVehicleListsDetails?.charge?.platform_fee > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: windowHeight(3) }}>
                <Text style={{ fontFamily: appFonts.regular, color: isDark ? appColors.darkText : appColors.primaryText }}>{translateData.platformFees}</Text>
                <Text style={{ fontFamily: appFonts.regular, color: isDark ? appColors.darkText : appColors.primaryText }}>{rentalVehicleListsDetails?.currency_symbol}{rentalVehicleListsDetails?.charge?.platform_fee}</Text>
              </View>
            )}
            {rentalVehicleListsDetails?.charge?.tax && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: windowHeight(3) }}>
                <Text style={{ fontFamily: appFonts.regular, color: isDark ? appColors.darkText : appColors.primaryText }}>{translateData.tax}</Text>
                <Text style={{ fontFamily: appFonts.regular, color: isDark ? appColors.darkText : appColors.primaryText }}>{rentalVehicleListsDetails?.currency_symbol}{rentalVehicleListsDetails?.charge?.tax}</Text>
              </View>
            )}
            {rentalVehicleListsDetails?.charge?.commission && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: windowHeight(3) }}>
                <Text style={{ fontFamily: appFonts.regular, color: isDark ? appColors.darkText : appColors.primaryText }}>{translateData.commission}</Text>
                <Text style={{ fontFamily: appFonts.regular, color: isDark ? appColors.darkText : appColors.primaryText }}>{rentalVehicleListsDetails?.currency_symbol}{rentalVehicleListsDetails?.charge?.commission}</Text>
              </View>
            )}
            <View style={{ borderBottomWidth: 1, borderColor: isDark ? appColors.darkBorder : appColors.border, borderStyle: 'dashed', marginVertical: windowHeight(5) }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: appFonts.medium, color: isDark ? appColors.darkText : appColors.primaryText }}>{translateData.total}</Text>
              <Text style={{ color: appColors.primary, fontFamily: appFonts.medium }}>{rentalVehicleListsDetails?.currency_symbol}{rentalVehicleListsDetails?.charge?.total}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[external.mv_15]}
            activeOpacity={0.7}
            disabled={bookLoading}
          >
            <Button title={translateData.bookNow} onPress={bookRental} loading={bookLoading} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {isBottomSheetVisible && (
        <BottomSheet
          ref={bottomSheetRef}
          index={1}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          handleIndicatorStyle={{ backgroundColor: appColors.primary, width: '13%' }}
          enablePanDownToClose={true}
          backdropComponent={({ style }) => (
            <View style={[style, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} />
          )}
          backgroundStyle={{ backgroundColor: isDark ? appColors.bgDark : appColors.whiteColor }}
        >
          <BottomSheetView style={{ paddingHorizontal: windowHeight(14) }}>
            <View style={styles.imageWrapper}>
              <AnimatedCircularProgress
                size={100}
                width={10}
                fill={(1 - secondsLeft / totalSeconds) * 100}
                tintColor={appColors.primary}
                backgroundColor={appColors.loaderBackground}
                rotation={0}
                lineCap="round"
              >
                {
                  () => (
                    <Text style={styles.timerText}>
                      {formatTime(secondsLeft)}
                    </Text>
                  )
                }
              </AnimatedCircularProgress>
            </View>

            <Text
              style={[styles.requestSuccess, {
                color: isDark ? appColors.whiteColor : appColors.primaryText,
              }]}
            >
              {translateData.requestSuccessfullySent}
            </Text>
            <Text
              style={styles.modelSuccess}
            >
              {translateData.requestSentSuccess}
            </Text>
            <View
              style={styles.modelButtonView}
            >
              <Button title={translateData.cancel} onPress={modelClose} backgroundColor={appColors.alertRed} loading={rideCancelLoading} />
            </View>
          </BottomSheetView>
        </BottomSheet>
      )}
    </View>
  );
}