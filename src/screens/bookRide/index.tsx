import { Text, View, FlatList, TouchableOpacity, TextInput, Image, Pressable, BackHandler, Modal, ActivityIndicator, PermissionsAndroid, Alert, Keyboard, AppState, Vibration } from 'react-native';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { commonStyles } from '../../styles/commonStyle';
import { external } from '../../styles/externalStyle';
import { Button, notificationHelper, RadioButton, SolidLine } from '@src/commonComponent';
import { styles } from './styles';
import { BookRideItem } from './bookRideItem/index';
import { ModalContainers } from './modalContainer/index';
import { useValues } from '../../../App';
import { appColors, windowWidth } from '@src/themes';
import { fontSizes, windowHeight } from '@src/themes';
import { Back, NewContact, UserFill, Forword, Card, User, Close, CloseCircle, Coupon } from '@utils/icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CancelRender } from '../cancelFare/cancelRenderItem/index';
import { useDispatch, useSelector } from 'react-redux';
import { allDriver, allRides, couponVerifyData, userSaveLocation } from '../../api/store/actions/index';
import { WebView } from 'react-native-webview';
import { AppDispatch } from '../../api/store/index';
import { updateRideRequest } from '../../api/store/actions/index';
import { clearValue, getValue } from '@src/utils/localstorage';
import { appFonts } from '@src/themes';
import Images from '@src/utils/images';
import { useAppNavigation } from '@src/utils/navigation';
import FastImage from 'react-native-fast-image';
import { URL } from '@src/api/config';
import { noserviceData } from '@src/data/unavailableVehicleData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomSheet, { BottomSheetModal, BottomSheetView, BottomSheetModalProvider, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, getDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { firebaseConfig } from '../../../firebase';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


