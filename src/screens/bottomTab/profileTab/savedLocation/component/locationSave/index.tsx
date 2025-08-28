import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from "@react-navigation/native";
import darkMapStyle from "@src/screens/darkMapStyle";
import Images from "@utils/images";
import { useValues } from "@App";
import styles from "./styles";
import { Back, AddressMarker } from "@src/utils/icons";
import { appColors, appFonts, fontSizes, windowHeight, windowWidth } from "@src/themes";
import { Button } from "@src/commonComponent";
import { SaveLocationDataInterface } from "@src/api/interface/saveLocationinterface";
import { addSaveLocation, updateSaveLocation } from "@src/api/store/actions";
import { useDispatch, useSelector } from "react-redux";
import { userSaveLocation } from "@src/api/store/actions/saveLocationAction";
import { external } from "@src/styles/externalStyle";
import useStoredLocation from "@src/components/helper/useStoredLocation";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';

export function LocationSave() {
  const { isDark, linearColorStyle, textColorStyle, viewRTLStyle, textRTLStyle, Google_Map_Key, bgFullStyle } = useValues();
  const [currentAddress, setCurrentAddress] = useState("");
  const { goBack } = useNavigation();
  const route = useRoute();
  const { mode, locationID, locationDetails } = route.params || {};
  const [locationTitle, setLocationTitle] = useState(locationDetails?.title);
  const dispatch = useDispatch();
  const { translateData } = useSelector((state: any) => state.setting);
  const { latitude, longitude } = useStoredLocation();
  const webViewRef = useRef<WebView>(null);
  const [loadingMap, setLoadingMap] = useState(true);
  const [isLocationInitialized, setIsLocationInitialized] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [mapCenterCoords, setMapCenterCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [fetchingAddress, setFetchingAddress] = useState(false);
  const [saveLoading, setsaveLoading] = useState(false);
  const saveLocationBottomSheetRef = useRef<BottomSheet>(null);
  const saveLocationSnapPoints = useMemo(() => ['1%', '39%'], []);

  const mapHtml = useMemo(() => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
      <style>
        html, body, #map { height: 100%; margin: 0; padding: 0; }
        ${isDark ? `body { background-color: #000; }` : ''}
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        let map;
        let debounceTimer;

        function initMap() {
          const initialCoords = { lat: ${latitude || 21.1702}, lng: ${longitude || 72.8311} };
          map = new google.maps.Map(document.getElementById('map'), {
            center: initialCoords,
            zoom: 15,
            styles: ${isDark ? JSON.stringify(darkMapStyle) : '[]'},
            disableDefaultUI: true
          });

          map.addListener('center_changed', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
              const center = map.getCenter();
              window.ReactNativeWebView.postMessage(JSON.stringify({ latitude: center.lat(), longitude: center.lng() }));
            }, 500);
          });

         // Initial position post
          window.ReactNativeWebView.postMessage(JSON.stringify({ latitude: initialCoords.lat, longitude: initialCoords.lng }));
        }
      </script>
      <script async defer src="https://maps.googleapis.com/maps/api/js?key=${Google_Map_Key}&callback=initMap"></script>
    </body>
    </html>
  `, [latitude, longitude, Google_Map_Key, isDark]);

  useEffect(() => {
    if (latitude && longitude && !isLocationInitialized) {
      setMapCenterCoords({ latitude, longitude });
      fetchAddress(latitude, longitude);
      setIsLocationInitialized(true);
    } else if (!latitude && !longitude && !isLocationInitialized) {
      const defaultLat = 21.1702;
      const defaultLng = 72.8311;
      setMapCenterCoords({ latitude: defaultLat, longitude: defaultLng });
      fetchAddress(defaultLat, defaultLng);
      setIsLocationInitialized(true);
    }
  }, [latitude, longitude, isLocationInitialized, fetchAddress]);


  useEffect(() => {
    if (mode === "edit" && locationDetails && !isLocationInitialized) {
      const { latitude: lat, longitude: lng } = locationDetails;
      if (lat && lng) {
        setMapCenterCoords({ latitude: lat, longitude: lng });
        fetchAddress(lat, lng);
      }
      setIsLocationInitialized(true);
    }
  }, [mode, locationDetails, isLocationInitialized, fetchAddress]);


  const fetchAddress = useCallback(async (lat: number, lng: number) => {
    if (!Google_Map_Key) {
      console.warn("[fetchAddress] Missing Google Map Key");
      setCurrentAddress("Google Map Key is missing");
      return;
    }

    try {
      setFetchingAddress(true);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${Google_Map_Key}&result_type=street_address`;
      const res = await fetch(url);
      const json = await res.json();

      if (json?.results?.length > 0) {
        const formattedAddress = json.results[0].formatted_address;
        setCurrentAddress(formattedAddress);
      } else {
        setCurrentAddress("No address found");
      }
    } catch (err) {
      console.error("[fetchAddress] Error:", err);
      setCurrentAddress("Address fetch failed");
    } finally {
      setFetchingAddress(false);
    }
  }, [Google_Map_Key]);

  const handleWebViewMessage = (event: any) => {
    const coords = JSON.parse(event.nativeEvent.data);
    setMapCenterCoords(coords);
    fetchAddress(coords.latitude, coords.longitude);
  };

  const handleConfirmLocation = useCallback(() => {
    if (!currentAddress || !mapCenterCoords || fetchingAddress) {
      Alert.alert("Location Not Ready", "Wait for address to load or move map.");
      return;
    }
    saveLocationBottomSheetRef.current?.expand();
  }, [currentAddress, mapCenterCoords, fetchingAddress]);

  const goback = () => {
    goBack();
  };

  const addAddress = useCallback(() => {
    setsaveLoading(true)
    if (!locationTitle?.trim()) {
      setTitleError("Please Enter Your Title");
      setsaveLoading(false)
      return;
    }
    setTitleError("");
    const payload: SaveLocationDataInterface = {
      title: locationTitle,
      location: currentAddress,
      type: selectedOption,
      location_coordinates: {
        lat: mapCenterCoords?.latitude,
        lng: mapCenterCoords?.longitude,
      }
    } as SaveLocationDataInterface;

    const action = mode === 'edit' ? updateSaveLocation({ data: payload, locationID }) : addSaveLocation(payload);

    dispatch(action)
      .unwrap()
      .then(() => {
        dispatch(userSaveLocation());
        goBack();
      })
      .catch((error: any) => {
        console.error(`Error ${mode === 'edit' ? 'updating' : 'adding'} location:`, error);
        Alert.alert("Error", `Failed to ${mode === 'edit' ? 'update' : 'add'} location.`);
      })
      .finally(() => {
        saveLocationBottomSheetRef.current?.close();
        setsaveLoading(false);
      });
  }, [locationTitle, currentAddress, selectedOption, mapCenterCoords, mode, locationID, dispatch, goBack]);

  const options = [
    { label: `${translateData.home}`, value: "home" },
    { label: `${translateData.work}`, value: "work" },
    { label: `${translateData.other}`, value: "other" },
  ];
  const validTypes = options.map(opt => opt.value);

  const [selectedOption, setSelectedOption] = useState(
    validTypes.includes(locationDetails?.type)
      ? locationDetails.type
      : options[0].value
  );


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

  const handleBottomSheetClose = useCallback(() => {
    if (mode !== 'edit') {
      setLocationTitle('');
    }
    setTitleError('');
  }, [mode]);

  return (
    <View style={external.main}>
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={goback}
          style={[styles.backView, {
            backgroundColor: linearColorStyle
          }]}
        >
          <Back />
        </TouchableOpacity>
        <View style={[styles.textInputContainer, { backgroundColor: linearColorStyle }, { flexDirection: viewRTLStyle }]}>
          <View
            style={[styles.addressMarkerIcon, {
              backgroundColor: linearColorStyle
            }]}
          >
            <AddressMarker />
          </View>
          <View
            style={[styles.inputLine, {
              borderColor: isDark ? appColors.darkBorder : appColors.primaryGray,
            }]}
          />

          <TextInput
            style={[styles.textInput, { backgroundColor: linearColorStyle }, { color: textColorStyle }]}
            value={fetchingAddress ? translateData.gettingAddress : currentAddress || translateData.moveMapToSelectLocation}
            placeholder={translateData.searchHere}
            editable={false}
          />
        </View>
      </View>
      <View style={styles.mapView}>
        {loadingMap && (
          <ActivityIndicator style={StyleSheet.absoluteFill} size="large" color={appColors.primary} />
        )}
        <WebView
          ref={webViewRef}
          source={{ html: mapHtml }}
          onLoadEnd={() => setLoadingMap(false)}
          onMessage={handleWebViewMessage}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => <ActivityIndicator style={StyleSheet.absoluteFill} size="large" color={appColors.primary} />}
        />
      </View>
      <TouchableOpacity
        style={styles.confirmButton}
        onPress={handleConfirmLocation}
        activeOpacity={0.7}
        disabled={fetchingAddress || loadingMap}
      >
        {fetchingAddress ? (
          <ActivityIndicator size="large" color={appColors.whiteColor} />
        ) : (
          <Text style={styles.confirmText}>{translateData.confirmLocation}</Text>
        )}
      </TouchableOpacity>
      <View style={styles.pointerMarker}>
        <Image source={Images.pin} style={styles.pinImage} />
      </View>

      <BottomSheet
        ref={saveLocationBottomSheetRef}
        index={-1}
        snapPoints={saveLocationSnapPoints}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        onChange={(index) => {
          if (index === -1) {
            handleBottomSheetClose();
          }
        }}
        style={{ zIndex: 5 }}
        handleIndicatorStyle={{ backgroundColor: appColors.primary, width: '13%' }}
        backgroundStyle={{ backgroundColor: bgFullStyle }}      >
        <BottomSheetView style={bottomSheetStyles.contentContainer}>
          <Text style={[styles.title, { color: textColorStyle }]}>{translateData.addNewLocation}</Text>
          <View style={styles.container}>
            <View style={[styles.optionContain, { flexDirection: viewRTLStyle }]}>
              {options.map((option) => (
                <TouchableOpacity
                  activeOpacity={0.7}
                  key={option.value}
                  style={[
                    [styles.optionContainer, { flexDirection: viewRTLStyle }, { borderColor: isDark ? appColors.darkBorder : appColors.border, backgroundColor: isDark ? appColors.darkPrimary : appColors.whiteColor }],
                    selectedOption === option.value &&
                    styles.selectedOptionContainer,
                  ]}
                  onPress={() => setSelectedOption(option.value)}
                >
                  <View
                    style={[
                      styles.radioButton,
                      selectedOption === option.value &&
                      styles.selectedOptionRadio,
                    ]}
                  >
                    {selectedOption === option.value && (
                      <View style={styles.radioSelected} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.optionLabel, { color: isDark ? appColors.whiteColor : appColors.primaryText },
                      selectedOption === option.value &&
                      styles.selectedOptionLabel,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{
              color: isDark ? appColors.whiteColor : appColors.primaryText,
              fontFamily: appFonts.medium,
              marginTop: windowHeight(8),
              textAlign: textRTLStyle,
            }}>{translateData.addressTitle}</Text>
            <TextInput
              placeholder={translateData.enterYouTitleeeee}
              placeholderTextColor={appColors.regularText}
              style={[
                styles.titleInput,
                { color: textColorStyle },
                { borderColor: isDark ? appColors.darkBorder : appColors.border }, { textAlign: textRTLStyle },
              ]}
              value={locationTitle}
              onChangeText={(text) => {
                setLocationTitle(text);
                if (!text.trim()) {
                  setTitleError(translateData.addressRequired);
                } else {
                  setTitleError('');
                }
              }}
            />

            {titleError ? (
              <Text style={{ color: appColors.textRed, fontSize: fontSizes.FONT14SMALL, fontFamily: appFonts.medium }}>
                {titleError}
              </Text>
            ) : null}

          </View>
          <View style={[styles.btnContainer, { flexDirection: viewRTLStyle }]}>
            <Button
              backgroundColor={appColors.lightButton}
              onPress={() => saveLocationBottomSheetRef.current?.close()}
              textColor={appColors.primary}
              title={translateData.cancel}
              width={"47%"}
            />
            <Button
              backgroundColor={appColors.primary}
              onPress={addAddress}
              textColor={appColors.whiteColor}
              title={translateData.save}
              width={"47%"}
              loading={saveLoading}
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
    paddingHorizontal: windowWidth(18),
    paddingTop: windowHeight(15),
  },
  closeButton: {
    position: 'absolute',
    right: windowWidth(5),
    top: windowHeight(2),
    zIndex: 10,
    padding: windowWidth(2),
  }
});