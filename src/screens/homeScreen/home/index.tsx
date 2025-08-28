import React, { useEffect, useState, useCallback, useContext, useRef, useMemo } from "react";
import { SafeAreaView, ScrollView, View, BackHandler, Text, StatusBar, StyleSheet, Image } from "react-native";
import { useIsFocused, useFocusEffect } from "@react-navigation/native";
import { commonStyles } from "../../../styles/commonStyle";
import { TodayOfferContainer } from "../../../components/homeScreen/todaysOffer";
import { TopCategory } from "../../../components/homeScreen/topCategory";
import { HomeSlider } from "../../../components/homeScreen/slider";
import { HeaderContainer } from "../../../components/homeScreen/headerContainer";
import styles from "./styles";
import { useValues } from "../../../../App";
import { Button } from "@src/commonComponent";
import { external } from "../../../styles/externalStyle";
import { appColors, appFonts, fontSizes, windowHeight } from "@src/themes";
import { LocationContext } from "../../../utils/locationContext";
import { useDispatch, useSelector } from "react-redux";
import { vehicleData, vehicleTypeDataGet } from "../../../api/store/actions/vehicleTypeAction";
import SwipeButton from "@src/commonComponent/sliderButton";
import { useAppNavigation } from "@src/utils/navigation";
import { Recentbooking } from "@src/screens/recentBooking";
import { BottomTitle } from "@src/components";
import { allRides, notificationDataGet, paymentsData, serviceDataGet, taxidosettingDataGet, walletData } from "@src/api/store/actions";
import { HomeLoader } from "../HomeLoader";
import useStoredLocation from "@src/components/helper/useStoredLocation";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { getValue } from "@src/utils/localstorage";
import { userZone } from "@src/api/store/actions";
import Images from "@src/utils/images";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function HomeScreen() {
  const dispatch = useDispatch();
  const { textColorStyle, viewRTLStyle, isDark, bgFullStyle, setIsRTL, isRTL } = useValues();
  const isFocused = useIsFocused();
  const context = useContext(LocationContext);
  const { setPickupLocationLocal, setStopsLocal, setDestinationLocal } = context;
  const [isScrolling, setIsScrolling] = useState(true);
  const { translateData, taxidoSettingData } = useSelector((state: any) => state.setting);
  const { reset } = useAppNavigation();
  const { self } = useSelector((state: any) => state.account);
  const { homeScreenDataPrimary, loading } = useSelector((state: any) => state.home);
  const { latitude, longitude } = useStoredLocation();
  const exitBottomSheetRef = useRef<BottomSheet>(null);
  const exitSnapPoints = useMemo(() => ['1%', '22%'], []);
  const [serviceAvilable, setServiceAvailable] = useState<null | boolean>(null);


  useEffect(() => {
    const loadLanguageFromStorage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("selectedLanguage");
        if (savedLanguage == 'ar') {
          setIsRTL(true)
        }
        else if (isRTL) {
          setIsRTL(true)
        }
        else {
          setIsRTL(false)
        }
      } catch (error) {
        console.error("Error loading language from storage:", error);
      }
    };
    loadLanguageFromStorage();
  }, []);


  const [loaderService, setLoaderService] = useState(false);

  useEffect(() => {
    dispatch(taxidosettingDataGet());
    dispatch(allRides());
    dispatch(serviceDataGet());
    dispatch(vehicleData());
    dispatch(walletData());
    dispatch(paymentsData());
    dispatch(notificationDataGet());
    getVehicleTypes();
  }, [dispatch, getVehicleTypes]);


  useEffect(() => {
    const getAddress = async () => {
      let lat = await getValue('user_latitude_Selected');
      let lng = await getValue('user_longitude_Selected');

      let finalLat = lat ? parseFloat(lat) : latitude;
      let finalLng = lng ? parseFloat(lng) : longitude;

      if (!finalLat || !finalLng) return;

      try {
        setLoaderService(true);
        dispatch(userZone({ lat: finalLat.toString(), lng: finalLng.toString() }))
          .then(async (res: any) => {
            if (!res?.payload?.id) {
              setServiceAvailable(false)
              setLoaderService(false)
            } else {
              setServiceAvailable(true);
              setLoaderService(false)

            }
          })

      } catch (error) {
        console.error('Error fetching address:', error);
      }
    };

    getAddress();
  }, [latitude, longitude, taxidoSettingData,]);

  const getVehicleTypes = useCallback(async () => {
    const locations = [
      {
        lat: latitude,
        lng: longitude,
      },
    ];
    if (latitude && longitude) {
      dispatch(vehicleTypeDataGet({ locations }));
    }
  }, [dispatch, latitude, longitude]);

  useEffect(() => {
    const backAction = () => {
      exitBottomSheetRef.current?.expand();
      return true;
    };
    if (isFocused) {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );
      return () => backHandler.remove();
    }
  }, [isFocused]);



  const exitAndRestart = useCallback(() => {
    exitBottomSheetRef.current?.close();
    setTimeout(() => {
      BackHandler.exitApp();
      reset({
        index: 0,
        routes: [{ name: "Splash" }],
      });
    }, 500);
  }, [reset]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );


  const isDataEmpty =
    !homeScreenDataPrimary ||
    Object.keys(homeScreenDataPrimary).length === 0 ||
    homeScreenDataPrimary === null;

  return (
    <View
      style={[
        commonStyles.flexContainer,
        { backgroundColor: appColors.lightGray },
      ]}
    >
      <SafeAreaView style={styles.container}>
        <HeaderContainer />
      </SafeAreaView>
      {loading || isDataEmpty ? (
        <HomeLoader />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          nestedScrollEnabled={true}
          scrollEnabled={isScrolling}
          contentContainerStyle={[
            styles.containerStyle,
            {
              backgroundColor: isDark
                ? appColors.bgDark
                : appColors.lightGray,
            },
          ]}
        >
          {/* {serviceAvilable ? (
            <>
              {homeScreenDataPrimary?.banners?.length > 0 && (
                <HomeSlider
                  onSwipeStart={() => setIsScrolling(false)}
                  onSwipeEnd={() => setIsScrolling(true)}
                  bannerData={homeScreenDataPrimary.banners}
                />
              )}
              {homeScreenDataPrimary?.service_categories?.length > 0 && (
                <TopCategory
                  categoryData={homeScreenDataPrimary.service_categories}
                />
              )}
              {homeScreenDataPrimary?.recent_rides?.length > 0 && (
                <Recentbooking
                  recentRideData={homeScreenDataPrimary.recent_rides}
                />
              )}
              {homeScreenDataPrimary?.coupons?.length > 0 && taxidoSettingData?.taxido_values?.activation?.coupon_enable == 1 && (
                <View
                  style={styles.todayOfferContainer}
                >
                  <TodayOfferContainer
                    couponsData={homeScreenDataPrimary.coupons}
                  />
                </View>
              )}
            </>
          ) : (
            <View style={{
              flex: 1,
              justifyContent: 'center',
            }}>
              <Image source={isDark ? Images.noServiceImageDark : Images.noServiceImage} resizeMode="contain" style={styles.image} />
              <Text style={[styles.titles, { color: isDark ? appColors.whiteColor : appColors.primaryText }]}>{translateData.ServiceUnavailableNo}</Text>
            </View>
          )} */}
          {loaderService || serviceAvilable === null ? (
            <HomeLoader />
          ) : serviceAvilable ? (
            <>
              {homeScreenDataPrimary?.banners?.length > 0 && (
                <HomeSlider
                  onSwipeStart={() => setIsScrolling(false)}
                  onSwipeEnd={() => setIsScrolling(true)}
                  bannerData={homeScreenDataPrimary.banners}
                />
              )}
              {homeScreenDataPrimary?.service_categories?.length > 0 && (
                <TopCategory categoryData={homeScreenDataPrimary.service_categories} />
              )}
              {homeScreenDataPrimary?.recent_rides?.length > 0 && (
                <Recentbooking recentRideData={homeScreenDataPrimary.recent_rides} />
              )}
              {homeScreenDataPrimary?.coupons?.length > 0 &&
                taxidoSettingData?.taxido_values?.activation?.coupon_enable == 1 && (
                  <View style={styles.todayOfferContainer}>
                    <TodayOfferContainer couponsData={homeScreenDataPrimary.coupons} />
                  </View>
                )}
            </>
          ) : (
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Image
                source={isDark ? Images.noServiceImageDark : Images.noServiceImage}
                resizeMode="contain"
                style={styles.image}
              />
              <Text style={[styles.titles, { color: isDark ? appColors.whiteColor : appColors.primaryText }]}>
                {translateData.ServiceUnavailableNo}
              </Text>
            </View>
          )}

          <BottomTitle />
        </ScrollView>
      )}
      { }

      {self?.total_active_rides > 0 && serviceAvilable && (
        <View style={styles.swipeView}>
          <SwipeButton buttonText={translateData.backToActive} />
        </View>
      )}

      <BottomSheet
        ref={exitBottomSheetRef}
        index={-1}
        snapPoints={exitSnapPoints}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        style={{ zIndex: 2 }}
        handleIndicatorStyle={{ backgroundColor: appColors.primary, width: '13%' }}
        backgroundStyle={{ backgroundColor: bgFullStyle }}

      >
        <BottomSheetView style={[bottomSheetStyles.contentContainer, { backgroundColor: isDark ? appColors.darkHeader : appColors.whiteColor }]}>
          <View style={styles.modelView}>
            <Text
              style={[
                external.ti_center,
                { color: textColorStyle, fontFamily: appFonts.medium, fontSize: fontSizes.FONT22, paddingVertical: windowHeight(10) },
              ]}
            >
              {translateData?.exitTitle}
            </Text>
          </View>
          <View
            style={[
              external.ai_center,
              external.js_space,

              { flexDirection: viewRTLStyle, marginTop: windowHeight(8) },
            ]}
          >
            <Button
              width={"47%"}
              title={translateData.no}
              onPress={() => exitBottomSheetRef.current?.close()}
            />
            <Button
              width={"47%"}
              backgroundColor={isDark ? appColors.darkPrimary : appColors.lightGray}
              title={translateData.yes}
              textColor={isDark ? appColors.darkText : appColors.primaryText}
              onPress={exitAndRestart}
            />
          </View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const bottomSheetStyles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: windowHeight(15),
    backgroundColor: appColors.whiteColor,
  },
});