export function BookRide() {
    const navigation = useNavigation();
    const route = useRoute();
    const { pickupLocation, stops, destination, service_ID, zoneValue, service_name, service_category_ID, receiverName, countryCode, phoneNumber, scheduleDate, filteredLocations, descriptionText, otherContect, otherName, pickupCoords, destinationCoords } = route.params;
    const { textColorStyle, bgContainer, textRTLStyle, isDark, viewRTLStyle, Google_Map_Key } = useValues();
    const { selectedImage, parcelWeight } = route.params;
    const [mapType, setMapType] = useState('googleMap');
    const { translateData, taxidoSettingData, settingData } = useSelector(state => state.setting);
    const dispatch = useDispatch<AppDispatch>();
    const { navigate, goBack } = useAppNavigation();
    const [seletedPayment, setSeletedPayment] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedItemData, setSelectedItemData] = useState(null);
    const [isChecked, setIsChecked] = useState(true);
    const [stopsCoords, setStopsCoords] = useState<Array<{ lat: number; lng: number }>>([]);
    const [loading, setLoading] = useState(true);
    const [serviceVisible, setServiceVisible] = useState(false);
    const ZoneArea = zoneValue?.locations || null;
    const { driverData } = useSelector(state => state.allDriver);
    const { vehicleTypedata } = useSelector(state => state?.vehicleType || {});
    const activePaymentMethods = zoneValue?.payment_method;
    const [fareValue, setFareValue] = useState(0);
    const [Warning, setWarning] = useState(false);
    const [distance, setDistance] = useState(false);
    const [isExpanding, setIsExpanding] = useState(false);
    const [warningMessage, setWarningMessage] = useState();
    const [rideID, setRideId] = useState(null);
    const [driverId, setDriverId] = useState([]);
    const [riderequestId, setRideRequestId] = useState();
    const mapRef = useRef(null);
    const [bookLoading, setBookLoading] = useState(false);
    const pulseCount = 6;
    const pulseDelay = 20;
    const durations = 120;
    const [pulses, setPulses] = useState(Array(pulseCount).fill({ radius: 1000, opacity: 0 }),);
    const animationRef = useRef<NodeJS.Timeout | null>(null);
    const [isPulsing, setIsPulsing] = useState(false);
    const TIMER_DURATION = taxidoSettingData?.taxido_values?.ride?.find_driver_time_limit * 60 * 1000;
    const [remainingTime, setRemainingTime] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const intervalTimeRef = useRef<NodeJS.Timeout | null>(null);
    const [currentNearestDriver, setCurrentNearestDriver] = useState([]);
    const dataList = vehicleTypedata && vehicleTypedata.length > 0 ? vehicleTypedata : noserviceData;
    const [isValid, setIsValid] = useState(true);
    const [coupon, setCoupon] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [inputValue, setInputValue] = useState(coupon?.code || '');
    const increaseAmount = parseFloat(taxidoSettingData?.taxido_values?.ride?.increase_amount_range ?? 10);
    const minFare = parseFloat(selectedItemData?.charges?.total ?? 0);
    const maxPercentage = parseFloat(taxidoSettingData?.taxido_values?.ride?.max_bidding_fare_driver ?? 0);
    const maxFare = minFare + (minFare * maxPercentage / 100);
    const numericFare = parseFloat(fareValue) || minFare;
    const [couponValue, setCouponValue] = useState();
    const [finalPrices, setFinalPrices] = useState({});
    const [selectedFinalPrice, setSelectedFinalPrice] = useState('');
    const mainSheetRef = useRef<BottomSheetModal>(null);
    const vehicleDetailsSheetRef = useRef<BottomSheetModal>(null);
    const noVehicleSheetRef = useRef<BottomSheetModal>(null);
    const cancelConfirmationSheetRef = useRef<BottomSheetModal>(null);
    const paymentSheetRef = useRef<BottomSheet>(null);
    const riderSheetRef = useRef<BottomSheetModal>(null);
    const couponsSheetRef = useRef<BottomSheetModal>(null);
    const [mapBottomPadding, setMapBottomPadding] = useState(0);
    const mainSnapPoints = useMemo(() => {
        const bidding = Number(taxidoSettingData?.taxido_values?.activation?.bidding ?? 0);
        return bidding === 0 ? ['30%', '38%'] : ['42%', '49%'];
    }, [taxidoSettingData?.taxido_values?.activation?.bidding]);
    const vehicleDetailSnapPoints = useMemo(() => ['90%'], []);
    const noVehicleSnapPoints = useMemo(() => ['30%'], []);
    const cancelConfirmationSnapPoints = useMemo(() => ['30%'], []);
    const paymentSnapPoints = useMemo(() => ['60%'], []);
    const riderSnapPoints = useMemo(() => ['40%'], []);
    const couponsSnapPoints = useMemo(() => ['23%'], []);
    const webViewRef = useRef(null);


    useEffect(() => {
        dispatch(userSaveLocation());
    }, [])

    const sendToWebView = (action, data = {}) => {
        const payload = JSON.stringify({ action, ...data });
        webViewRef.current?.postMessage(payload);
    };

    useEffect(() => {
        if (pickupCoords && destinationCoords) {
            sendToWebView('setMarkers', {
                pickup: pickupCoords,
                destination: destinationCoords,
                apiKey: Google_Map_Key,
            });
        }
    }, [pickupCoords, destinationCoords]);


    useEffect(() => {
        const backAction = () => {
            navigation.navigate('MyTabs');
            return true;
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, []);

    useEffect(() => {
        if (selectedItemData?.id && finalPrices[selectedItemData.id]) {
            setSelectedFinalPrice(`${finalPrices[selectedItemData.id]}`);
        }
    }, [selectedItemData, finalPrices]);

    const handleIncrease = () => {
        Vibration.vibrate(42);
        const newFare = numericFare + increaseAmount;

        if (newFare >= maxFare) {
            setFareValue(String(maxFare.toFixed(2))); // Snap directly to max
        } else {
            setFareValue(String(newFare.toFixed(2)));
        }
    };

    const handleDecrease = () => {
        Vibration.vibrate(42);
        const newFare = numericFare - increaseAmount;

        if (newFare <= minFare) {
            setFareValue(String(minFare.toFixed(2))); // Snap to min
        } else {
            setFareValue(String(newFare.toFixed(2)));
        }
    };

    const isPlusDisabled = numericFare >= maxFare;
    const isMinusDisabled = numericFare <= minFare;

    useEffect(() => {
        if (selectedItemData?.charges?.total) {
            setFareValue(selectedItemData.charges.total);
        }
    }, [selectedItemData]);


    useEffect(() => {
        setInputValue(coupon?.code || '');
    }, [coupon]);


    // Open the main bottom sheet once the map is loaded
    useEffect(() => {
        if (!loading) {
            setTimeout(() => {
                mainSheetRef.current?.present();
            }, 100);
        }
    }, [loading]);

    // Helper function to fit map to route with dynamic padding
    const fitMapToRoute = useCallback((bottomPadding = 0) => {
        if (mapRef.current && pickupCoords && destinationCoords) {
            const coordinates = [
                { latitude: pickupCoords.lat, longitude: pickupCoords.lng },
                ...stopsCoords.map(stop => ({
                    latitude: stop.lat,
                    longitude: stop.lng,
                })),
                { latitude: destinationCoords.lat, longitude: destinationCoords.lng },
            ];

            mapRef.current.fitToCoordinates(coordinates, {
                edgePadding: { top: 100, right: 50, bottom: bottomPadding + 50, left: 50 },
                animated: true,
            });
        }
    }, [pickupCoords, destinationCoords, stopsCoords]);

    // THIS IS THE NEW HANDLER FOR THE MAIN SHEET
    const handleMainSheetChange = useCallback(
        (index: number) => {
            if (index === 0) {
                mainSheetRef.current?.snapToIndex(1);
                return;
            }

            let padding = 0;
            if (index > 0) {
                const snapPoint = mainSnapPoints[index];
                if (typeof snapPoint === 'string' && snapPoint.endsWith('%')) {
                    padding = windowHeight * (parseInt(snapPoint, 10) / 100);
                } else if (typeof snapPoint === 'number') {
                    padding = snapPoint;
                }
            }
            setMapBottomPadding(padding);
        },
        [mainSnapPoints, windowHeight]
    );

    // THIS IS THE NEW HANDLER FOR THE PAYMENT SHEET
    const handlePaymentSheetChange = useCallback(
        (index: number) => {
            let padding = 0;
            if (index > -1) {
                const snapPoint = paymentSnapPoints[index];
                if (typeof snapPoint === 'string' && snapPoint.endsWith('%')) {
                    padding = windowHeight * (parseInt(snapPoint, 10) / 100);
                } else if (typeof snapPoint === 'number') {
                    padding = snapPoint;
                }
            }
            setMapBottomPadding(padding);
        },
        [paymentSnapPoints, windowHeight]
    );

    // Update map padding whenever it changes
    useEffect(() => {
        fitMapToRoute(mapBottomPadding);
    }, [mapBottomPadding, fitMapToRoute]);


    useEffect(() => {
        if (dataList.length > 0 && !selectedItem) {
            const firstItem = dataList[0];
            setSelectedItem(firstItem.id);
            setSelectedItemData(firstItem);

            if (taxidoSettingData?.taxido_values?.activation?.bidding == 0) {
                setFareValue(`${firstItem?.min_per_unit_charge * distance}`);
            }
        }
    }, [dataList, distance]);



    useEffect(() => {
        const toRad = (value) => (value * Math.PI) / 180;

        const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
            const R = 6371; // Earth radius in km
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(lat1)) *
                Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };
        let isCurrent = true; // to track latest fetch

        const fetchDrivers = async () => {
            try {
                setCurrentNearestDriver([]);

                // 🔹 Reference Firestore collection
                const snapshot = await getDocs(collection(db, "driverTrack"));

                const filteredDrivers: any[] = [];

                snapshot.forEach(doc => {
                    const data = doc.data();

                    if (
                        data.is_online === "1" &&
                        data.vehicle_type_id === selectedItem &&
                        data.lat &&
                        data.lng
                    ) {
                        const driverLat = parseFloat(data.lat);
                        const driverLng = parseFloat(data.lng);

                        const distanceInKm = getDistanceFromLatLonInKm(
                            pickupCoords?.lat,
                            pickupCoords?.lng,
                            driverLat,
                            driverLng
                        );

                        if (distanceInKm <= 3) {
                            filteredDrivers.push({ id: doc.id, ...data });
                        }
                    }
                });

                setCurrentNearestDriver(filteredDrivers);
            } catch (error) {
            }
        };

        if (pickupCoords?.lat && pickupCoords?.lng) {
            fetchDrivers();
        }

        return () => {
            isCurrent = false;
        };
    }, [selectedItem, pickupCoords?.lat, pickupCoords?.lng]);

    const timerCancelledRef = useRef(false);
    const startTimer = async () => {
        await AsyncStorage.setItem('ride_timer_start', Date.now().toString());
        setIsTimerRunning(true);
        timerCancelledRef.current = false; // reset cancel flag
        checkTimer(); // run immediately
        intervalTimeRef.current = setInterval(checkTimer, 1000);
    };

    const cancelTimer = async () => {
        setIsPulsing(false);
        timerCancelledRef.current = true; // prevent auto cancel after nav

        if (intervalTimeRef.current) {
            clearInterval(intervalTimeRef.current);
            intervalTimeRef.current = null;
        }

        await AsyncStorage.removeItem('ride_timer_start');
        setIsTimerRunning(false);
        setRemainingTime(0);
        setIsExpanding(false);
    };

    const handleTimerComplete = async () => {
        if (timerCancelledRef.current) return;

        handleCancelRide();
        await stopPulseAnimation();
        setBookLoading(false);

        notificationHelper(
            '',
            'No drivers were found. Your ride has been automatically cancelled.',
            'info'
        );

        if (riderequestId) {
            dispatch(updateRideRequest({ payload: { status: "cancelled" }, ride_id: riderequestId }));
        }
    };

    const checkTimer = async () => {
        if (timerCancelledRef.current) return;

        const storedStart = await AsyncStorage.getItem('ride_timer_start');
        if (storedStart) {
            const elapsed = Date.now() - parseInt(storedStart, 10);
            const remaining = TIMER_DURATION - elapsed;

            if (remaining <= 0) {
                setRemainingTime(0);
                await handleTimerComplete();
            } else {
                setRemainingTime(remaining);
            }
        }
    };

    useEffect(() => {
        const listener = AppState.addEventListener('change', nextState => {
            if (nextState === 'active') {
                checkTimer();
            }
        });

        return () => {
            listener.remove();
            if (intervalTimeRef.current) {
                clearInterval(intervalTimeRef.current);
            }
        };
    }, []);

    const minutes = Math.floor(remainingTime / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);

    const renderItemRequest = ({ item }) => (
        <CancelRender item={item} pickupLocation={pickupLocation} />
    );

    const formatScheduleDate = ({ DateValue, TimeValue }) => {
        if (!DateValue || !TimeValue) return '';
        const [day, month, year] = DateValue.split(' ');
        const monthMap = {
            Jan: 1,
            Feb: 2,
            Mar: 3,
            Apr: 4,
            May: 5,
            Jun: 6,
            Jul: 7,
            Aug: 8,
            Sep: 9,
            Oct: 10,
            Nov: 11,
            Dec: 12,
        };
        const monthIndex = monthMap[month];
        if (!monthIndex) {
            return translateData.bookRideInvalidDate;
        }

        const timeParts = TimeValue.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/);
        if (!timeParts) {
            return translateData.bookRideInvalidTime;
        }

        let [_, hours, minutes, period] = timeParts;
        hours =
            period === 'PM' && hours !== '12'
                ? +hours + 12
                : hours === '12' && period === 'AM'
                    ? '00'
                    : hours;
        const formattedDate = `${year}-${String(monthIndex).padStart(
            2,
            '0',
        )}-${String(day).padStart(2, '0')} ${String(hours).padStart(
            2,
            '0',
        )}:${minutes}`;
        return formattedDate;
    };

    const scheduleDates = {
        DateValue: scheduleDate?.DateValue,
        TimeValue: scheduleDate?.TimeValue,
    };


    useEffect(() => {
        if (vehicleTypedata?.length > 0) {
            setSelectedItem(vehicleTypedata[0].id);
        }
    }, [vehicleTypedata]);

    const allLocations = [pickupLocation, ...(stops || []), destination];
    const allLocationCoords = [pickupCoords, ...stopsCoords, destinationCoords];
    const selectedVehicleData = Array.isArray(vehicleTypedata)
        ? vehicleTypedata.find(item => item?.id === selectedItem)
        : null;
    const minimumCharge = selectedVehicleData?.min_per_unit_charge || null;
    const minChargeRide = minimumCharge * distance;

    useEffect(() => {
        if (!Array.isArray(ZoneArea) || ZoneArea.length < 2) {
            setServiceVisible(true);
        }
    }, [ZoneArea]);

    const driverLocations = driverData?.data
        ?.map(driver => {
            const driverLocation = driver.location?.[0];
            if (driverLocation) {
                return {
                    lat: parseFloat(driverLocation.lat),
                    lng: parseFloat(driverLocation.lng),
                    id: driver.id,
                    name: driver.name,
                    vehicleId: driver?.vehicle_info?.vehicle_type_id,
                };
            }
            return null;
        })
        ?.filter(driver => driver !== null);

    const filteredDrivers = selectedVehicleData
        ? driverLocations?.filter(
            driver => driver?.vehicleId === selectedVehicleData?.id,
        )
        : [];

    const handlePress = () => {
        const payload = {
            coupon: inputValue,
            service_id: service_ID,
            vehicle_type_id: selectedItemData?.vehicle_type_zone?.vehicle_type_id,
            locations: filteredLocations,
            service_category_id: service_category_ID.toString(),
            weight: parcelWeight
        };

        dispatch(couponVerifyData(payload)).then((res: any) => {

            if (res.payload?.success !== true) {
                notificationHelper("", res?.payload?.message, "error")
            } else {
                setCouponValue(res?.payload)
                const isCouponValid = coupon && coupon.code === inputValue;
                setIsValid(isCouponValid);
                if (isCouponValid) {
                    const totalBill = selectedItemData?.charges?.sub_total
                    Math.round(settingData?.values?.activation?.platform_fees);
                    if (totalBill < coupon?.min_spend) {
                        setSuccessMessage(
                            `${translateData.minimumSpend} ${coupon?.min_spend} ${translateData.requiredCoupons}`,
                        );
                    } else {
                        setSuccessMessage(`${translateData.couponsApply}`);
                    }
                } else {
                    setSuccessMessage('');
                    setCoupon(null);
                }
            }
        });
    };

    const gotoCoupon = () => {
        navigate('PromoCodeScreen', { from: 'payment', getCoupon });
    };

    const removeCoupon = () => {
        setInputValue();
        setCouponValue();
    }

    const getCoupon = val => {
        setCoupon(val);
    };

    useEffect(() => {
        dispatch(
            allDriver({
                zones: zoneValue?.data?.[0]?.id,
                is_online: 1,
                is_on_ride: 0,
            }),
        );
    }, []);

    const mapHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>OpenStreetMap with Routing</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { margin: 0; }
      #map { width: 100vw; height: 100vh; }
    </style>
    <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine/dist/leaflet-routing-machine.css" />
    <script src="https://unpkg.com/leaflet-routing-machine/dist/leaflet-routing-machine.js"></script>
  </head>
  <body>
    <div id="map"></div>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        var map = L.map('map').setView([${pickupCoords?.lat}, ${pickupCoords?.lng}], 13);

    var isDark = ${isDark}; // 0 = light, 1 = dark

