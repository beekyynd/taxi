import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Text, TouchableOpacity, View, ScrollView, Modal, Animated, Dimensions, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, FlatList, Alert, Platform, TextInput, Pressable } from 'react-native';
import { History, Calender, AddressMarker, PickLocation, Save, Driving, Gps, Close, Add, Minus } from '@utils/icons';
import { styles } from './styles';
import { commonStyles } from '../../styles/commonStyle';
import { external } from '../../styles/externalStyle';
import { SolidLine, Button, Header, InputText } from '@src/commonComponent';
import { useValues } from '../../../App';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { userZone } from '../../api/store/actions/index';
import { vehicleTypeDataGet } from '../../api/store/actions/vehicleTypeAction';
import { getValue, setValue } from '@src/utils/localstorage';
import { appColors, appFonts, windowHeight, windowWidth } from '@src/themes';
import { useAppNavigation } from '@src/utils/navigation';
import { getDistance } from 'geolib';
import useSmartLocation from '@src/components/helper/locationHelper';

export function LocationDrop() {
  const dispatch = useDispatch();
  const { navigate, replace } = useAppNavigation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [destination, setDestination] = useState<string>("");
  const [stops, setStops] = useState<string[]>([]);
  const [pickupLocation, setPickupLocation] = useState<string>("");
  const route = useRoute();
  const { service_ID, service_name, service_category_ID, service_category_slug, formattedDate, formattedTime } = route.params;
  const { selectedAddress, fieldValue, pinLatitude, pinLongitude } = route.params || {};
  const [fieldLength, setFieldLength] = useState<number>(0);
  const [addressData, setAddressData] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isInitialFetchDone, setIsInitialFetchDone] = useState(false);
  const { zoneValue } = useSelector((state) => state.zone);
  const [visible, setVisible] = useState(false);
  const screenWidth = Dimensions.get("window").width;
  const translateX = useRef(new Animated.Value(-30)).current;
  const { settingData, taxidoSettingData, translateData } = useSelector((state) => state.setting);
  const [recentDatas, setRecentDatas] = useState([]);
  const [dateError, setDateError] = useState(false)
  const { DateValue, TimeValue, field } = route.params || {};
  const [scheduleDate, setScheduleDate] = useState({
    DateValue: DateValue || "",
    TimeValue: TimeValue || "",
  });
  const [proceedLoading, setProceedLoading] = useState(false);
  const { currentLatitude, currentLongitude } = useSmartLocation();
  const [isdesFocused, setIsdesFocused] = useState(false);
  const { linearColorStyle, viewRTLStyle, textColorStyle, bgFullLayout, textRTLStyle, isDark, isRTL, Google_Map_Key } = useValues();
  const [wasAutoFilled, setWasAutoFilled] = useState(false);
  const [destinationFullAddress, setDestinationFullAddress] = useState();
  const [hasNavigated, setHasNavigated] = useState(false);
  const pickupRef = useRef<TextInput>(null);
  const destinationRef = useRef<TextInput>(null);
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [stopCoords, setStopCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [minRadiusKm, setMinRadiusKm] = useState(0);

  useEffect(() => {
    const init = async () => {
      const meters = taxidoSettingData?.taxido_values?.ride?.min_intracity_radius ?? 0;
      await setMinRadiusKm(meters / 1000);
    };
    init();
  }, [taxidoSettingData?.taxido_values?.ride?.min_intracity_radius]);




  const coordset = (selectedPickup, selectedDropOff) => {
    if (selectedPickup) convertToCoords(selectedPickup, setPickupCoords, "pickup");
    if (selectedDropOff) convertToCoords(selectedDropOff, setDestinationCoords, "destination");
    if (stops.length) convertStopsToCoords(stops);
  }

  const convertToCoords = async (address, setter, label = "") => {
    if (!address) {
      setter(null);
      return;
    }
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${Google_Map_Key}`
      );
      const data = await res.json();
      if (data?.status === 'OK' && data?.results.length > 0) {
        const { lat, lng } = data?.results[0].geometry?.location;
        setter({ lat: lat, lng: lng });
        if (label === "destination") {
        }
      } else {
        console.warn("No results for:", address, data.status);
        setter(null);
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      setter(null);
    }
  };

  const convertStopsToCoords = async (stopList) => {
    const coordsArray = [];
    for (const stop of stopList) {
      if (stop) {
        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(stop)}&key=${Google_Map_Key}`
          );
          const data = await res.json();
          if (data?.status === 'OK' && data?.results.length > 0) {
            const { lat, lng } = data?.results[0].geometry.location;
            coordsArray.push({ lat: lat, lng: lng });
          } else {
            console.warn("No results for stop:", stop, data.status);
            coordsArray.push(null);
          }
        } catch (err) {
          console.error("Stop geocoding error:", err);
          coordsArray.push(null);
        }
      } else {
        coordsArray.push(null);
      }
    }
    setStopCoords(coordsArray);
  };


  useEffect(() => {
    fetchAddressFromCoords(currentLatitude, currentLongitude);
  }, [currentLatitude, currentLongitude]);

  const fetchAddressFromCoords = async (latitude, longitude) => {
    if (!latitude || !longitude) return;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${Google_Map_Key}&result_type=street_address`;
    try {
      const response = await fetch(url);
      const json = await response.json();
      if (json.status === "OK" && json?.results.length > 0) {
        const addressComponents = json.results[0].address_components;
        const route = addressComponents.find(comp => comp.types.includes('route'))?.short_name;
        const locality = addressComponents.find(comp => comp.types.includes('locality'))?.short_name;
        const subLocality = addressComponents.find(comp => comp.types.includes('sublocality'))?.short_name;
        const shortAddress = [route, subLocality || locality].filter(Boolean).join(', ');
        const fullAddress = json.results[0]?.formatted_address;
        const useFullAddress = taxidoSettingData?.taxido_values?.activation?.full_address_location == 1;

        if (!pickupLocation) {
          setPickupLocation(
            useFullAddress
              ? fullAddress
              : shortAddress || json?.results[0]?.formatted_address
          );
          setPickupCoords({ lat: latitude, lng: longitude })

        }
        setWasAutoFilled(true);
      }
    } catch (error) {
      console.error("Error fetching short address:", error);
    }
  };


  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        if (pickupLocation && pickupLocation?.length > 0 && wasAutoFilled) {
          destinationRef.current?.focus();
        } else {
          pickupRef.current?.focus();
        }
      }, 300);

      return () => clearTimeout(timer);
    }, [pickupLocation, wasAutoFilled])
  );


  useEffect(() => {
    setScheduleDate({
      DateValue: DateValue || "",
      TimeValue: TimeValue || "",
    });
    if (DateValue && TimeValue) {
      setDateError(false);
    }
  }, [DateValue, TimeValue]);


  useEffect(() => {
    const fetchRecentData = async () => {
      try {
        const stored = await getValue("locations");
        let parsedLocations = [];
        if (stored) {
          parsedLocations = JSON.parse(stored);
          if (!Array.isArray(parsedLocations)) {
            parsedLocations = [parsedLocations];
          }
        }
        setRecentDatas(parsedLocations);
      } catch (error) {
        console.error("Error parsing recent locations:", error);
        setRecentDatas([]);
      }
    };
    fetchRecentData();
  }, []);

  useEffect(() => {
    if (fieldLength > 3) {
      startAnimation();
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [fieldLength]);

  const startAnimation = () => {
    Animated.sequence([
      Animated.timing(translateX, {
        toValue: screenWidth,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: -30,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: screenWidth,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: -30,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  };


  useEffect(() => {
    if (hasNavigated) return;
    const allStopsValid = stops.every(stop => stop.trim().length > 0);
    const allFieldsFilled =
      pickupLocation.trim().length > 0 &&
      destination?.trim().length > 0 &&
      (stops.length === 0 || allStopsValid);
    if (activeField === null && allFieldsFilled) {
      setHasNavigated(true);
    }
  }, [activeField, pickupLocation, destination, stops]);


  const fetchAddressSuggestions = async (input) => {
    if (input.length >= 3) {
      const apiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&location=${currentLatitude},${currentLongitude}&radius=50000&key=${Google_Map_Key}`;

      try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.status !== "OK") {
          console.error("Autocomplete API Error:", data.status, data.error_message || "");
          return;
        }

        const promises = data.predictions.map(async (prediction) => {
          const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction?.place_id}&fields=geometry&key=${Google_Map_Key}`;
          const placeDetailsRes = await fetch(placeDetailsUrl);
          const placeDetailsData = await placeDetailsRes.json();

          const location = placeDetailsData?.result?.geometry?.location;
          if (!location) return null;

          const distanceInMeters = getDistance(
            { latitude: currentLatitude, longitude: currentLongitude },
            { latitude: location?.lat, longitude: location?.lng }
          );
          return {
            id: prediction?.place_id,
            shortAddress: prediction.structured_formatting?.main_text,
            detailAddress: prediction.structured_formatting?.secondary_text,
            distanceKm: (distanceInMeters / 1000).toFixed(2), // convert to km
          };
        });

        const places = (await Promise.all(promises)).filter(Boolean);
        const sortedPlaces = places.sort((a, b) => parseFloat(a.distanceKm) - parseFloat(b.distanceKm));
        setSuggestions(sortedPlaces);

      } catch (error) {
        console.error("Error fetching suggestions with distance:", error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleRecentClick = async (suggestion) => {
    if (activeField === "pickupLocation") {
      setPickupLocation(suggestion?.shortAddress);
      setWasAutoFilled(true);
      coordset(suggestion?.detailAddress, '');
    } else if (activeField === "destination") {

      setDestination(suggestion?.detailAddress);
      setDestinationFullAddress(suggestion)
      coordset('', suggestion?.detailAddress);

    } else if (activeField && activeField.startsWith("stop-")) {
      const stopIndex = parseInt(activeField.split("-")[1], 10) - 1;
      updatedStops[stopIndex] = suggestion?.shortAddress;
      setStops(updatedStops);
      coordset(suggestion?.detailAddress);
    }
  }

  const handleSuggestionClick = async (suggestion) => {

    try {
      let storedLocations = [];
      const stored = await getValue("locations");

      if (stored) {
        storedLocations = JSON.parse(stored);
        if (!Array.isArray(storedLocations)) {
          storedLocations = [storedLocations];
        }
      }

      const alreadyExists = storedLocations.some(
        (loc) =>
          loc?.shortAddress?.trim().toLowerCase() ===
          suggestion?.shortAddress?.trim().toLowerCase()
      );

      if (!alreadyExists) {
        let suggestions = {
          shortAddress: suggestion?.shortAddress,
          detailAddress: suggestion?.detailAddress
        }
        storedLocations.push(suggestions);
        if (storedLocations?.length > 5) {
          storedLocations?.shift();
        }
      } else { }
    } catch (error) {
      console.error("Error handling locations:", error);
    }

    Keyboard.dismiss();
    let updatedStops = [...stops];

    if (activeField === "pickupLocation") {
      setPickupLocation(suggestion?.shortAddress);
      setWasAutoFilled(true);
      coordset(suggestion?.detailAddress, '');
    } else if (activeField === "destination") {
      setDestination(suggestion?.shortAddress);
      setDestinationFullAddress(suggestion)
      coordset('', suggestion?.detailAddress);
    } else if (activeField && activeField.startsWith("stop-")) {
      const stopIndex = parseInt(activeField.split("-")[1], 10) - 1;
      updatedStops[stopIndex] = suggestion?.shortAddress;
      setStops(updatedStops);
      coordset(suggestion?.detailAddress);
    }

    setTimeout(() => {
      const areAllStopsFilled = updatedStops?.every((stop) => stop?.trim()?.length > 0);
      const isPickupFilled = pickupLocation?.trim()?.length > 0 || activeField === "pickupLocation";
      const isDestinationFilled = destination?.trim()?.length > 0 || activeField === "destination";

      if (isPickupFilled && isDestinationFilled && areAllStopsFilled) {
      }
    }, 100);
  };

  useEffect(() => {
    fetchAddressSuggestions(addressData);
  }, [addressData]);

  useEffect(() => {
    let length = 0;
    let addressData = "";

    if (activeField === "pickupLocation") {
      length = pickupLocation?.length;
      addressData = pickupLocation;
    } else if (activeField === "destination") {
      length = destination?.length;
      addressData = destination;
    } else if (activeField && activeField.startsWith("stop-")) {
      const stopIndex = parseInt(activeField.split("-")[1], 10) - 1;
      const stopData = stops[stopIndex];
      if (stopData !== undefined) {
        length = stopData?.length;
        addressData = stopData;
      }
    }
    setAddressData(addressData);
    setFieldLength(length);
  }, [activeField, stops, pickupLocation, destination]);

  const coordsData = async () => {
    const geocodeAddress = async (address) => {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            address
          )}&key=${Google_Map_Key}`
        );
        const dataMap = await response.json();
        if (dataMap?.results.length > 0) {
          const location = dataMap?.results[0].geometry.location;
          return {
            latitude: location?.lat,
            longitude: location?.lng,
          };
        }
      } catch (error) {
        console.error("Error geocoding address:", error);
      }
      return null;
    };

    const fetchCoordinates = async () => {
      try {
        const pickup = await geocodeAddress(pickupLocation);
        if (pickup?.latitude && pickup?.longitude) {
          dispatch(userZone({ lat: pickup?.latitude, lng: pickup?.longitude }));
          setIsInitialFetchDone(true);
        }
      } catch (error) {
        console.error("Error fetching coordinates:", error);
      } finally { }
    };
    fetchCoordinates();
  };

  const getVehicleTypes = () => {
    if (!pickupCoords || !destinationCoords) {
      console.warn("Coordinates not ready yet. Please wait.");
      return;
    }


    const rawLocations = [
      pickupCoords,
      ...(stopCoords || []), 
      destinationCoords,
    ];

    const filteredLocations = rawLocations
      .filter(coord => coord && coord?.lat != null && coord?.lng != null)
      .map(coord => ({
        lat: coord?.lat,
        lng: coord?.lng,
      }));

    const getFormattedTime = (date) => {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    };

    const now = new Date();


    const payload = {
      locations: filteredLocations,
      service_id: service_ID,
      service_category_id: service_category_ID,
      current_time: getFormattedTime(now),
    };


    if (service_name == "cab") {
      dispatch(vehicleTypeDataGet(payload)).then((res) => {
        if (service_name === "cab") {
          if (
            pickupLocation &&
            destinationFullAddress &&
            Object.keys(pickupLocation).length > 0 &&
            Object.keys(destinationFullAddress).length > 0
          ) {
            const locationData = {
              destinationFullAddress,
              stops,
              pickupLocation,
              service_ID,
              zoneValue,
              scheduleDate,
              service_category_ID,
              service_name,
              filteredLocations,
              pickupCoords,
              destinationCoords
            };
            setValue("locations", JSON.stringify(locationData));
          }

          navigate("BookRide", {
            destination,
            stops,
            pickupLocation,
            service_ID,
            zoneValue,
            scheduleDate,
            service_category_ID,
            service_name,
            filteredLocations,
            pickupCoords,
            destinationCoords
          });
          setProceedLoading(false);
        }
      });
    } else if (service_name == "freight" || service_name == "parcel") {
      navigate("Outstation", {
        destination,
        stops,
        pickupLocation,
        service_ID,
        zoneValue,
        service_name,
        service_category_ID,
        scheduleDate,
        filteredLocations
      });
      setProceedLoading(false);
    }
  };

  useEffect(() => {
    if (zoneValue && isInitialFetchDone) {
      gotoNext();
    }
  }, [zoneValue]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const toRadians = (degree) => (degree * Math.PI) / 180;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const outOfCity = () => {
    Alert.alert(`${translateData.outOfCity}`, `${translateData.outOfCityDes}`);
    setProceedLoading(false)
  };

  const insideCity = () => {
    Alert.alert(
      `${translateData.insideCity}`,
      `${translateData.insideCityDes}`
    );
    setProceedLoading(false)
  };

  const rideBooking = async () => {
    let token = "";
    await getValue("token").then(function (value) {
      token = value;
    });
    if (token) {

      if (destination && destination.trim().length > 0) {
        let suggestion = {
          shortAddress: destination.trim(),
          detailAddress: destination.trim()
        }
        try {
          const stored = await getValue("locations");
          let storedLocations = JSON.parse(stored) || [];

          const alreadyExists = storedLocations.some(
            (loc) => loc.shortAddress.trim().toLowerCase() === suggestion.shortAddress.trim().toLowerCase()
          );

          if (!alreadyExists) {
            storedLocations.push(suggestion);
            if (storedLocations.length > 5) {
              storedLocations.shift();
            }
          } else { }
        } catch (error) {
          console.error("Error handling locations:", error);
        }
      }

      if (!destination || !pickupLocation) {
        setModalVisible(true);
      } else {
        coordsData();
      }
    } else {
      let screenName = "LocationDrop";
      setValue("CountinueScreen", screenName);
      replace("SignIn");
    }
  };

  const gotoBook = async () => {
    if (isProcessing) return;

    setProceedLoading(true);
    setIsProcessing(true);

    try {
      if (
        !pickupCoords?.lat || !pickupCoords?.lng ||
        !destinationCoords?.lat || !destinationCoords?.lng
      ) {
        console.warn("Invalid or missing coordinates. Please select valid locations.");
        setProceedLoading(false);
        setIsProcessing(false);
        return;
      }

      const isSchedule = [
        "schedule", "schedule-parcel", "schedule-freight"
      ].includes(service_category_slug) || field === "schedule";

      if (isSchedule) {
        if (!scheduleDate?.DateValue || !scheduleDate?.TimeValue) {
          setProceedLoading(false);
          setDateError(true);
          return;
        } else {
          setDateError(false);
        }
      }

      const distance = calculateDistance(
        pickupCoords?.lat,
        pickupCoords?.lng,
        destinationCoords?.lat,
        destinationCoords?.lng
      );

      if (['intercity', 'intercity-freight', 'intercity-parcel'].includes(service_category_slug)) {
        distance < minRadiusKm ? insideCity() : rideBooking();
      } else if (['ride', 'ride-freight', 'ride-parcel'].includes(service_category_slug)) {
        distance > minRadiusKm ? outOfCity() : rideBooking();
      } else if (['schedule', 'package', 'schedule-freight', 'schedule-parcel'].includes(service_category_slug)) {
        rideBooking();
      }

    } catch (error) {
      console.error('Error in gotoBook:', error);
      setProceedLoading(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const gotoNext = () => {
    getVehicleTypes();
  };

  const gotoSelection = () => {
    navigate('LocationSelect', { field: activeField, screenValue: 'Ride', service_ID: service_ID, service_name: service_name, service_category_ID: service_category_ID, service_category_slug: service_category_slug, formattedDate: formattedDate, formattedTime: formattedTime });
  };

  const gotoSaveLocation = async () => {
    let token = '';
    await getValue('token').then(function (value) {
      token = value;
    });

    if (token) {
      navigate("SavedLocation", { selectedLocation: 'locationDrop', savefield: activeField, service_ID: service_ID, service_name: service_name, service_category_ID: service_category_ID, service_category_slug: service_category_slug, formattedDate: formattedDate, formattedTime: formattedTime });
    } else {
      let screenName = "LocationDrop";
      if (settingData?.values?.activation?.login_number == 1) {
        setValue("CountinueScreen", screenName);
        replace("SignIn");
      } else if (settingData?.values?.activation?.login_number == 0) {
        setValue("CountinueScreen", screenName);
        replace("SignInWithMail");
      }
      else {
        replace("SignIn");
      }
    }
  };

  useEffect(() => {
    if (fieldValue === "pickupLocation") {
      setPickupLocation(selectedAddress);
      setPickupCoords({ lat: pinLatitude, lng: pinLongitude })
    } else if (fieldValue === "destination") {
      setDestination(selectedAddress);
      setDestinationCoords({ lat: pinLatitude, lng: pinLongitude })
    } else if (fieldValue && fieldValue.startsWith("stop-")) {
      const stopIndex = parseInt(fieldValue.split("-")[1], 10) - 1;
      const updatedStops = [...stops];
      updatedStops[stopIndex] = selectedAddress;
      setStops(updatedStops);
    }
  }, [selectedAddress, fieldValue, pinLatitude, pinLongitude]);


  const renderItemRecentData = ({ item: suggestion, index }) => {
    return (
      <View style={styles.renderItemRecentView}>
        <TouchableOpacity
          activeOpacity={0.7}
          key={index}
          style={[styles.historyBtn, { flexDirection: viewRTLStyle }]}
          onPress={() => handleRecentClick(suggestion?.destinationFullAddress)}
        >
          <View
            style={[
              styles.historyView,
              {
                backgroundColor: isDark
                  ? appColors.darkBorder
                  : appColors.lightGray,
              },
            ]}
          >
            <History />
          </View>
          <View>
            <Text
              style={[
                styles.locationText,
                { color: textColorStyle },
                { textAlign: textRTLStyle },
              ]}
            >
              {suggestion?.destinationFullAddress?.shortAddress?.length > 30
                ? `${suggestion?.destinationFullAddress?.shortAddress.slice(0, 30)}...`
                : suggestion?.destinationFullAddress?.shortAddress}
            </Text>
            <Text
              style={[
                styles.titleTextDetail,
                {
                  textAlign: textRTLStyle,
                  marginHorizontal: windowWidth(10),
                },
              ]}
            >
              {suggestion?.destinationFullAddress?.detailAddress?.length > 30
                ? `${suggestion?.destinationFullAddress?.detailAddress.slice(0, 30)}...`
                : suggestion?.destinationFullAddress?.detailAddress}
            </Text>
          </View>
        </TouchableOpacity>
        {index !== recentDatas.length - 1 && (
          <View
            style={[
              styles.bottomLine,
              {
                borderColor: isDark
                  ? appColors.darkBorder
                  : appColors.lightGray,
              },
            ]}
          />
        )}
      </View>
    );
  };
  const addStop = () => {
    if (stops.length < 3) {
      setStops(prevStops => [...prevStops, ""]);
    }
  };

  const removeStop = (index) => {
    const updatedStops = stops.filter((_, i) => i !== index);
    setStops(updatedStops);

    if (updatedStops.length === 0) {
      setActiveField("destination");
    } else if (index === stops.length - 1) {
      setActiveField(`stop-${updatedStops.length}`);
    }
  };

  const handleInputChange = (text, id) => {
    if (id === 1) {
      setPickupLocation(text);
    } else if (id === 2) {
      setDestination(text);
    } else {
      const updatedStops = stops?.map((stop, index) =>
        index + 3 === id ? text : stop
      );
      setStops(updatedStops);
    }
  };

  const handleFocus = (id) => {
    if (id === 1) {
      setActiveField("pickupLocation");
    } else if (id === 2) {
      setActiveField("destination");
      setIsdesFocused(true);
    } else {
      setActiveField(`stop-${id - 2}`);
    }
  };
  const handleBlur = () => {
    setActiveField(null);
  };

  const handleCloseStop = (index) => {
    const updatedStops = [...stops];
    updatedStops[index] = "";
    setStops(updatedStops);
    setIsProcessing(false);
  };

  const handleClosepickup = () => {
    setPickupLocation("");
    setIsProcessing(false);
  };

  const handleCloseDestination = () => {
    setDestination("");
  };

  const handlePress = () => {
    if (pickupRef.current) {
      pickupRef.current.focus();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.main} >
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.main}>
          <ScrollView
            style={[styles.main, { backgroundColor: linearColorStyle }]}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View>
              <Header
                value={translateData.location}
                backgroundColor={
                  isDark ? appColors.darkPrimary : appColors.whiteColor
                }
              />
              <View
                style={[
                  styles.horizontalView,
                  {
                    backgroundColor: isDark
                      ? appColors.darkPrimary
                      : appColors.whiteColor,
                  },
                ]}
              >
                <View style={styles.pickupdetailsView}>
                  <View
                    style={[
                      styles.containers,
                      {
                        backgroundColor: isDark ? appColors.darkPrimary : appColors.lightGray,
                        borderColor: isDark ? appColors.darkBorder : appColors.border,
                      },
                    ]}
                  >
                    <View
                      contentContainerStyle={styles.scrollContainer}
                      keyboardShouldPersistTaps="handled"
                    >
                      <Pressable onPress={handlePress}>
                        <View style={[styles.inputContainer, { flexDirection: viewRTLStyle }]}>
                          <View
                            style={[
                              styles.iconContainer,
                              { backgroundColor: isDark ? appColors.darkPrimary : appColors.lightGray },
                            ]}
                          >
                            <Gps width={20} height={20} />
                          </View>
                          <TouchableOpacity onPress={handlePress} style={{ flex: 1, zIndex: 3 }}>
                            <View
                              style={[styles.inputWithIcons, { flexDirection: viewRTLStyle }]}
                            >
                              <TextInput
                                ref={pickupRef}
                                style={[
                                  styles.input,
                                  {
                                    color: isDark ? appColors.whiteColor : appColors.primaryText,
                                  },
                                  { textAlign: textRTLStyle },
                                ]}
                                placeholderTextColor={isDark ? appColors.darkText : appColors.regularText}
                                placeholder={translateData.pickupLocationTittle}
                                value={pickupLocation}
                                onChangeText={(text) => {
                                  handleInputChange(text, 1);
                                  setWasAutoFilled(false);
                                }}
                                onFocus={() => {
                                  handleFocus(1);
                                }}
                                onBlur={() => {
                                  handleBlur();
                                }}
                              />
                            </View>
                          </TouchableOpacity>
                          {pickupLocation?.length >= 1 && (
                            <TouchableOpacity onPress={handleClosepickup} activeOpacity={0.7}
                            >
                              <Close />
                            </TouchableOpacity>
                          )}
                        </View>
                      </Pressable>
                      <View
                        style={{
                          borderColor: isDark ? appColors.darkBorder : appColors.border,
                          borderBottomWidth: windowHeight(0.3),
                          width: "86%",
                          marginHorizontal: isRTL ? windowHeight(8) : windowHeight(29),
                        }}
                      />
                      <View
                        style={[
                          styles.line2,
                          {
                            borderColor: isDark
                              ? appColors.regularText
                              : appColors.blackColor,
                          },
                          { left: isRTL ? "96%" : windowHeight(9.9) },
                        ]}
                      />
                      {stops?.map((stop, index) => (
                        <View
                          key={index + 3}
                          style={[
                            styles.inputContainer,
                            index === stops.length - 1 ? {} : { marginBottom: 8 },
                            { flexDirection: viewRTLStyle },
                          ]}
                        >
                          <View style={styles.iconContainer}>
                            <View
                              style={[
                                styles.numberContainer,
                                {
                                  backgroundColor: isDark
                                    ? appColors.whiteColor
                                    : appColors.blackColor,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.numberText,
                                  {
                                    color: isDark
                                      ? appColors.blackColor
                                      : appColors.whiteColor,
                                  },
                                ]}
                              >
                                {index + 1}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.inputWithIcons}>
                            <TouchableOpacity onPress={handlePress} style={{ flex: 1, zIndex: 3, width: windowWidth(250) }}>
                              <TextInput
                                style={[

                                  styles.input,
                                  {
                                    color: isDark
                                      ? appColors.whiteColor
                                      : appColors.primaryText,
                                  },
                                  { textAlign: textRTLStyle },
                                  { left: isRTL ? windowHeight(55) : windowHeight(0) },

                                  index === stops.length - 1
                                    ? {}
                                    : {
                                      borderBottomWidth: windowHeight(0.9),
                                      borderBottomColor: isDark
                                        ? appColors.darkBorder
                                        : appColors.border,
                                    },
                                  { textAlign: textRTLStyle },
                                  {
                                    borderColor: isDark
                                      ? appColors.darkBorder
                                      : appColors.border,
                                  },
                                ]}
                                placeholderTextColor={
                                  isDark ? appColors.darkText : appColors.regularText
                                }
                                placeholder={translateData.addStopPlaceHolderText}
                                value={stop}
                                onChangeText={(text) => handleInputChange(text, index + 3)}
                                onFocus={() => {
                                  handleFocus(index + 3);
                                }}
                                onBlur={handleBlur}
                                onPress={handlePress}
                              />
                            </TouchableOpacity>
                            <View
                              style={[
                                styles.addButton,
                                { flexDirection: viewRTLStyle },
                                { right: isRTL ? "85%" : windowHeight(6) },
                              ]}
                            >
                              {stops[index]?.trim() !== "" && (
                                <TouchableOpacity onPress={() => handleCloseStop(index)} activeOpacity={0.7}>
                                  <Close />
                                </TouchableOpacity>
                              )}
                              {index === stops.length - 1 && (
                                <>
                                  <View style={styles.iconSpacing} />
                                  <TouchableOpacity onPress={() => removeStop(index)} activeOpacity={0.7}>
                                    <Minus colors={textColorStyle} width={20} height={20} />
                                  </TouchableOpacity>
                                </>
                              )}
                            </View>
                          </View>
                          {index < stops.length && (
                            <View
                              style={[
                                styles.line,
                                { borderColor: appColors.regularText },
                                { left: isRTL ? "96%" : 12 },
                              ]}
                            />
                          )}
                        </View>
                      ))}

                      <View style={[styles.inputContainer, { flexDirection: viewRTLStyle }]}>
                        <View
                          style={[
                            styles.iconContainer,
                            { backgroundColor: isDark ? appColors.darkPrimary : appColors.lightGray },
                          ]}
                        >
                          <PickLocation width={20} height={20} />
                        </View>
                        <View style={styles.inputWithIcons}>
                          <TouchableOpacity onPress={handlePress} style={{ flex: 1, zIndex: 3, width: windowWidth(280) }}>
                            <View style={styles.inputWidth}>
                              <TextInput
                                ref={destinationRef}
                                style={[
                                  styles.input,
                                  {
                                    color: isDark
                                      ? appColors.whiteColor
                                      : appColors.primaryText,
                                  },
                                  { textAlign: textRTLStyle },
                                  { left: isRTL ? windowHeight(55) : windowHeight(0) },
                                ]}
                                placeholderTextColor={
                                  isDark ? appColors.darkText : appColors.regularText
                                }
                                placeholder={translateData.enterDestinationPlaceholderText}
                                value={destination}
                                onChangeText={(text) => handleInputChange(text, 2)}
                                onFocus={() => {
                                  handleFocus(2);
                                }}
                                onPress={handlePress}
                                onBlur={handleBlur}

                              />
                            </View>
                          </TouchableOpacity>
                          <View
                            style={[
                              styles.addButton,
                              { flexDirection: viewRTLStyle },
                              { right: isRTL ? "85%" : windowHeight(6) },
                            ]}
                          >
                            {destination?.length >= 1 && (
                              <TouchableOpacity onPress={handleCloseDestination} activeOpacity={0.7}>
                                <Close />
                              </TouchableOpacity>
                            )}
                            {stops.length < 3 && (
                              <>
                                <View style={styles.iconSpacing} />
                                <TouchableOpacity onPress={addStop} activeOpacity={0.7}>
                                  <Add colors={textColorStyle} width={20} height={20} />
                                </TouchableOpacity>
                              </>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
                {(service_category_slug === "schedule" || field === "schedule" || service_category_slug === "schedule-parcel" || service_category_slug === "schedule-freight") && (
                  <TouchableOpacity activeOpacity={0.9} onPress={() =>
                    navigate("Calander", {
                      fieldValue: "Ride",
                      service_ID: service_ID,
                      service_name: service_name,
                      categoryId: service_category_ID,
                      service_category_slug: service_category_slug,
                      DateValue: formattedDate,
                      TimeValue: formattedTime,
                    })
                  }>
                    <InputText
                      borderColor={isDark ? appColors.darkBorder : appColors.border}
                      backgroundColor={isDark ? appColors.darkPrimary : appColors.lightGray}
                      placeholder={translateData.DateandTextTime}
                      rightIcon={<Calender />}
                      onPress={() =>
                        navigate("Calander", {
                          fieldValue: "Ride",
                          service_ID: service_ID,
                          service_name: service_name,
                          categoryId: service_category_ID,
                          service_category_slug: service_category_slug,
                          DateValue: formattedDate,
                          TimeValue: formattedTime,
                        })
                      }
                      editable={false}
                      value={`${DateValue || "Date"} ${TimeValue || "and Time"}`}
                      warningText={dateError ? 'Please Enter Date' : ''}
                    />
                  </TouchableOpacity>
                )}
                <View
                  style={[
                    external.fd_row,
                    external.js_space,
                    { flexDirection: viewRTLStyle },
                  ]}
                >
                  <TouchableOpacity
                    onPress={gotoSelection}
                    activeOpacity={0.7}
                    style={[
                      styles.locationBtn,
                      {
                        backgroundColor: isDark
                          ? appColors.lightPrimary
                          : appColors.selectPrimary,
                      },
                      { flexDirection: viewRTLStyle },
                    ]}
                  >
                    <View style={external.mh_5}>
                      <PickLocation />
                    </View>
                    <Text
                      style={[
                        styles.locationBtnText,
                        {
                          color: isDark
                            ? appColors.whiteColor
                            : appColors.blackColor,
                        },
                      ]}
                    >
                      {translateData?.locateonmap}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={gotoSaveLocation}
                    activeOpacity={0.7}
                    style={[
                      styles.locationBtn,
                      { backgroundColor: appColors.primary },
                      { flexDirection: viewRTLStyle },
                    ]}
                  >
                    <View style={external.mh_5}>
                      <Save />
                    </View>
                    <Text
                      style={[
                        styles.locationBtnText,
                        { color: appColors.whiteColor },
                      ]}
                    >
                      {translateData?.savedLocation}
                    </Text>
                  </TouchableOpacity>
                </View>
                {visible && (
                  <Animated.View
                    style={[styles.bar, { transform: [{ translateX }] }]}
                  />
                )}
              </View>
            </View>
            <View style={{ marginTop: windowHeight(35), bottom: windowHeight(20) }}>
              {(service_category_slug === "intercity" || service_category_slug === "schedule") && (
                <View style={styles.viewContainerToll}>
                  <Driving />
                  <Text style={styles.fareStyle}>{translateData.note}</Text>
                </View>
              )}
            </View>
            <View style={[styles.recentView, { height: windowHeight(320), backgroundColor: isDark ? appColors.bgDark : appColors.lightGray }, { bottom: windowHeight(22) }]}>
              <Text
                style={[
                  commonStyles.mediumText23,
                  { color: textColorStyle, textAlign: textRTLStyle },
                ]}
              >
                {fieldLength >= 3
                  ? translateData.addressSuggestion
                  : 'Recent Search'}
              </Text>
              <View
                style={[
                  styles.mapView,
                  {
                    backgroundColor: isDark
                      ? appColors.darkPrimary
                      : appColors.whiteColor,
                  },
                  {
                    borderColor: isDark
                      ? appColors.darkBorder
                      : appColors.border,
                  },
                ]}
              >
                {suggestions.length >= 3 ? (
                  suggestions?.map((suggestion, index) => (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.suggestionsView,
                        {
                          flexDirection: viewRTLStyle,
                        },
                      ]}
                      key={index}
                      onPress={() => handleSuggestionClick(suggestion)}
                    >
                      <View
                        style={[
                          styles.addressMArker,
                          {
                            backgroundColor: isDark
                              ? appColors.bgDark
                              : appColors.lightGray,
                          },
                        ]}
                      >
                        <AddressMarker />
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '90%' }}>
                        <View>
                          <View
                            style={[
                              { flexDirection: viewRTLStyle },
                              styles.spaceing,
                            ]}
                          >
                            <View>
                              <Text
                                style={[
                                  styles.titleText,
                                  {
                                    color: textColorStyle,
                                    textAlign: textRTLStyle,
                                  },
                                ]}
                              >
                                {suggestion?.shortAddress}
                              </Text>
                              <Text
                                style={[
                                  styles.titleTextDetail,
                                  {
                                    textAlign: textRTLStyle,
                                  },
                                ]}
                              >
                                {suggestion?.detailAddress}
                              </Text>
                            </View>
                          </View>
                          {index !== suggestions.length - 1 ? (
                            <View style={{ alignSelf: "center" }}>
                              <SolidLine color={bgFullLayout} />
                            </View>
                          ) : null}
                        </View>
                        <View style={{ justifyContent: 'center' }}>
                          <Text style={{ fontFamily: appFonts.medium, color: appColors.primary, width: windowWidth(70) }}>
                            {(
                              taxidoSettingData?.taxido_values?.ride?.distance_unit?.toLowerCase() === 'mile'
                                ? (parseFloat(suggestion?.distanceKm) || 0) * 0.621371
                                : (parseFloat(suggestion?.distanceKm) || 0)
                            ).toFixed(2)}
                          </Text>
                          <Text style={{ fontFamily: appFonts.medium, color: appColors.primary, width: windowWidth(60) }}>{taxidoSettingData?.taxido_values?.ride?.distance_unit}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : Array.isArray(recentDatas) && recentDatas.length > 0 ? (
                  <FlatList
                    data={recentDatas}
                    keyboardShouldPersistTaps="handled"
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderItemRecentData}
                  />
                ) : (
                  <View style={styles.addressItemView}>
                    <Text
                      style={[
                        styles.noAddressText,
                        {
                          color: textColorStyle,
                        },
                      ]}
                    >
                      {translateData.noAddressFound}
                    </Text>
                  </View>
                )}
              </View>

            </View>
            <View style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: 16,
              backgroundColor: isDark ? appColors.darkPrimary : appColors.whiteColor,
              borderTopWidth: 1,
              borderColor: isDark ? appColors.darkBorder : appColors.border,
            }}>
              <Button
                title={translateData.proceed}
                onPress={gotoBook}
                disabled={isProcessing}
                loading={proceedLoading}
              />
            </View>
            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalText}>
                    {translateData.bookingNote}
                  </Text>
                  <Button
                    title={translateData.close}
                    onPress={() => setModalVisible(false)}
                  />
                </View>
              </View>
            </Modal>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}