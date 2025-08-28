import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert } from "react-native";
import { WebView } from 'react-native-webview'; // Import WebView
import { useNavigation, useRoute } from "@react-navigation/native";
import { Back, AddressMarker } from "@src/utils/icons";
import { appColors } from "@src/themes";
import Images from "@utils/images";
import styles from "./styles"; // We will use the corrected styles from the next file
import { useValues } from "../../../App";
import { external } from "@src/styles/externalStyle";
import { useSelector } from "react-redux";
import { setValue } from "@src/utils/localstorage";
import useSmartLocation from "@src/components/helper/locationHelper";

export function LocationSelect() {
  // --- HOOKS ---
  const { isDark, viewRTLStyle, Google_Map_Key } = useValues();
  const webViewRef = useRef<WebView>(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { field, screenValue, service_ID, service_name, service_category_ID, service_category_slug, formattedDate, formattedTime } = route.params || {};
  const { translateData } = useSelector((state) => state.setting);
  const { currentLatitude, currentLongitude } = useSmartLocation();

  // --- STATE ---
  const [initialCoords, setInitialCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapCenterCoords, setMapCenterCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentAddress, setCurrentAddress] = useState("");
  const [loadingMap, setLoadingMap] = useState(true);
  const [fetchingAddress, setFetchingAddress] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);


  // --- EFFECTS ---

  // Effect to determine the initial location to show on the map
  useEffect(() => {
    const lat = currentLatitude;
    const lon = currentLongitude;

    if (lat && lon) {
      const coords = { latitude: lat, longitude: lon };
      setInitialCoords(coords);
      setMapCenterCoords(coords);
      setLoadingMap(false);
    } else {
      console.warn("No initial location found.");
      setLoadingMap(false); 
    }
  }, [currentLatitude, currentLongitude]);

  useEffect(() => {
    if (mapCenterCoords) {
      if (debounceTimerRef?.current) clearTimeout(debounceTimerRef?.current);

      debounceTimerRef.current = setTimeout(() => {
        fetchAddress(mapCenterCoords?.latitude, mapCenterCoords?.longitude);
      }, 800); 
    }
    // Cleanup timer on component unmount
    return () => {
      if (debounceTimerRef?.current) clearTimeout(debounceTimerRef?.current);
    };
  }, [mapCenterCoords, fetchAddress]);


  const fetchAddress = useCallback(async (lat, lng) => {
    if (!Google_Map_Key) {
      console.error("[fetchAddress] Google Maps API Key is missing!");
      setCurrentAddress("Configuration error: Missing API Key.");
      return;
    }

    setFetchingAddress(true);
    try {
      let response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${Google_Map_Key}&result_type=street_address|route|intersection`
      );
      let json = await response.json();

      if (json.status === 'OK' && json.results.length === 0) {
        response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${Google_Map_Key}`
        );
        json = await response.json();
      }

      if (json.status === 'OK' && json.results.length > 0) {
        const bestResult = json.results[0];
        const cleanedAddress = bestResult?.formatted_address;
        setCurrentAddress(cleanedAddress);
      } else {
        console.warn("[fetchAddress] Geocoding API returned no results:", json.status);
        setCurrentAddress("Could not find address for this location.");
      }

    } catch (error) {
      console.error("[fetchAddress] Failed to fetch address:", error);
      setCurrentAddress("Failed to connect to address service.");
    } finally {
      setFetchingAddress(false);
    }
  }, [Google_Map_Key]);

  const handleWebViewMessage = (event: any) => {
    const data = JSON.parse(event?.nativeEvent?.data);
    if (data?.type === 'mapMove') {
      const { lat, lng } = data?.payload;
      setMapCenterCoords({ latitude: lat, longitude: lng });
    }
  };

  const handleConfirmLocation = async () => {
    if (!currentAddress || !mapCenterCoords || fetchingAddress) {
      Alert.alert("Location Not Ready", "Please wait for the address to load or select a valid location.");
      return;
    }
    if (screenValue === "HomeScreen") {
      await setValue('user_latitude_Selected', mapCenterCoords?.latitude.toString());
      await setValue('user_longitude_Selected', mapCenterCoords?.longitude.toString());
      navigation.replace("MyTabs");
      return;
    }
    navigation.navigate(screenValue, {
      selectedAddress: currentAddress,
      fieldValue: field,
      pinLatitude: mapCenterCoords?.latitude,
      pinLongitude: mapCenterCoords?.longitude,
      service_ID,
      service_name,
      service_category_ID,
      service_category_slug,
      formattedDate,
      formattedTime,
    });
  };

  const getMapHTML = (coords: { latitude: number; longitude: number; }) => {
    const mapThemeStyles = isDark ? `
      [ { "featureType": "all", "elementType": "labels.text.fill", "stylers": [ { "color": "#ffffff" } ] },
        { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [ { "visibility": "on" }, { "color": "#000000" }, { "lightness": 13 } ] },
        { "featureType": "administrative", "elementType": "geometry.fill", "stylers": [ { "color": "#000000" } ] },
        /* Add all other dark map styles here */
        { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [ { "color": "#444444" } ] } ]
    ` : '[]';

    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style> body, html, #map { margin: 0; padding: 0; height: 100%; width: 100%; background-color: #333; } </style>
      </head>
      <body>
          <div id="map"></div>
          <script>
              function initMap() {
                  const map = new google.maps.Map(document.getElementById('map'), {
                      center: { lat: ${coords?.latitude}, lng: ${coords?.longitude} },
                      zoom: 16,
                      disableDefaultUI: true,
                      styles: ${mapThemeStyles}
                  });

                  // Listen for the 'idle' event, which fires when the map has stopped moving.
                  map.addListener('idle', () => {
                      const center = map.getCenter();
                      const message = {
                          type: 'mapMove',
                          payload: { lat: center.lat(), lng: center.lng() }
                      };
                      window.ReactNativeWebView.postMessage(JSON.stringify(message));
                  });
              }
          </script>
          <script async defer src="https://maps.googleapis.com/maps/api/js?key=${Google_Map_Key}&callback=initMap"></script>
      </body>
      </html>
    `;
  };

  // --- RENDER ---
  return (
    <View style={external.main}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[styles.backView, { backgroundColor: isDark ? appColors.darkPrimary : appColors.whiteColor }]}
      >
        <Back />
      </TouchableOpacity>

      {loadingMap ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={appColors.primary} />
        </View>
      ) : initialCoords ? (
        <>
          <WebView
            ref={webViewRef}
            style={styles.mapView}
            source={{ html: getMapHTML(initialCoords) }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
          />
          <View style={styles.pointerMarker} pointerEvents="none">
            <Image source={Images.pin} style={styles.pinImage} />
          </View>
        </>
      ) : (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={appColors.primary} />
        </View>
      )}

      <View style={[styles.textInputContainer, { backgroundColor: isDark ? appColors.darkPrimary : appColors.whiteColor, flexDirection: viewRTLStyle }]}>
        <View style={[styles.addressBtnView, { backgroundColor: isDark ? appColors.bgDark : appColors.lightGray }]}>
          <AddressMarker />
        </View>
        <TextInput
          style={[styles.textInput, { color: isDark ? appColors.whiteColor : appColors.blackColor }]}
          value={fetchingAddress ? "Locating..." : currentAddress || "Move map to select location"}
          editable={false}
          multiline
        />
      </View>

      <TouchableOpacity
        style={styles.confirmButton}
        onPress={handleConfirmLocation}
        disabled={fetchingAddress || loadingMap || !currentAddress}
        activeOpacity={0.8}
      >
        {fetchingAddress ? (
          <ActivityIndicator size="large" color={appColors.whiteColor} />
        ) : (
          <Text style={styles.confirmText}>{translateData.confirmLocation || "Confirm Location"}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}