var lightTiles = 'http://a.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png';
var darkTiles = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';

L.tileLayer(isDark ? darkTiles : lightTiles, {
  maxZoom: 19,
}).addTo(map);


        var startPoint = [${pickupCoords?.lat}, ${pickupCoords?.lng}];
        var stopPoints = [
          [${stopsCoords[0]?.lat}, ${stopsCoords[0]?.lng}],
          [${stopsCoords[1]?.lat}, ${stopsCoords[1]?.lng}], 
          [${stopsCoords[2]?.lat}, ${stopsCoords[2]?.lng}], 
        ]; 
        var endPoint = [${destinationCoords?.lat}, ${destinationCoords?.lng}];

        L.marker(startPoint, { draggable: false }).addTo(map).bindPopup('Start Point');
        L.marker(endPoint, { draggable: false }).addTo(map).bindPopup('End Point');

        stopPoints.forEach(function(point, index) {
          if (point[0] && point[1]) {
            L.marker(point, { draggable: false }).addTo(map).bindPopup('Stop Point ' + (index + 1));
          }
        });

        var waypoints = [L.latLng(startPoint)];
        stopPoints.forEach(function(point) {
          if (point[0] && point[1]) {
            waypoints.push(L.latLng(point));
          }
        });
        waypoints.push(L.latLng(endPoint));

        L.Routing.control({
          waypoints: waypoints,
          routeWhileDragging: true,
          createMarker: function() { return null; }
        }).addTo(map);

        map.fitBounds([startPoint, ...stopPoints.filter(p => p[0] && p[1]), endPoint]);
      });
    </script>
  </body>
