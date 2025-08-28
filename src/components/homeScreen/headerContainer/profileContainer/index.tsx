import { View, Text, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useValues } from "@App";
import styles from "./styles";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { ArrowDown, LocationMarker } from "@src/utils/icons";
import { appColors } from "@src/themes";
import { getValue } from "@src/utils/localstorage";
import useStoredLocation from "@src/components/helper/useStoredLocation";

export function ProfileContainer() {
  const navigation = useNavigation();
  const { viewRTLStyle, Google_Map_Key, isRTL } = useValues();
  const { self } = useSelector((state: any) => state.account);
  const { taxidoSettingData } = useSelector((state: any) => state.setting);
  const { latitude, longitude } = useStoredLocation();
  const char = self?.name ? self.name.charAt(0) : "";
  const [welcom, setWelcome] = useState("");
  const [city, setCity] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (
      taxidoSettingData?.taxido_values?.general &&
      Array.isArray(taxidoSettingData?.taxido_values?.general?.greetings)
    ) {
      const greetingsFromApi = taxidoSettingData?.taxido_values?.general?.greetings;
      const goodMorningMsg = greetingsFromApi.find((msg) => typeof msg === "string");
      setWelcome(goodMorningMsg);
    }
  }, [taxidoSettingData?.taxido_values?.general?.greetings]);


  useEffect(() => {
    const getAddress = async () => {
      let lat = await getValue('user_latitude_Selected');
      let lng = await getValue('user_longitude_Selected');

      let finalLat = lat ? parseFloat(lat) : latitude;
      let finalLng = lng ? parseFloat(lng) : longitude;

      if (!finalLat || !finalLng || !Google_Map_Key) return;

      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${finalLat},${finalLng}&key=${Google_Map_Key}&result_type=street_address`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK') {
          const components = data.results[0].address_components;

          const foundCity = components.find(c =>
            c.types.includes('locality') || c.types.includes('administrative_area_level_2')
          )?.long_name;

          const fullAddr = data.results[0]?.formatted_address;

          setCity(foundCity || 'City not found');
          setFullAddress(fullAddr || 'Address not found');
        } else {
          setCity('City not found');
          setFullAddress('Address not found');
          console.warn('Geocoding failed:', data.status);
        }
      } catch (error) {
        console.error('Error fetching address:', error);
        setCity('City error');
        setFullAddress('Address error');
      }
    };

    getAddress();
  }, [latitude, longitude, taxidoSettingData, Google_Map_Key]);

  const handleImagePress = async () => {
    const token = await getValue("token")
    if (token) {
      navigation.navigate("EditProfile")
    }
  }


  useFocusEffect(
    useCallback(() => {
      const fetchStoredImage = async () => {
        const storedImageUri = await getValue("profile_image_uri");
        setLocalImageUri(storedImageUri);
      };
      fetchStoredImage();
    }, [])
  );

  const gotoLocation = () => {
    navigation.navigate("LocationSelect", { screenValue: "HomeScreen" })
  }
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchStoredImage = async () => {
        const storedImageUri = await getValue("profile_image_uri");
        setLocalImageUri(storedImageUri);
        setTimeout(() => {
          setLoading(false);
        }, 3000);
      };
      fetchStoredImage();
    }, [])
  );
  return (
    <View style={[styles.mainView, { flexDirection: viewRTLStyle }]}>

      <TouchableOpacity onPress={gotoLocation} style={styles.viewText}>
        <Text style={[styles.selfName, { textAlign: isRTL ? 'right' : 'left' }]}>
          <LocationMarker /> {city?.split(" ")[0] || "fetching...."} <ArrowDown color={appColors.whiteColor} />
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Text style={styles.text}>{fullAddress.length > 32 ? `${fullAddress.substring(0, 32)}...` : fullAddress}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleImagePress} style={styles.imageView} activeOpacity={0.7}>
        {self?.profile_image?.original_url ? (
          <Image
            style={styles.imageStyle}
            source={{ uri: self.profile_image.original_url }}
          />
        ) : localImageUri ? (
          <Image
            style={styles.imageStyle}
            source={{ uri: localImageUri }}
          />
        ) : (
          <View style={styles.textView}>
            {loading ? <ActivityIndicator size="small" color={appColors.primary} /> : <Text style={styles.charText}>{char || "G"}</Text>}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
