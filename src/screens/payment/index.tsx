import { View, Text, TouchableOpacity, Linking, StyleSheet, Image } from "react-native";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Map } from "@src/commonComponent";
import styles from "./styles";
import { useValues } from "../../../App";
import { DriverData } from "./component/driverData/index";
import { TotalFare } from "./component/totalFare/index";
import { useRoute } from "@react-navigation/native";
import { CustomBackHandler } from "@src/components";
import { useAppNavigation } from "@src/utils/navigation";
import { external } from "@src/styles/externalStyle";
import firestore from '@react-native-firebase/firestore';
import { BottomSheetModal, BottomSheetModalProvider, BottomSheetView, BottomSheetFlatList, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { appColors, appFonts, fontSizes, windowHeight, windowWidth } from "@src/themes";
import { useDispatch, useSelector } from "react-redux";
import { allRides, sosData } from "@src/api/store/actions";

export function Payment() {
  const { bgFullStyle } = useValues();
  const { navigate } = useAppNavigation();
  const route = useRoute();
  const { rideId } = route.params;
  const [rideDatas, setRideData] = useState(null);
  const [duration, setDuration] = useState(null);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const sosSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['25%'], []);
  const sosSnapPoints = useMemo(() => ['35%'], []);
  const dispatch = useDispatch();
  const { zoneValue } = useSelector((state: any) => state.zone);
  const { sosValue } = useSelector((state: any) => state.sos);
  const { isDark, viewRTLStyle } = useValues()
  const { translateData } = useSelector((state: any) => state.setting);

  useEffect(() => {
    if (!rideId) return;
    const unsubscribe = firestore()
      .collection('rides')
      .doc(rideId.toString())
      .onSnapshot((doc) => {
        if (doc.exists) {
          setRideData(doc.data());
        }
      });
    return () => unsubscribe();
  }, [rideId]);

  useEffect(() => {
    bottomSheetRef.current?.present();
    if (zoneValue?.id) {
      dispatch(sosData({ zone_id: zoneValue.id }));
    }
  }, [zoneValue]);

  const handlePress = () => {
    navigate("PaymentMethod", { rideData: rideDatas });
    dispatch(allRides())
  };

  const handleDurationChange = (newDuration: any) => {
    setDuration(newDuration);
  };

  const handleSOSPress = () => {
    sosSheetRef.current?.present();
  };

  const handleContactPress = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const renderSosItem = useCallback(({ item }) => (
    <View style={{ marginHorizontal: windowWidth(18), borderRadius: windowHeight(5) }}>
      <TouchableOpacity
        style={[componentStyles.sosItem, { backgroundColor: isDark ? appColors.darkHeader : appColors.lightGray }]}
        onPress={() => handleContactPress(item.number)}
      >
        <View style={{ flexDirection: viewRTLStyle }}>
          <Image source={{ uri: item.sos_image_url }} style={styles.sosImage} />
          <View style={[styles.sideLine, { backgroundColor: isDark ? appColors.darkBorder : appColors.border }]} />
          <Text style={[componentStyles.sosName, { color: isDark ? appColors.darkText : appColors.primaryText }]}>{item?.title}</Text>
        </View>
      </TouchableOpacity>
    </View>
  ), []);

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );

  return (
    <BottomSheetModalProvider>
      <View style={external.main}>
        <CustomBackHandler />
        <View style={{ flex: 1 }}>
          <Map
            markerImage={rideDatas?.vehicle_type?.vehicle_map_icon_url}
            userLocation={rideDatas?.location_coordinates?.[1] || {}}
            onDurationChange={handleDurationChange}
            driverId={rideDatas?.driver?.id || ""}
          />
        </View>

        <BottomSheetModal
          ref={bottomSheetRef}
          index={1} 
          snapPoints={snapPoints}
          enablePanDownToClose={false} 
          enableDismissOnClose={false}
          handleComponent={null}
          handleIndicatorStyle={{ backgroundColor: appColors.primary, width: '13%' }}
          backgroundStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16, backgroundColor: isDark ? appColors.darkHeader : appColors.whiteColor }}
        >
          <BottomSheetView style={{ paddingHorizontal: 16 }}>
            <View style={styles.mainView}>
              <DriverData driverDetails={rideDatas} duration={duration} onSOSPress={handleSOSPress} />
              <View style={{ borderBottomWidth: 1, borderColor: isDark ? appColors.darkBorder : appColors.border, marginVertical: windowHeight(1.5), marginTop: windowHeight(10) }} />
              <View style={[styles.card2, { backgroundColor: bgFullStyle }]}>
                <TotalFare
                  handlePress={handlePress}
                  fareAmount={rideDatas?.total || 0}
                  rideStatus={rideDatas?.ride_status?.slug || ""}
                />
              </View>
            </View>
          </BottomSheetView>
        </BottomSheetModal>

        <BottomSheetModal
          ref={sosSheetRef}
          index={1} 
          snapPoints={sosSnapPoints}
          enablePanDownToClose={true} 
          backdropComponent={renderBackdrop} 
          handleIndicatorStyle={{ backgroundColor: appColors.primary, width: '13%' }}
          backgroundStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16, backgroundColor: isDark ? appColors.bgDark : appColors.whiteColor }}
        >
          <BottomSheetView style={componentStyles.contentContainer}>
            <Text style={[componentStyles.title, { color: isDark ? appColors.whiteColor : appColors.blackColor }]}>{translateData.keepYourselfSafe}</Text>
          </BottomSheetView>
          <BottomSheetFlatList
            data={sosValue?.data}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderSosItem}
            style={{ marginTop: windowHeight(20) }}
          />
        </BottomSheetModal>
      </View>
    </BottomSheetModalProvider>
  );
}

const componentStyles = StyleSheet.create({
  contentContainer: {
    width: '100%'
  },
  title: {
    fontSize: fontSizes.FONT22,
    color: appColors.primaryText,
    fontFamily: appFonts.bold,
    textAlign: 'center',
  },
  sosItem: {
    marginTop: windowHeight(10),
    padding: windowHeight(10),
  },
  sosName: {
    fontFamily: appFonts.medium
  },
  sosNumber: {
  },
});

export default Payment;