</html>
`;

    const requestContactsPermission = async () => {
        try {
            const granted = await PermissionsAndroid.check(
                PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
            );

            if (granted) {
                navigate('ChooseRiderScreen', {
                    destination,
                    stops,
                    pickupLocation,
                    service_ID,
                    zoneValue,
                    scheduleDate,
                    service_category_ID,
                    selectedImage,
                    parcelWeight
                });
            } else {
                const permissionResult = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
                    {
                        title: 'Contacts Permission',
                        message: 'This app needs access to your contacts to display them.',
                        buttonPositive: 'OK',
                    },
                );

                if (permissionResult === PermissionsAndroid.RESULTS.GRANTED) {
                    navigate('ChooseRiderScreen', {
                        destination,
                        stops,
                        pickupLocation,
                        service_ID,
                        zoneValue,
                        scheduleDate,
                        service_category_ID,
                        selectedImage,
                        parcelWeight
                    });
                } else {
                }
            }
        } catch (err) {
            console.warn(err);
        }
    };

    useEffect(() => {
        const geocodeAddress = async (address: string) => {
            try {
                const response = await fetch(
                    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
                        address,
                    )}&key=${Google_Map_Key}`,
                );
                const dataMap = await response.json();
                if (dataMap.results.length > 0) {
                    const location = dataMap.results[0].geometry.location;
                    return {
                        lat: location.lat,
                        lng: location.lng,
                    };
                }
            } catch (error) {
                console.error('Error geocoding address:', error);
            }
            return null;
        };

        const fetchCoordinates = async () => {
            try {
                const pickup = await geocodeAddress(pickupLocation);
                const destinationLoc = await geocodeAddress(destination);
                const stopsCoordsPromises = stops.map(geocodeAddress);
                const stopsResults = await Promise.all(stopsCoordsPromises);
                setStopsCoords(
                    stopsResults.filter(coords => coords !== null) as Array<{
                        lat: number;
                        lng: number;
                    }>,
                );
            } catch (error) {
                console.error('Error fetching coordinates:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCoordinates();
    }, [pickupLocation, stops, destination]);

    const radioPress = () => {
        setIsChecked(!isChecked);
    };

    const chooseRider = () => {
        requestContactsPermission();
    };

    const renderItem = ({ item }) => {
        return (
            <BookRideItem
                couponsData={couponValue}
                item={item}
                isDisabled={isExpanding}
                isSelected={selectedItemData?.id === item.id}
                onPress={() => {
                    if (!isExpanding) {
                        setSelectedItemData(item);
                        if (taxidoSettingData?.taxido_values?.activation?.bidding === 0) {
                            const price = finalPrices[item.id] ?? item?.charges?.total;
                            setFareValue(`${price}`);
                            setSelectedFinalPrice(`${price}`);
                        }
                    }
                }}

                onPressAlternate={() => {
                    if (!isExpanding) {
                        setSelectedItemData(item);
                        vehicleDetailsSheetRef.current?.present();
                    }
                }}
                onPriceCalculated={(id, price) => {
                    setFinalPrices(prev => ({ ...prev, [id]: price }));
                }}
            />
        );
    };

    const [selectedItem1, setSelectedItem1] = useState<number | null>(null);

    const paymentData = index => {
        setSelectedItem1(index);
        setSeletedPayment(activePaymentMethods[index].name);
        paymentSheetRef.current?.close();
        mainSheetRef.current?.present();
    };

    const formattedData =
        allLocationCoords && allLocationCoords.length > 0
            ? `[${allLocationCoords
                .map(coord =>
                    coord?.lat !== undefined && coord?.lng !== undefined
                        ? `{"lat": ${coord.lat}, "lng": ${coord.lng}}`
                        : null,
                )
                .filter(Boolean)
                .join(', ')}]`
            : '[]';

    if (formattedData !== '[]') {
        try {
            const parsedData = JSON.parse(formattedData);
        } catch (error) {
            console.error('Failed to parse formattedData:', error);
        }
    } else {
    }



    const forms = {
        location_coordinates: JSON.parse(formattedData),
        locations: allLocations,
        ride_fare: taxidoSettingData?.taxido_values?.activation?.bidding == 1 ? String(fareValue) : String(selectedFinalPrice),
        service_id: service_ID,
        service_category_id: service_category_ID,
        vehicle_type_id: selectedItemData?.id,
        distance: selectedItemData?.charges?.total_distance,
        distance_unit: zoneValue?.distance_type,
        payment_method: seletedPayment || 'cash',
        wallet_balance: null,
        coupon: coupon || null,
        description: descriptionText ?? null,
        weight: parcelWeight,
        name: receiverName,
        currency_code: zoneValue?.currency_code,
        country_code: countryCode,
        phone: phoneNumber,
        new_rider:
            otherName?.trim() && otherContect?.trim()
                ? {
                    name: otherName,
                    phone: otherContect,
                }
                : null,

        schedule_time: formatScheduleDate(scheduleDates),
        ...(selectedImage &&
            selectedImage[0] && {
            selectedImage: {
                uri: selectedImage[0]?.uri || null,
                type: selectedImage[0]?.type || null,
                fileName: selectedImage[0]?.fileName || null,
            },
        }),
    };


    const newRiderName = forms.new_rider?.name?.trim();
    const newRiderPhone = forms.new_rider?.phone?.trim();

    const BookRideRequest = async forms => {
        const token = await getValue('token');
        try {
            const formData = new FormData();
            forms.location_coordinates.forEach((coord, index) => {
                formData.append(`location_coordinates[${index}][lat]`, coord.lat);
                formData.append(`location_coordinates[${index}][lng]`, coord.lng);
            });
            forms.locations.forEach((loc, index) => {
                formData.append(`locations[${index}]`, loc);
            });
            formData.append('ride_fare', forms.ride_fare);
            formData.append('service_id', forms.service_id);
            formData.append('service_category_id', forms.service_category_id);
            formData.append('vehicle_type_id', forms.vehicle_type_id);
            formData.append('distance', forms.distance);
            formData.append('distance_unit', forms.distance_unit);
            formData.append('payment_method', forms.payment_method);
            formData.append('wallet_balance', forms.wallet_balance || '');
            formData.append('coupon', forms.coupon || '');
            formData.append('description', forms.description);
            formData.append('weight', forms.weight || '');
            formData.append('parcel_receiver[name]', forms.name || '');
            formData.append('parcel_receiver[phone]', forms.phone || '');
            formData.append('parcel_receiver[country_code]', forms.country_code || '');
            formData.append('currency_code', forms.currency_code || '');
            formData.append(
                'new_rider',
                newRiderName && newRiderPhone
                    ? JSON.stringify({ name: newRiderName, phone: newRiderPhone })
                    : ''
            );
            formData.append('schedule_time', forms.schedule_time || '');
            if (forms.selectedImage) {
                formData.append('cargo_image', {
                    uri: forms.selectedImage.uri || {},
                    type: forms.selectedImage.type || {},
                    name: forms.selectedImage.fileName || {},
                });
            }


            const response = await fetch(`${URL}/api/rideRequest`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const responseData = await response.json();

            if (response.status == 403) {
                await clearValue('token');
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'SignIn' }],
                });
                return;
            }

            if (response.ok) {
                setRideRequestId(responseData?.id);
                setRideId(responseData?.id);
                setDriverId(responseData?.drivers);
                setRideRequestId(responseData?.id);
            } else if (responseData) {
                notificationHelper('', responseData?.message, 'error');
                setBookLoading(false);
            }
        } catch (error) {
        }
    };


    const handleBookRide = async () => {
        Keyboard.dismiss();
        setBookLoading(true);
        sendToWebView('focusPickup');

        if (!selectedVehicleData) {
            noVehicleSheetRef.current?.present(1);
            setBookLoading(false);
            return;
        }

        const startRideProcess = async () => {
            if (!isExpanding) {
                setIsExpanding(true);
                setIsPulsing(true);
                if (webViewRef.current) {
                    webViewRef.current.injectJavaScript('startPulsingAnimation();');
                }
                await BookRideRequest(forms);
                startPulseAnimation();
                setIsPulsing(true);
                focusOnPickup();
                paymentSheetRef.current?.close();
                mainSheetRef.current?.snapToIndex(1);
            }
        };

        if (taxidoSettingData?.taxido_values?.activation?.bidding == 1) {
            const roundedMaxFare = Math.round(maxFare * 100) / 100;
            if (fareValue < minFare) {
                setWarning(true);
                setWarningMessage(`Minimum fare should be ${minFare.toFixed(2)}`);
                setBookLoading(false);
                return;
            }
            if (fareValue > roundedMaxFare) {
                setWarning(true);
                setWarningMessage(`Maximum fare should be ${maxFare.toFixed(2)}`);
                setBookLoading(false);
                return;
            }
            setWarning(false);
            await startRideProcess();
        } else { // Non-bidding flow
            await startRideProcess();
        }
    };

    const [bids, setBids] = useState([]);
    const [driverbidValue, setDriverBidValue] = useState();
    const prevBidsRef = useRef([]);

    const listenToBids = (rideRequestId: string, callback: (data: any[]) => void) => {
        const bidsQuery = query(
            collection(db, "ride_requests", rideRequestId.toString(), "bids"),
            orderBy("created_at", "desc")
        );

        return onSnapshot(
            bidsQuery,
            (snapshot) => {
                const bidsValue = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                const prevBids = JSON.stringify(prevBidsRef.current);
                const currentBids = JSON.stringify(bidsValue);

                if (prevBids !== currentBids) {
                    setDriverBidValue(bidsValue);
                    prevBidsRef.current = bidsValue;
                    if (bidsValue.length > 0) {
                        Vibration.vibrate(1000); // vibrate for 0.5s
                    }
                }

                callback(bidsValue);
            },
            (error) => {
                console.error("❌ Listener error:", error);
            }
        );
    };

    useEffect(() => {
        if (!rideID) return;

        const unsubscribe = listenToBids(rideID, setBids);

        return () => unsubscribe();
    }, [rideID]);



    const handleCancelRide = async () => {
        if (webViewRef.current) {
            webViewRef.current.injectJavaScript('drawRouteAndMarkers();');
        }
        setIsPulsing(false);

        stopPulseAnimation();
        setBookLoading(false);
        sendToWebView('fitRoute');

        const payload = {
            status: "cancelled"
        }
        dispatch(updateRideRequest({ payload: payload, ride_id: riderequestId }))
            .then((res: any) => {
            })
        try {
            if (taxidoSettingData?.taxido_values?.activation?.bidding == 0) {
                if (!riderequestId) {
                    setBookLoading(false);
                    return;
                }
            } else if (taxidoSettingData?.taxido_values?.activation?.bidding == 1) {
                try {
                    if (!rideID || !driverId || !Array.isArray(driverId)) {
                        console.warn("rideID or driverId missing or invalid");
                        setBookLoading(false);
                        return;
                    }
                } catch (error) {
                    console.error('Failed to remove ride request from Firebase:', error);
                    Alert.alert('Error', 'Could not cancel ride properly.');
                    setBookLoading(false);
                }
            } else {
            }
        } catch (error) {
            console.error('Failed to cancel ride:', error);
        }

        setIsExpanding(false);
        setBookLoading(false);
        paymentSheetRef.current?.close();
        mainSheetRef.current?.snapToIndex(2);
    };

    const backScreen = () => {
        goBack();
    };

    const startPulseAnimation = () => {
        setBookLoading(false);
        startTimer();

        if (animationRef.current) return;

        let tick = 0;
        animationRef.current = setInterval(() => {
            setPulses(prev =>
                Array.from({ length: pulseCount }).map((_, index) => {
                    const offset = index * pulseDelay;
                    const progress = (tick - offset + durations) % durations;

                    if (progress < durations / 2) {
                        const radius = 1000 + (progress / (durations / 2)) * 1000;
                        const opacity = 0.5 * (1 - progress / (durations / 2));
                        return { radius, opacity };
                    }

                    return { radius: 1000, opacity: 0 };
                })
            );
            tick++;
        }, 50);

        setIsPulsing(true);
    };


    const stopPulseAnimation = async () => {

        cancelTimer();
        if (animationRef.current) {
            clearInterval(animationRef.current);
            animationRef.current = null;
        }
        setIsPulsing(false);
        setPulses(Array(pulseCount).fill({ radius: 1000, opacity: 0 }));
    };

    useEffect(() => {
        return () => {
            if (animationRef.current) clearInterval(animationRef.current);
        };
    }, []);

    useEffect(() => {
        if (!riderequestId || !isPulsing) return;

        const instantRideRef = doc(
            db,
            "ride_requests",
            String(riderequestId),
            "instantRide",
            String(riderequestId)
        );

        const waitForRideDoc = async (rideId: string, retries = 5, delay = 1000) => {
            for (let i = 0; i < retries; i++) {
                const rideRef = doc(db, "rides", rideId.toString());
                const rideSnap = await getDoc(rideRef);

                if (rideSnap.exists()) {
                    return rideSnap.data();
                }

                await new Promise((res) => setTimeout(res, delay));
            }
            throw new Error(`❌ Ride doc ${rideId} not found after ${retries} retries`);
        };

        const unsubscribe = onSnapshot(
            instantRideRef,
            async (snapshot) => {
                if (!snapshot.exists()) {
                    console.warn("⚠️ instantRide doc missing:", riderequestId);
                    return;
                }

                const data = snapshot.data();

                const { status, ride_id } = data || {};
                if (!status || !ride_id) {
                    console.warn("⚠️ Invalid snapshot data:", data);
                    return;
                }

                if (status === "cancelled") {
                    notificationHelper("", "Ride Cancelled", "error");
                    navigation.goBack();
                    return;
                }

                if (status === "accepted") {
                    try {
                        const rideData = await waitForRideDoc(ride_id.toString());

                        if (!rideData) {
                            console.error("❌ No ride data after retries:", ride_id);
                            return;
                        }

                        dispatch(allRides());

                        if (rideData?.service_category?.service_category_type === "schedule") {
                            navigation.reset({
                                index: 0,
                                routes: [{ name: "MyTabs" as never }],
                            });
                            notificationHelper("", translateData.rideScheduled, "success");
                        } else {
                            // normal ride flow
                            const cleanedData = JSON.parse(JSON.stringify(rideData));
                            navigation.navigate('RideActive' as never, {
                                activeRideOTP: cleanedData,
                            } as never);
                        }
                    } catch (err) {
                        console.error("❌ Error fetching ride:", err);
                    }
                } else {
                }
            },
            (error) => {
                console.error("🔥 Snapshot listener error:", error);
            }
        );

        return () => {
            unsubscribe();
        };
    }, [riderequestId, isPulsing]);



    if (!pickupCoords || !destinationCoords) {
        return null;
    }

    const focusOnPickup = () => {
        if (pickupCoords?.lat && pickupCoords?.lng && mapRef.current) {
            mapRef.current.animateToRegion(
                {
                    latitude: pickupCoords.lat,
                    longitude: pickupCoords.lng,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                },
                1000,
            );
        }
    };

    const getMapHtml = (mapProvider) => {
        if (!pickupCoords || !destinationCoords) return '';

        const pulseCss = `
        <style>
          .pulse-container { width: 300px; height: 300px; position: relative; }
          .pulse-ring {
            position: absolute; left: 50%; top: 50%;
            transform: translate(-50%, -50%);
            width: 15px; height: 15px;
            background-color: rgba(25, 150, 117, 0.7);
            border-radius: 50%;
            animation: pulse-animation 2.5s ease-out infinite;
            opacity: 0;
          }
          .pulse-ring:nth-child(2) { animation-delay: 0.8s; }
          .pulse-ring:nth-child(3) { animation-delay: 1.6s; }
          @keyframes pulse-animation {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 0.9; }
            100% { transform: translate(-50%, -50%) scale(20); opacity: 0; }
          }
        </style>`;

        // ----------------- GOOGLE MAPS -----------------
        if (mapProvider === 'googleMap') {
            return `
            <!DOCTYPE html><html><head>
              <title>Google Maps</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
              <script src="https://maps.googleapis.com/maps/api/js?key=${Google_Map_Key}"></script>
              <style>html, body, #map { height: 100%; margin: 0; padding: 0; }</style>
              ${pulseCss}
            </head><body><div id="map"></div><script>
                var map, directionsRenderer;
                var markers = [];
                var pulseOverlay = null;
    
                function initMap() {
                    const darkMapStyle = [
                        { elementType: 'geometry', stylers: [{ color: '#212121' }] },
                        { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
                        { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
                        { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
                        { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
                        { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#282828' }] },
                        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#383838' }] },
                        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] }
                    ];
    
                    map = new google.maps.Map(document.getElementById('map'), {
                        zoom: 12,
                        center: { lat: ${pickupCoords?.lat}, lng: ${pickupCoords?.lng} },
                        disableDefaultUI: true,
                        gestureHandling: 'greedy',
                        styles: ${isDark ? 'darkMapStyle' : 'null'}
                    });
                    drawRouteAndMarkers();
                }
    
                function lockMap() { map.setOptions({ gestureHandling: 'none' }); }
                function unlockMap() { map.setOptions({ gestureHandling: 'greedy' }); }
    
                function clearAll() {
                    if (directionsRenderer) directionsRenderer.setMap(null);
                    markers.forEach(marker => marker.setMap(null));
                    markers = [];
                    if (pulseOverlay) { pulseOverlay.setMap(null); pulseOverlay = null; }
                }
    
                function drawRouteAndMarkers() {
                    clearAll();
                    unlockMap();
                    var waypoints = ${JSON.stringify(stopsCoords.map(s => ({ location: s, stopover: true })))};
                    var directionsService = new google.maps.DirectionsService();
                    directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: true, polylineOptions: { strokeColor: '#199675', strokeWeight: 5 }});
                    directionsRenderer.setMap(map);
    
                    var allPoints = [{lat: ${pickupCoords?.lat}, lng: ${pickupCoords?.lng}}, ...${JSON.stringify(stopsCoords)}, {lat: ${destinationCoords?.lat}, lng: ${destinationCoords?.lng}}];
                    allPoints.forEach((point) => {
                        markers.push(new google.maps.Marker({ position: point, map: map }));
                    });
    
                    directionsService.route({
                        origin: { lat: ${pickupCoords?.lat}, lng: ${pickupCoords?.lng} },
                        destination: { lat: ${destinationCoords?.lat}, lng: ${destinationCoords?.lng} },
                        waypoints: waypoints,
                        travelMode: 'DRIVING'
                    }, (res, status) => { if (status === 'OK') directionsRenderer.setDirections(res); });
                }
    
                function startPulsingAnimation() {
                    clearAll();
                    lockMap();
                    var pickupLatLng = { lat: ${pickupCoords?.lat}, lng: ${pickupCoords?.lng} };
                    map.setCenter(pickupLatLng);
                    map.setZoom(15);
                    class PulseOverlay extends google.maps.OverlayView {
                        constructor(pos) { super(); this.pos = pos; this.div = null; this.setMap(map); }
                        onAdd() { this.div = document.createElement('div'); this.div.style.position = 'absolute'; this.div.innerHTML = '<div class="pulse-container"><div class="pulse-ring"></div><div class="pulse-ring"></div><div class="pulse-ring"></div></div>'; this.getPanes().overlayLayer.appendChild(this.div); }
                        draw() { var p = this.getProjection().fromLatLngToDivPixel(this.pos); if (this.div) { this.div.style.left = (p.x - 150) + 'px'; this.div.style.top = (p.y - 150) + 'px'; } }
                        onRemove() { if (this.div) { this.div.parentNode.removeChild(this.div); this.div = null; } }
                    }
                    pulseOverlay = new PulseOverlay(pickupLatLng);
                    markers.push(new google.maps.Marker({ position: pickupLatLng, map: map }));
                }
    
                window.onload = initMap;
            </script></body></html>`;
        }

        // ----------------- OPENSTREETMAP -----------------
        if (mapProvider === 'osm') {
            return `
            <!DOCTYPE html><html><head>
              <title>OpenStreetMap</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
              <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
              <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
              <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine/dist/leaflet-routing-machine.css" />
              <script src="https://unpkg.com/leaflet-routing-machine/dist/leaflet-routing-machine.js"></script>
              <style>html, body, #map { height: 100vh; width: 100vw; margin: 0; }</style>
              ${pulseCss}
            </head><body><div id="map"></div><script>
                var map, routingControl, pulseMarker;
                var routeMarkers = [];
                var waypoints = [${[pickupCoords, ...stopsCoords, destinationCoords].map(c => `L.latLng(${c.lat}, ${c.lng})`).join(', ')}];
    
                function initMap() {
                    var lightTiles = 'http://a.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png';
                    var darkTiles = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';
    
                    map = L.map('map').setView([${pickupCoords?.lat}, ${pickupCoords?.lng}], 13);
                    L.tileLayer(${isDark ? 'darkTiles' : 'lightTiles'}, { maxZoom: 19 }).addTo(map);
    
                    drawRouteAndMarkers();
                }
    
                function lockMap() { map.dragging.disable(); map.touchZoom.disable(); map.doubleClickZoom.disable(); map.scrollWheelZoom.disable(); map.boxZoom.disable(); }
                function unlockMap() { map.dragging.enable(); map.touchZoom.enable(); map.doubleClickZoom.enable(); map.scrollWheelZoom.enable(); map.boxZoom.enable(); }
    
                function clearAll() {
                    if (routingControl) map.removeControl(routingControl);
                    routeMarkers.forEach(m => m.remove());
                    if (pulseMarker) pulseMarker.remove();
                    routingControl = pulseMarker = null;
                    routeMarkers = [];
                }
    
                function drawRouteAndMarkers() {
                    clearAll();
                    unlockMap();
                    routingControl = L.Routing.control({
                        waypoints: waypoints, addWaypoints: false,
                        createMarker: (i, wp) => { 
                            const marker = L.marker(wp.latLng).addTo(map);
                            routeMarkers.push(marker);
                            return marker;
                        },
                        lineOptions: { styles: [{color: '#199675', weight: 5}] }
                    }).on('routesfound', e => map.fitBounds(e.routes[0].bounds)).addTo(map);
                }
    
                function startPulsingAnimation() {
                    clearAll();
                    lockMap();
                    var pickupLatLng = [${pickupCoords?.lat}, ${pickupCoords?.lng}];
                    map.setView(pickupLatLng, 15);
                    var pulseIcon = L.divIcon({ className: 'pulse-div-icon', html: '<div class="pulse-container"><div class="pulse-ring"></div><div class="pulse-ring"></div><div class="pulse-ring"></div></div>', iconSize: [300, 300], iconAnchor: [150, 150] });
                    pulseMarker = L.marker(pickupLatLng, { icon: pulseIcon }).addTo(map);
                    routeMarkers.push(L.marker(pickupLatLng).addTo(map));
                }
    
                initMap();
            </script></body></html>`;
        }
    };


    const renderItem1 = ({ item, index }) => {
        return (
            <>
                <TouchableOpacity
                    onPress={() => paymentData(index)}
                    activeOpacity={0.7}
                    style={[
                        styles.modalPaymentView,
                        { backgroundColor: 'transparent', flexDirection: viewRTLStyle },
                    ]}>
                    <View style={[styles.paymentView, { flexDirection: viewRTLStyle }]}>
                        <View style={[styles.imageBg, { borderColor: isDark ? appColors.darkBorder : appColors.lightGray }]}>
                            <Image source={{ uri: item?.image }} style={styles.paymentImage} />
                        </View>
                        <View style={styles.mailInfo}>
                            <Text
                                style={[
                                    styles.mail,
                                    { color: textColorStyle, textAlign: textRTLStyle },
                                ]}>
                                {item?.name}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.payBtn}>
                        <RadioButton
                            onPress={() => paymentData(index)}
                            checked={index === selectedItem1}
                            color={appColors.primary}
                        />
                    </View>
                </TouchableOpacity>
                {index !== activePaymentMethods.length - 1 && (
                    <View style={[styles.borderPayment, { borderColor: isDark ? appColors.darkBorder : appColors.lightGray }]} />
                )}
            </>
        );
    };



    return (
        <BottomSheetModalProvider>
            <View style={[external.fx_1, { backgroundColor: bgContainer }]}>
                <Modal
                    transparent={true}
                    visible={serviceVisible}
                    animationType="slide"
                    onRequestClose={goBack}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <FastImage
                                source={isDark ? Images.noServiceDark : Images.noService}
                                style={styles.serviceImg}
                            />
                            <Text style={[styles.modalText, { color: isDark ? appColors.whiteColor : appColors.primaryText },]}>
                                {translateData.noService}
                            </Text>
                            <Text style={[styles.modalDetail, { color: isDark ? appColors.whiteColor : appColors.primaryText },]}>
                                {translateData.noServiceDes}
                            </Text>
                            <View style={[styles.buttonContainer, { flexDirection: viewRTLStyle }]}>
                                <Button title={translateData.goBack} onPress={backScreen} />
                            </View>
                        </View>
                    </View>
                </Modal>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={appColors.primary} />
                    </View>
                ) : (
                    <>
                        <View style={[commonStyles.flexContainer]}>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                style={[styles.backBtn, { backgroundColor: bgContainer }, { borderColor: isDark ? appColors.darkBorder : appColors.border, },]}
                                onPress={goBack}>
                                <Back />
                            </TouchableOpacity>
                            <View style={styles.ridekm}>
                                <View style={{ height: '100%', backgroundColor: appColors.primary, alignItems: "center", justifyContent: 'center', overflow: 'hidden', paddingHorizontal: windowWidth(5) }}>
                                    <>
                                        <Text style={{ color: appColors.whiteColor, fontFamily: appFonts.regular }}>{selectedItemData?.charges?.total_distance}</Text>
                                        <Text style={{ color: appColors.whiteColor, fontFamily: appFonts.regular }}>{selectedItemData?.charges?.distance_unit}</Text>
                                    </>
                                </View>
                                <View style={{ height: '100%', backgroundColor: appColors.whiteColor, alignItems: "center", justifyContent: 'center', overflow: 'hidden', paddingHorizontal: windowWidth(5) }}>
                                    <Text>{
                                        <Text style={{ color: appColors.primary, fontFamily: appFonts.medium }}> {selectedItemData?.charges?.duration}</Text>
                                    }
                                    </Text>
                                </View>

                            </View>
                            {mapType === 'googleMap' ? (
                                <WebView
                                    key={mapType}
                                    ref={webViewRef}
                                    source={{ html: getMapHtml(mapType) }}
                                    javaScriptEnabled={true}
                                    domStorageEnabled={true}
                                />

                            ) : (
                                <WebView
                                    originWhitelist={['*']}
                                    source={{ html: mapHtml }}
                                    style={styles.webview}
                                    javaScriptEnabled={true}
                                    domStorageEnabled={true}
                                />
                            )}
                        </View>

                        {driverbidValue ? (
                            <View style={[external.mt_10, external.mh_15, { position: 'absolute', top: 40 },]}>
                                <FlatList
                                    renderItem={renderItemRequest}
                                    data={driverbidValue?.length > 0 ? [driverbidValue[0]] : []}
                                />
                            </View>
                        ) : null}
                    </>
                )}

                {/* --- Main Bottom Sheet --- */}
                <BottomSheetModal
                    ref={mainSheetRef}
                    index={2}
                    snapPoints={mainSnapPoints}
                    onChange={handleMainSheetChange} // USE THE CORRECT HANDLER
                    enablePanDownToClose={false}
                    backgroundStyle={{ backgroundColor: bgContainer }}
                    enableHandlePanningGesture={true}
                    enableContentPanningGesture={false}
                    enableOverDrag={false}
                    handleIndicatorStyle={{ backgroundColor: isDark ? appColors.whiteColor : appColors.primaryText, width: windowWidth(40) }}>

                    <View>
                        <View
                            style={[
                                styles.selectedOptionView,
                                { flexDirection: viewRTLStyle },
                            ]}>
                            <Text
                                style={[
                                    styles.carType,
                                    { color: textColorStyle, textAlign: textRTLStyle },
                                ]}>
                                {isExpanding ? translateData.searchDriver : translateData.vehicletype}
                            </Text>
                            {isExpanding && (
                                <View
                                    style={{
                                        flexDirection: viewRTLStyle,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                    {isTimerRunning ? (
                                        <View style={{ backgroundColor: appColors.lightGreen, paddingVertical: windowHeight(6), paddingHorizontal: windowWidth(16), borderRadius: windowHeight(25) }}>
                                            <Text style={{ fontSize: fontSizes.FONT20, fontFamily: appFonts.regular, color: appColors.primary }}>
                                                {minutes}:{seconds.toString().padStart(2, '0')}s
                                            </Text>
                                        </View>
                                    ) : (
                                        <View style={{ backgroundColor: appColors.lightGreen, paddingVertical: windowHeight(6), paddingHorizontal: windowWidth(16), borderRadius: windowHeight(25) }}>
                                            <ActivityIndicator />
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                        <View style={{ marginHorizontal: windowWidth(18), marginBottom: windowHeight(5) }}>
                            <BottomSheetFlatList
                                horizontal
                                nestedScrollEnabled={true}
                                data={
                                    vehicleTypedata && vehicleTypedata.length > 0
                                        ? vehicleTypedata
                                        : noserviceData
                                }
                                renderItem={renderItem}
                                keyExtractor={item => item?.id?.toString()}
                                showsHorizontalScrollIndicator={false}
                                initialNumToRender={5}
                                windowSize={5}
                                maxToRenderPerBatch={5}
                                removeClippedSubviews={true}
                                contentContainerStyle={{ backgroundColor: 'transparent' }}
                                style={{ maxHeight: windowHeight(95) }}

                            />
                        </View>

                        {taxidoSettingData?.taxido_values?.activation?.bidding == 1 && (
                            <View style={[external.mh_10]}>
                                <Text style={[styles.title, { color: isDark ? appColors.whiteColor : appColors.primaryText, textAlign: textRTLStyle }]}>
                                    {translateData.offerYourFare}
                                </Text>
                                <View style={[styles.inputcontainer, { backgroundColor: isDark ? appColors.darkBorder : appColors.lightGray, flexDirection: viewRTLStyle }]}>
                                    <TouchableOpacity style={[styles.plusBtn, isMinusDisabled && { opacity: 0.4 }]} onPress={handleDecrease} disabled={isMinusDisabled}>
                                        <Text>-{increaseAmount}</Text>
                                    </TouchableOpacity>
                                    <TextInput
                                        style={[styles.textInput, { color: textColorStyle }]}
                                        value={String(fareValue)}
                                        onChangeText={text => setFareValue(text)}
                                        keyboardType="number-pad"
                                        placeholder={String(minFare)}
                                        placeholderTextColor={appColors.regularText}
                                    />
                                    <TouchableOpacity style={[styles.plusBtn, isPlusDisabled && { opacity: 0.4 }]} onPress={handleIncrease} disabled={isPlusDisabled}>
                                        <Text>+{increaseAmount}</Text>
                                    </TouchableOpacity>
                                </View>
                                {Warning && <Text style={styles.warningText}>{warningMessage}</Text>}
                            </View>
                        )}

                        <View style={[styles.cardView, { flexDirection: viewRTLStyle }]}>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => {
                                    if (bookLoading || isTimerRunning) {
                                        notificationHelper("", 'Please wait,Booking is in progress...', 'error')
                                        return;
                                    }
                                    mainSheetRef.current?.close();
                                    paymentSheetRef.current?.snapToIndex(0);
                                }} style={[styles.switchUser, { flexDirection: viewRTLStyle, width: taxidoSettingData?.taxido_values?.activation?.coupon_enable == 1 && taxidoSettingData?.taxido_values?.activation?.bidding == 0 ? "31%" : "46.5%", backgroundColor: isDark ? appColors.darkHeader : appColors.lightGray }]}>
                                <View style={styles.userIcon}><Card /></View>
                                <Text style={[styles.selectText, { color: textColorStyle }]}>
                                    {seletedPayment
                                        ? seletedPayment.length > 6
                                            ? `${seletedPayment.substring(0, 6)}...`
                                            : seletedPayment
                                        : translateData.payment}
                                </Text>

                            </TouchableOpacity>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => {
                                    if (bookLoading || isTimerRunning) {
                                        notificationHelper("", 'Please wait,Booking is in progress...', 'error')
                                        return;
                                    }
                                    paymentSheetRef?.current?.close();
                                    riderSheetRef?.current?.present();
                                }}
                                style={[styles.switchUser, { flexDirection: viewRTLStyle, width: taxidoSettingData?.taxido_values?.activation?.coupon_enable == 1 && taxidoSettingData?.taxido_values?.activation?.bidding == 0 ? "31%" : "46.5%", backgroundColor: isDark ? appColors.darkHeader : appColors.lightGray }]}>
                                <View style={styles.userIcon}><User /></View>
                                <Text style={[styles.selectText, { color: textColorStyle }]}>
                                    {otherName
                                        ? otherName.length > 5
                                            ? `${otherName.substring(0, 5)}...`
                                            : otherName
                                        : translateData.myself}
                                </Text>
                            </TouchableOpacity>
                            {taxidoSettingData?.taxido_values?.activation?.coupon_enable == 1 && taxidoSettingData?.taxido_values?.activation?.bidding == 0 && (
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        if (bookLoading || isTimerRunning) {
                                            notificationHelper("", 'Please wait,Booking is in progress...', 'error')
                                            return;
                                        }
                                        paymentSheetRef.current?.close();
                                        couponsSheetRef.current?.present();
                                    }}
                                    style={[styles.switchUser, { flexDirection: viewRTLStyle, width: "31%", backgroundColor: isDark ? appColors.darkHeader : appColors.lightGray }]}>
                                    <View style={styles.userIcon}><Coupon /></View>
                                    <Text style={[styles.selectText, { color: textColorStyle }]}>{translateData.coupons}</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={[external.mh_10, external.mv_13]}>
                            {!isExpanding ? (
                                <Button title={translateData.bookRide} onPress={handleBookRide} loading={bookLoading} disabled={bookLoading} />
                            ) : (
                                <Button title={translateData.cancelRide} backgroundColor={appColors.textRed} onPress={handleCancelRide} loading={bookLoading} disabled={bookLoading} />
                            )}
                        </View>
                    </View>
                </BottomSheetModal>

                <BottomSheetModal
                    ref={vehicleDetailsSheetRef}
                    snapPoints={vehicleDetailSnapPoints}
                    backgroundStyle={{ backgroundColor: bgContainer }}
                    handleIndicatorStyle={{ backgroundColor: isDark ? appColors.whiteColor : appColors.primaryText, width: windowWidth(40) }}>
                    <BottomSheetView style={external.fx_1}>
                        <ModalContainers
                            distance={distance}
                            selectedItemData={selectedItemData}
                            onPress={() => vehicleDetailsSheetRef.current?.close()}
                            minChargeRide={minChargeRide}
                            couponsData={couponValue}
                        />
                    </BottomSheetView>
                </BottomSheetModal>

                <BottomSheetModal
                    ref={noVehicleSheetRef}
                    snapPoints={noVehicleSnapPoints}
                    backgroundStyle={{ backgroundColor: bgContainer }}
                    handleIndicatorStyle={{ backgroundColor: isDark ? appColors.whiteColor : appColors.primaryText, width: windowWidth(40) }}>
                    <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={[styles.modalText, { color: textColorStyle }]}>{translateData.selectVehicleType}</Text>
                        <View style={[styles.buttonContainer, { justifyContent: 'center', marginTop: 20 }]}>
                            <Button title={translateData.modelCloseBtn} onPress={() => noVehicleSheetRef.current?.close()} />
                        </View>
                    </View>
                </BottomSheetModal>

                <BottomSheet
                    ref={paymentSheetRef}
                    index={-1}
                    snapPoints={paymentSnapPoints}
                    onChange={handlePaymentSheetChange} // USE THE CORRECT HANDLER
                    enablePanDownToClose={true}
                    onClose={() => {
                        mainSheetRef.current?.present();
                    }}
                    backgroundStyle={{ backgroundColor: bgContainer }}
                    handleIndicatorStyle={{ backgroundColor: isDark ? appColors.whiteColor : appColors.primaryText, width: windowWidth(40) }}>
                    <View style={external.fx_1}>
                        <View style={styles.selectPaymentView}>
                            <TouchableOpacity style={{ alignSelf: 'flex-end', marginHorizontal: windowWidth(15) }} onPress={() => { paymentSheetRef.current?.close(); mainSheetRef.current?.present() }}>
                                <CloseCircle />
                            </TouchableOpacity>
                            <Text style={[styles.payment, { color: textColorStyle, textAlign: textRTLStyle }]}>{translateData.paymentMethodSelect}</Text>
                        </View>
                        <BottomSheetFlatList
                            data={activePaymentMethods}
                            renderItem={renderItem1}
                            keyExtractor={(item, index) => index.toString()}
                            contentContainerStyle={styles.listContent}
                        />
                    </View>
                </BottomSheet>

                <BottomSheetModal
                    ref={riderSheetRef}
                    snapPoints={riderSnapPoints}
                    backgroundStyle={{ backgroundColor: bgContainer }}
                    handleIndicatorStyle={{ backgroundColor: isDark ? appColors.whiteColor : appColors.primaryText, width: windowWidth(40) }}>
                    <BottomSheetView style={[styles.switchContainer]}>
                        <View>
                            <View style={[styles.switchRiderView, { flexDirection: viewRTLStyle }]}>
                                <Text style={[commonStyles.mediumText23, { color: textColorStyle, textAlign: textRTLStyle }]}>{translateData.talkingRide}</Text>
                                <TouchableOpacity onPress={() => riderSheetRef.current?.close()} activeOpacity={0.7} style={{ bottom: windowHeight(1.7) }}>
                                    <Close />
                                </TouchableOpacity>
                            </View>
                            <Text style={[commonStyles.regularText, external.mt_3, { fontSize: fontSizes.FONT16, lineHeight: windowHeight(14), textAlign: textRTLStyle }]}>
                                {translateData.notice}
                            </Text>
                        </View>
                        <View style={[external.mt_20]}>
                            <View style={[external.fd_row, external.ai_center, external.js_space, { flexDirection: viewRTLStyle }]}>
                                <View style={[{ flexDirection: viewRTLStyle, right: windowWidth(3) }]}>
                                    <UserFill />
                                    <Text style={[commonStyles.mediumTextBlack12, { fontSize: fontSizes.FONT19, marginHorizontal: windowWidth(8) }, { color: isDark ? appColors.whiteColor : appColors.primaryText }]}>
                                        {translateData.myself}
                                    </Text>
                                </View>
                                <Pressable style={styles.pressable}>
                                    <RadioButton onPress={radioPress} checked={isChecked} color={appColors.primary} />
                                </Pressable>
                            </View>
                            <SolidLine marginVertical={14} />
                            <TouchableOpacity activeOpacity={0.7} style={[external.fd_row, external.js_space, { flexDirection: viewRTLStyle, marginTop: windowHeight(1) }]} onPress={chooseRider}>
                                <View style={[external.fd_row, external.ai_center]}>
                                    <NewContact />
                                    <Text style={[styles.chooseAnotherAccount, { marginLeft: windowWidth(10) }]}>{translateData.contact}</Text>
                                </View>
                                <Forword />
                            </TouchableOpacity>
                        </View>
                    </BottomSheetView>
                </BottomSheetModal>

                <BottomSheetModal
                    ref={couponsSheetRef}
                    snapPoints={couponsSnapPoints}
                    backgroundStyle={{ backgroundColor: bgContainer }}
                    handleIndicatorStyle={{ backgroundColor: isDark ? appColors.whiteColor : appColors.primaryText, width: windowWidth(40) }}>
                    <BottomSheetView style={external.fx_1}>
                        <View>
                            <TouchableOpacity style={{ alignSelf: 'flex-end', marginHorizontal: windowWidth(15) }} onPress={() => couponsSheetRef.current?.close()}>
                                <CloseCircle />
                            </TouchableOpacity>
                            <Text style={[styles.payment, { color: textColorStyle, textAlign: textRTLStyle }]}>{translateData.applyCoupons}</Text>
                        </View>
                        <View style={{ marginHorizontal: windowWidth(15) }}>
                            <View style={[styles.containerCouponMain, { flexDirection: viewRTLStyle, backgroundColor: bgContainer, borderColor: isDark ? appColors.darkBorder : appColors.border }]}>
                                <TextInput
                                    style={[styles.input, { color: textColorStyle }]}
                                    value={inputValue}
                                    onChangeText={setInputValue}
                                    placeholder={translateData.applyPromoCode}
                                    placeholderTextColor={appColors.regularText}
                                />
                                <TouchableOpacity style={styles.buttonAdd} onPress={handlePress} activeOpacity={0.7}>
                                    <Text style={styles.buttonAddText}>{translateData.apply}</Text>
                                </TouchableOpacity>
                            </View>
                            <View>
                                {!isValid && <Text style={styles.invalidPromoText}>{translateData.invalidPromo}</Text>}
                                {couponValue?.success == true && <Text style={styles.successMessage}>{successMessage}</Text>}
                                {inputValue?.length > 0 ? (
                                    <TouchableOpacity onPress={removeCoupon} activeOpacity={0.7}>
                                        <Text style={[styles.viewCoupon, { textDecorationLine: 'underline' }]}>{translateData.remove}</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity onPress={gotoCoupon} activeOpacity={0.7}>
                                        <Text style={styles.viewCoupon}>{translateData.allCoupon}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </BottomSheetView>
                </BottomSheetModal>
            </View>
        </BottomSheetModalProvider>
    );
}