import { Image, Text, TouchableOpacity, View, BackHandler, FlatList, Pressable, ScrollView, Alert, Keyboard, TextInput } from "react-native";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { external } from "../../../../../../styles/externalStyle";
import { styles } from "./styles";
import { Button, SolidLine, RadioButton, notificationHelper, } from "@src/commonComponent";
import { KmDetails } from "../packageContainer/index";
import { commonStyles } from "../../../../../../styles/commonStyle";
import { appColors, windowWidth } from "@src/themes";
import * as turf from "@turf/turf";
import { UserFill, Close, Back, User, Card, NewContact, Forword, CloseCircle, } from "@utils/icons";
import { ModalContainer } from "../../../../../../components/modalContainer/index";
import { feesPolicies, modelData, } from "../../../../../../data/modelData/index";
import Images from "@utils/images";
import { useValues } from "../../../../../../../App";
import { BookRideItem } from "../../../../../bookRide/bookRideItem/index";
import { fontSizes, windowHeight } from "@src/themes";
import { ModalContainers } from "../../../../../bookRide/modalContainer/index";
import { useDispatch, useSelector } from "react-redux";
import { vehicleTypeDataGet } from "../../../../../../api/store/actions/vehicleTypeAction";
import MapView, { Circle, Marker, Polygon } from "react-native-maps";
import darkMapStyle from "@src/screens/darkMapStyle";
import { WebView } from "react-native-webview";
import { CustomMarker } from "@src/components";
import { allDriver, couponVerifyData } from "@src/api/store/actions";
import { CancelRender } from "@src/screens/cancelFare/cancelRenderItem/index";
import { bidDataGet } from "@src/api/store/actions/bidAction";
import { clearValue, getValue } from "@src/utils/localstorage";
import { useAppNavigation, useAppRoute } from "@src/utils/navigation";
import { URL } from "@src/api/config";
import { useNavigation } from "@react-navigation/native";
import firestore from '@react-native-firebase/firestore';
import useSmartLocation from "@src/components/helper/locationHelper";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export function DetailContainer() {
  const navigation = useNavigation();
  const route = useAppRoute();
  const { textColorStyle, bgContainer, textRTLStyle, viewRTLStyle, isDark, Google_Map_Key } = useValues();
  const { pickupLocation, service_ID, zoneValue, service_category_ID } = route.params;
  const dispatch = useDispatch();
  const { navigate, goBack } = useAppNavigation();
  const [isChecked, setIsChecked] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const { driverData } = useSelector((state) => state.allDriver);
  const { vehicleTypedata } = useSelector((state) => state?.vehicleType || {});
  const selectedVehicleData = Array.isArray(vehicleTypedata) ? vehicleTypedata.find((item) => item?.id === selectedItem) : null;
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number; } | null>(null);
  const ZoneArea = zoneValue?.locations
  const [subZone, setSubZone] = useState([]);
  const [mapType, setMapType] = useState("googleMap");
  const [RideBooked, setRideBooked] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [rideID, setRideId] = useState(null);
  const [selectedPackageDetails, setSelectedPackageDetails] = useState({ hour: null, distance: null, id: null, distanceType: null, currency_symbol: null });
  const [packageVehicle, setPackageVehicle] = useState();
  const [selectedItemData, setSelectedItemData] = useState(null);
  const [radiusPerVertex, setRadiusPerVertex] = useState(null);
  const [incrementDistance, setIncrementDistance] = useState(0.5);
  const intervalRef = useRef(null);
  const [startDriverRequest, setStartDriverRequest] = useState(false);
  const allLocations = [pickupLocation];
  const allLocationCoords = [pickupCoords];
  const { bidValue } = useSelector((state) => state.bid);
  const [activeRideRequest, setActivateRideRequest] = useState(false);
  const { translateData, taxidoSettingData, settingData } = useSelector((state) => state.setting);
  const filteredVehicle = packageVehicle?.find((vehicle) => vehicle?.id === selectedItem);
  const packageTotalMinutes = selectedPackageDetails?.hour * 60;
  const packageTotalDistance = selectedPackageDetails.distanceType == 'mile' ? selectedPackageDetails.distance * 1.60934 : selectedPackageDetails.distance;
  const minPerMinCharge = Number(filteredVehicle?.min_per_min_charge) || 0;
  const minPerUnitCharge = Number(filteredVehicle?.min_per_unit_charge) || 0;
  const maxPerMinCharge = Number(filteredVehicle?.max_per_min_charge) || 0;
  const maxPerUnitCharge = Number(filteredVehicle?.max_per_unit_charge) || 0;
  const totalMinutes = Number(packageTotalMinutes) || 0;
  const totalDistance = Number(packageTotalDistance) || 0;
  const minPackageCharge = minPerMinCharge * totalMinutes + minPerUnitCharge * totalDistance;
  const maxPackageCharge = maxPerMinCharge * totalMinutes + maxPerUnitCharge * totalDistance;
  const recommendedPackageCharge = minPackageCharge;
  const [riderequestId, setRideRequestId] = useState();
  const [bookLoading, setBookLoading] = useState(false);
  const [driverId, setDriverId] = useState([]);
  const { self } = useSelector((state: any) => state.account);
  const pulseCount = 6;
  const pulseDelay = 20;
  const durations = 120;
  const [pulses, setPulses] = useState(Array(pulseCount).fill({ radius: 1000, opacity: 0 }),);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const [isPulsing, setIsPulsing] = useState(false);
  const mapRef = useRef(null);
  const { currentLatitude, currentLongitude } = useSmartLocation();
  const [seletedPayment, setSeletedPayment] = useState(null);
  const [inputValue, setInputValue] = useState(coupon?.code || '');
  const [couponValue, setCouponValue] = useState();
  const [finalPrices, setFinalPrices] = useState({});
  const [selectedFinalPrice, setSelectedFinalPrice] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [fareValue, setFareValue] = useState(0);



  const mainBottomSheetRef = useRef<BottomSheet>(null);
  const vehicleDetailsBottomSheetRef = useRef<BottomSheet>(null);
  const rentalInfoBottomSheetRef = useRef<BottomSheet>(null);
  const paymentBottomSheetRef = useRef<BottomSheet>(null);
  const riderBottomSheetRef = useRef<BottomSheet>(null);
  const couponBottomSheetRef = useRef<BottomSheet>(null);

  const mainSnapPoints = useMemo(() => ['48.5%'], []);
  const vehicleDetailsSnapPoints = useMemo(() => ['80%'], []);
  const rentalInfoSnapPoints = useMemo(() => ['80%'], []);
  const paymentSnapPoints = useMemo(() => ['50%'], []);
  const riderSnapPoints = useMemo(() => ['34%'], []);
  const couponSnapPoint = useMemo(() => ['20%'], []);


  const handleSubSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      mainBottomSheetRef.current?.snapToIndex(0);
    }
  }, []);

  useEffect(() => {
    if (selectedItemData?.charges?.total) {
      setFareValue(selectedItemData.charges.total);
    }
  }, [selectedItemData]);
  const handleOpenVehicleDetails = useCallback((item) => {
    setFareValue(item.charges.total);
    setSelectedItemData(item);
    mainBottomSheetRef.current?.close();
    vehicleDetailsBottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handleOpenRentalInfo = useCallback(() => {
    mainBottomSheetRef.current?.close();
    rentalInfoBottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handleOpenPaymentSheet = useCallback(() => {
    mainBottomSheetRef.current?.close();
    paymentBottomSheetRef.current?.snapToIndex(1);
  }, []);

  const handleOpenRiderSheet = useCallback(() => {
    mainBottomSheetRef.current?.close();
    riderBottomSheetRef.current?.snapToIndex(1);
  }, []);

  const handleOpenCouponSheet = useCallback(() => {
    mainBottomSheetRef.current?.close();
    couponBottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handlecloseCouponSheet = useCallback(() => {
    couponBottomSheetRef.current?.close();
  }, []);

  const handleClosePaymentSheet = useCallback(() => {
    paymentBottomSheetRef.current?.close();
  }, []);

  const handleCloseRiderSheet = useCallback(() => {
    riderBottomSheetRef.current?.close();
  }, []);

  const chooseRider = () => {
    navigate("ChooseRider");
  };

  const handleChooseRiderAndClose = () => {
    handleCloseRiderSheet();
    chooseRider();
  };

  const radioPress = () => {
    setIsChecked(!isChecked);
  };

  const [selectedItem1, setSelectedItem1] = useState<number | null>(null);
  const paymentData = (index: number) => {
    setSelectedItem1(index);
    setSeletedPayment(activePaymentMethods[index].name);
  };

  useEffect(() => {
    if (packageVehicle?.length > 0) {
      setSelectedItem(packageVehicle[0].id);
    }
  }, [packageVehicle]);


  const renderItemRequest = ({ item }) => (
    <CancelRender item={item} pickupLocation={pickupLocation} />
  );

  useEffect(() => {
    const showRequest = () => {
      if (
        Array.isArray(bidValue?.data) &&
        bidValue.data.length > 0 &&
        activeRideRequest
      ) {
        setRideBooked(true);
      }
    };
    showRequest();
  }, [bidValue]);

  const handlePackageSelection = (details) => {
    setSelectedPackageDetails(details);
  };

  const handlepackagevehicle = (vehicleDetails) => {
    setPackageVehicle(vehicleDetails);
  };

  useEffect(() => {
    getVehicleTypes();
  }, []);

  useEffect(() => {
    const geocodeAddress = async (address: string) => {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            address
          )}&key=${Google_Map_Key}`
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
        console.error("Error geocoding address:", error);
      }
      return null;
    };

    const fetchCoordinates = async () => {
      try {
        const pickup = await geocodeAddress(pickupLocation);
        setPickupCoords(pickup);
      } catch (error) {
        console.error("Error fetching coordinates:", error);
      }
    };
    fetchCoordinates();
  }, [pickupLocation]);

  const driverLocations = driverData?.data
    ?.map((driver) => {
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
    ?.filter((driver) => driver !== null);

  const filteredDrivers = selectedVehicleData
    ? driverLocations?.filter(
      (driver) => driver?.vehicleId === selectedVehicleData?.id
    )
    : [];


  const getVehicleTypes = () => {
    const payload = {
      locations: [
        {
          lat: currentLatitude,
          lng: currentLongitude,
        },
      ],
      service_id: service_ID,
      service_category_id: service_category_ID,
    };
    dispatch(vehicleTypeDataGet(payload)).then((res: any) => { });
  };

  useEffect(() => {
    const backAction = () => {
      goBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, [goBack]);

  const mapCustomStyle = isDark ? darkMapStyle : undefined;

  const handleBookRide = () => {
    Keyboard.dismiss();
    setBookLoading(true);
    if (Math.round(recommendedPackageCharge) < Math.round(minPackageCharge * zoneValue?.exchange_rate)) {
      setBookLoading(false);
      return
    } else if (Math.round(recommendedPackageCharge) > Math.round(maxPackageCharge * zoneValue?.exchange_rate)) {
      setBookLoading(false);
      return
    } else {
      setIsExpanding(!isExpanding);
      if (!isExpanding) {
        BookRideRequest(forms);
        startPulseAnimation();
        setIsPulsing(!isPulsing);
        focusOnPickup();
      }
    }
  };

  const handleCancelRide = async () => {
    setBookLoading(true)
    stopPulseAnimation();
    try {
      if (taxidoSettingData?.taxido_values?.activation?.bidding == 0) {
        if (!riderequestId) {
          console.warn('rideRequestId is missing');
          return;
        }
        const topLevelDocRef = firestore().collection('ride_requests').doc(riderequestId);
        const instantRideDocRef = topLevelDocRef.collection('instantRide').doc(riderequestId);
        const instantRideSnap = await instantRideDocRef.get();
        if (!instantRideSnap.exists) {
          console.warn('instantRide ride document does not exist');
          return;
        }
        const instantRideData = instantRideSnap.data();
        const currentDriverId = instantRideData?.current_driver_id;
        const eligibleDriverIds = instantRideData?.eligible_driver_ids || [];
        const queueDriverIds = instantRideData?.queue_driver_id || [];
        const rejectedDriverIds = instantRideData?.rejected_driver_ids || [];
        const allRejected = [
          ...rejectedDriverIds,
          ...(currentDriverId ? [currentDriverId] : []),
          ...eligibleDriverIds,
          ...queueDriverIds,
        ];
        await instantRideDocRef.update({
          status: 'cancel',
          rejected_driver_ids: allRejected,
          eligible_driver_ids: [],
          queue_driver_id: [],
          current_driver_id: null,
        });
        if (currentDriverId) {
          const driverRideRequestsRef = firestore().collection('driver_ride_requests').doc(currentDriverId.toString());
          const driverDocSnap = await driverRideRequestsRef.get();
          if (driverDocSnap.exists) {
            await driverRideRequestsRef.update({
              ride_requests: firestore.FieldValue.delete(),
              current_ride_request: firestore.FieldValue.delete(),
              eligible_driver_ids: firestore.FieldValue.delete(),
            });
          }
        }
        const topLevelSnap = await topLevelDocRef.get();
        if (topLevelSnap.exists) {
          const topLevelData = topLevelSnap.data();
          if (topLevelData) {
            const deleteFieldsUpdate = {};
            Object.keys(topLevelData).forEach(field => {
              deleteFieldsUpdate[field] = firestore.FieldValue.delete();
            });
            await topLevelDocRef.update(deleteFieldsUpdate);
          }
        } else {
          console.warn('Top-level ride_requests doc does not exist');
        }
        setIsExpanding(false);
        setBookLoading(false)
      } else if (taxidoSettingData?.taxido_values?.activation?.bidding == 1) {
        try {
          if (!rideID || !driverId || !Array.isArray(driverId)) {
            console.warn("rideID or driverId missing or invalid");
            return;
          }
          const rideDocId = rideID.toString();
          const driverIds = driverId.map((id) => id.toString());
          await firestore().collection('ride_requests').doc(rideDocId).delete();
          const removePromises = driverIds.map(async (driverId) => {
            const driverDocRef = firestore().collection('driver_ride_requests').doc(driverId);
            const driverDocSnap = await driverDocRef.get();
            if (driverDocSnap.exists) {
              const existingData = driverDocSnap.data();
              if (Array.isArray(existingData?.ride_requests)) {
                const updatedRequests = existingData.ride_requests.filter((req) => req.id?.toString() !== rideDocId);
                await driverDocRef.update({ ride_requests: updatedRequests });
              } else {
                await driverDocRef.update({ ride_requests: firestore.FieldValue.delete() });
              }
            }
          });
          await Promise.all(removePromises);
          setIsExpanding(false);
          setBookLoading(false);
        } catch (error) {
          console.error('Failed to remove ride request from Firebase:', error);
          Alert.alert('Error', 'Could not cancel ride properly.');
          setIsExpanding(false);
          setBookLoading(false);
        }
      }
    } catch (error) {
      console.error('Failed to cancel ride:', error);
      setBookLoading(false)
    }
    setIsExpanding(false);
  };

  useEffect(() => {
    if (ZoneArea && ZoneArea?.length > 1) {
      setRadiusPerVertex(new Array(ZoneArea?.length - 1).fill(0.5));
    }
  }, [ZoneArea]);

  useEffect(() => {
    if (isExpanding) {
      intervalRef.current = setInterval(() => {
        setRadiusPerVertex((prevRadii) =>
          prevRadii?.map((radius, index) => {
            const currentSubZoneVertex = subZone[index] || pickupCoords;
            const distanceToMainZone = turf.distance(
              turf.point([currentSubZoneVertex?.lng, currentSubZoneVertex?.lat]),
              turf.point([ZoneArea[index]?.lng, ZoneArea[index]?.lat]),
              { units: "kilometers" }
            );
            return distanceToMainZone <= incrementDistance
              ? radius
              : radius + incrementDistance;
          })
        );
        expandSubZone();
      }, 5000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isExpanding, subZone, incrementDistance, pickupCoords]);

  const expandSubZone = () => {
    if (!Array.isArray(ZoneArea) || !pickupCoords?.lat || !pickupCoords?.lng) return;
    const expandedPoints = [];
    const newRadiusPerVertex = [];
    for (let i = 0; i < ZoneArea.length - 1; i++) {
      const mainZonePoint = ZoneArea[i];
      if (!mainZonePoint?.lat || !mainZonePoint?.lng) continue;
      const angle = turf.bearing(
        turf.point([pickupCoords.lng, pickupCoords.lat]),
        turf.point([mainZonePoint.lng, mainZonePoint.lat])
      );
      const currentSubZoneVertex = subZone[i] || { lat: pickupCoords.lat, lng: pickupCoords.lng };
      const distanceToMainZone = turf.distance(
        turf.point([currentSubZoneVertex.lng, currentSubZoneVertex.lat]),
        turf.point([mainZonePoint.lng, mainZonePoint.lat]),
        { units: "kilometers" }
      );
      const newRadius = radiusPerVertex[i] ?? 0;
      if (distanceToMainZone <= incrementDistance) {
        expandedPoints.push({ lat: mainZonePoint.lat, lng: mainZonePoint.lng });
        newRadiusPerVertex.push(distanceToMainZone);
      } else {
        const expandedPoint = turf.destination(
          turf.point([pickupCoords.lng, pickupCoords.lat]),
          newRadius + incrementDistance,
          angle,
          { units: "kilometers" }
        );
        const [lng, lat] = expandedPoint.geometry.coordinates;
        if (!isNaN(lat) && !isNaN(lng)) {
          expandedPoints.push({ lat, lng });
          newRadiusPerVertex.push(newRadius + incrementDistance);
        }
      }
    }
    if (expandedPoints.length === 0) return;
    expandedPoints.push(expandedPoints[0]);
    setSubZone(expandedPoints);
    const validPoints = expandedPoints.filter(p => typeof p?.lat === 'number' && typeof p?.lng === 'number');
    if (validPoints.length < 3) return;
    const polygon = turf.polygon([validPoints.map(({ lng, lat }) => [lng, lat])]);
    const messages = filteredDrivers
      ?.map((driver) => {
        if (!driver?.lat || !driver?.lng) return null;
        const point = turf.point([driver.lng, driver.lat]);
        return turf.booleanPointInPolygon(point, polygon) ? driver.id : null;
      })
      .filter(Boolean);
  };

  useEffect(() => {
    dispatch(
      allDriver({
        zones: zoneValue?.data?.[0]?.id,
        is_online: 1,
        is_on_ride: 0,
      })
    );
  }, []);

  const formattedData =
    allLocationCoords && allLocationCoords.length > 0
      ? `[${allLocationCoords
        ?.map((coord) =>
          coord?.lat !== undefined && coord?.lng !== undefined
            ? `{"lat": ${coord.lat}, "lng": ${coord.lng}}`
            : null
        )
        .filter(Boolean)
        .join(", ")}]`
      : "[]";


  const forms = {
    location_coordinates: formattedData !== "[]" ? JSON.parse(formattedData) : [],
    locations: allLocations,
    ride_fare: fareValue,
    service_id: service_ID,
    service_category_id: service_category_ID,
    vehicle_type_id: filteredVehicle?.id,
    distance: selectedPackageDetails?.distance,
    distance_unit: "km",
    payment_method: "cash",
    currency_code: zoneValue?.currency_code,
    wallet_balance: null,
    coupon: inputValue,
    description: null,
    selectedImage: { uri: null, type: null, fileName: null },
    hourly_package_id: selectedPackageDetails?.id,
  };

  const BookRideRequest = async (forme) => {
    const token = await getValue("token");
    try {
      const formData = new FormData();
      forme.location_coordinates.forEach((coord, index) => {
        formData.append(`location_coordinates[${index}][lat]`, coord.lat);
        formData.append(`location_coordinates[${index}][lng]`, coord.lng);
      });
      forme.locations.forEach((loc, index) => {
        formData.append(`locations[${index}]`, loc);
      });
      formData.append("ride_fare", forme.ride_fare);
      formData.append("service_id", forme.service_id);
      formData.append("service_category_id", forme.service_category_id);
      formData.append("vehicle_type_id", forme.vehicle_type_id);
      formData.append("distance", forme.distance);
      formData.append("distance_unit", forme.distance_unit);
      formData.append("payment_method", forme.payment_method);
      formData.append("wallet_balance", forme.wallet_balance || "");
      formData.append("currency_code", forme.currency_code || "");
      formData.append("coupon", forme.coupon || "");
      formData.append("description", forme.description);
      formData.append("hourly_package_id", forme.hourly_package_id);



      const response = await fetch(`${URL}/api/rideRequest`, {
        method: 'POST', body: formData, headers: {
          'Content-Type': 'multipart/form-data',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = await response.json();

      if (response.status == 403) {
        notificationHelper('', translateData.loginAgain, 'error');
        await clearValue('token');
        navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
        return;
      }

      if (response.ok) {
        setStartDriverRequest(true);
        setRideId(responseData?.id);
        setDriverId(responseData?.drivers);

        if (taxidoSettingData?.taxido_values?.activation?.bidding == 1) {
          try {
            const rideId = responseData?.id.toString();
            const storePromises = responseData?.drivers.map(async driverId => {
              const driver_Ids = driverId.toString();
              firestore().collection('driver_ride_requests').doc(driver_Ids).set(
                { ride_requests: firestore.FieldValue.arrayUnion({ id: rideId, driver_id: responseData?.drivers }) },
                { merge: true }
              );
            });
            await Promise.all(storePromises);
          } catch (error) {
            setBookLoading(false)
            console.error('Failed to store driver ride request:', error);
          }
        }

        try {
          const rideData = {
            coupon: forms.coupon,
            created_at: firestore.Timestamp.now(),
            currency_symbol: zoneValue?.currency_code,
            description: forms.description,
            distance: forms.distance,
            distance_unit: forms.distance_unit,
            hourly_package_id: '',
            id: responseData?.id,
            locations: forms.locations,
            location_coordinates: forms.location_coordinates.map(coord => ({ lat: coord.lat, lng: coord.lng })),
            payment_method: forms.payment_method,
            ride_fare: forms.ride_fare,
            rider_id: self?.id,
            service_category_id: forms.service_category_id,
            service_id: forms.service_id,
            vehicle_type_id: forms.vehicle_type_id,
            wallet_balance: forms.wallet_balance,
            rider: responseData?.data?.rider,
            service: responseData?.data?.service,
            service_category: responseData?.data?.service_category,
            vehicle_type: responseData?.data?.vehicle_type,
            hourly_packages: responseData?.data?.hourly_packages
          };

          if (taxidoSettingData?.taxido_values?.activation?.bidding == 1) {
            const docRef = await firestore().collection('ride_requests').doc(responseData?.id.toString()).set(rideData);
            setRideRequestId(docRef?.id);
            setStartDriverRequest(true);
          } else if (taxidoSettingData?.taxido_values?.activation?.bidding == 0) {
            const rideId = responseData?.id?.toString();
            const allDrivers = responseData?.drivers || [];
            if (!rideId || allDrivers.length === 0) { return; }
            let currentDriverId = null;
            let eligibleDrivers = [];
            let queueDrivers = [];
            for (const driverId of allDrivers) {
              try {
                const driverDocSnap = await firestore().collection('driver_ride_requests').doc(driverId.toString()).get();
                const driverData = driverDocSnap.exists ? driverDocSnap.data() : null;
                const rideRequests = Array.isArray(driverData?.ride_requests) ? driverData.ride_requests : [];
                if (rideRequests.length === 0) {
                  if (!currentDriverId) { currentDriverId = driverId; } else { eligibleDrivers.push(driverId); }
                } else {
                  queueDrivers.push(driverId);
                }
              } catch (err) {
                console.error(`⚠️ Error checking driver ${driverId}`, err);
                setBookLoading(false)
                queueDrivers.push(driverId);
              }
            }
            if (!currentDriverId) {
              queueDrivers = [...allDrivers];
              eligibleDrivers = [];
            }
            rideData.driver_id = currentDriverId || null;
            await firestore().collection('ride_requests').doc(rideId).set(rideData);
            const instantRideData = {
              id: rideId,
              status: 'pending',
              queue_driver_id: queueDrivers,
              eligible_driver_ids: eligibleDrivers,
              rejected_driver_ids: [],
              current_driver_id: currentDriverId || null,
              ride_id: '',
            };
            await firestore().collection('ride_requests').doc(rideId).collection('instantRide').doc(rideId).set(instantRideData);
            setRideRequestId(rideId);
            setStartDriverRequest(true);
          }
        } catch (error) {
          notificationHelper('', 'error || error', 'error');
          setBookLoading(false);
        }
      } else {
        notificationHelper('', responseData.message, 'error');
      }
    } catch (error) {
      console.error("Error in BookRideRequest:", error);
    }
  };

  useEffect(() => {
    if (!riderequestId) return;
    const instantRideRef = firestore().collection('ride_requests').doc(riderequestId).collection('instantRide').doc(riderequestId);
    const unsubscribe = instantRideRef.onSnapshot(async snapshot => {
      if (!snapshot.exists) return;
      const data = snapshot.data();
      const { status, ride_id } = data || {};
      if (status === 'accepted') {
        const rideConfirmId = data?.ride_id;
        if (rideConfirmId) {
          try {
            const rideDoc = await firestore().collection('rides').doc(rideConfirmId.toString()).get();
            if (rideDoc.exists) {
              const rideData = rideDoc.data();
              navigate('RideActive', { activeRideOTP: rideData });
            }
          } catch (err) { console.error('❌ Error fetching ride:', err); }
        }
      }
      if (ride_id) {
        const rideRef = firestore().collection('rides').doc(ride_id.toString());
        const rideSnap = await rideRef.get();
        if (rideSnap.exists) {
          const rideData = rideSnap.data();
          navigate('RideActive', { activeRideOTP: rideData });
        }
      }
    });
    return () => unsubscribe();
  }, [riderequestId, navigate]);

  useEffect(() => {
    if (!riderequestId) return;
    const unsubscribe = firestore().collection('ride_requests').doc(riderequestId.toString()).collection('instantRide').doc(riderequestId.toString())
      .onSnapshot(async docSnapshot => {
        if (!docSnapshot.exists) return;
        const data = docSnapshot.data();
        const currentDriverId = data?.current_driver_id;
        if (currentDriverId) {
          const driverDocRef = firestore().collection('driver_ride_requests').doc(currentDriverId.toString());
          try {
            await driverDocRef.set(
              { ride_requests: firestore.FieldValue.arrayUnion({ id: riderequestId, driver_id: currentDriverId }) },
              { merge: true }
            );
          } catch (error) { console.error('❌ Failed to update driver_ride_requests:', error); }
        }
      },
        error => { console.error('❌ Real-time listener error:', error); }
      );
    return () => unsubscribe();
  }, [riderequestId]);

  useEffect(() => {
    if (startDriverRequest && rideID && isExpanding) {
      const ride_request_id = rideID;
      const fetchBidData = async () => {
        await dispatch(bidDataGet({ ride_request_id }));
        setActivateRideRequest(true);
      };
      fetchBidData();
      const intervalId = setInterval(fetchBidData, 5000);
      return () => clearInterval(intervalId);
    }
  }, [startDriverRequest, rideID, isExpanding, dispatch]);

  const startPulseAnimation = () => {
    setBookLoading(false);
    if (animationRef.current) return;
    let tick = 0;
    animationRef.current = setInterval(() => {
      setPulses(() =>
        Array(pulseCount).fill(null).map((_, index) => {
          const offset = index * pulseDelay;
          const progress = (tick - offset + durations) % durations;
          if (progress < durations / 2) {
            const radius = 1000 + (progress / (durations / 2)) * 1000;
            const opacity = 0.5 * (1 - progress / (durations / 2));
            return { radius, opacity };
          } else {
            return { radius: 1000, opacity: 0 };
          }
        })
      );
      tick++;
    }, 50);
    setIsPulsing(true);
  };

  const stopPulseAnimation = async () => {
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

  const hasValidPackageDetails = selectedPackageDetails && Object.values(selectedPackageDetails).some(value => value !== null);
  const activePaymentMethods = zoneValue?.payment_method;


  const renderItem = ({ item }) => (
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
          handleOpenVehicleDetails(item);
        }
      }}
      onPriceCalculated={(id, price) => {
        setFinalPrices(prev => ({ ...prev, [id]: price }));
      }}
    />
  );

  const renderItem1 = ({ item, index }) => (
    <TouchableOpacity onPress={() => paymentData(index)} activeOpacity={0.7}>
      <View style={[styles.modalPaymentView, { backgroundColor: bgContainer, flexDirection: viewRTLStyle }]}>
        <View style={{ flexDirection: viewRTLStyle, flex: 1 }}>
          <View style={styles.imageBg}>
            <Image source={{ uri: item.image_url }} style={styles.paymentImage} />
          </View>
          <View style={styles.mailInfo}>
            <Text style={[styles.mail, { color: textColorStyle, textAlign: textRTLStyle }]}>{item.name}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.payBtn} activeOpacity={0.7}>
          <RadioButton checked={index === selectedItem1} color={appColors.primary} />
        </TouchableOpacity>
      </View>
      {index !== activePaymentMethods.length - 1 ? <View style={styles.borderPayment} /> : null}
    </TouchableOpacity>
  );

  const focusOnPickup = () => {
    if (pickupCoords?.lat && pickupCoords?.lng && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: pickupCoords.lat,
        longitude: pickupCoords.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    }
  };

  const handlePress = () => {
    const payload = {
      coupon: inputValue,
      service_id: service_ID,
      vehicle_type_id: selectedItem,
      locations: [pickupCoords],
      service_category_id: service_category_ID.toString(),
      hourly_package_id: selectedPackageDetails?.id
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



  return (
    <GestureHandlerRootView style={external.fx_1}>
      <View style={[external.fx_1, { backgroundColor: bgContainer }]}>
        <View style={[commonStyles.flexContainer]}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: bgContainer }]} onPress={goBack} activeOpacity={0.7}>
            <Back />
          </TouchableOpacity>
          {mapType === "googleMap" ? (
            <MapView
              ref={mapRef}
              style={[commonStyles.flexContainer]}
              region={{
                latitude: pickupCoords?.lat || 37.78825,
                longitude: pickupCoords?.lng || -122.4324,
                latitudeDelta: 0.015,
                longitudeDelta: 0.0121,
              }}
              showsUserLocation={true}
              customMapStyle={mapCustomStyle}
            >
              <Polygon
                coordinates={ZoneArea?.filter(item => item?.lat && item?.lng).map(({ lng, lat }) => ({ latitude: lat, longitude: lng }))}
                strokeColor="rgba(0,0,0,0)"
                fillColor="rgba(0,0,0,0)"
                strokeWidth={2}
              />
              {subZone.length > 0 && (
                <Polygon
                  coordinates={subZone.map(({ lat, lng }) => ({ latitude: lat, longitude: lng }))}
                  strokeColor="rgba(0, 0, 0, 0)"
                  fillColor="rgba(0, 0, 0, 0)"
                  strokeWidth={2}
                />
              )}
              {filteredDrivers?.map((driver, index) => (
                <Marker key={index} coordinate={{ latitude: driver.lat, longitude: driver.lng }} title={`${translateData.driver} ${index + 1}`}>
                  <CustomMarker imageUrl={selectedVehicleData?.vehicle_map_icon?.original_url} />
                </Marker>
              ))}
              {pickupCoords && (
                <>
                  <Marker coordinate={{ latitude: pickupCoords.lat, longitude: pickupCoords.lng }} title={translateData.pickupLocation} pinColor={appColors.primary} />
                  {isPulsing && pulses.map((pulse, index) => (
                    <Circle
                      key={index}
                      center={{ latitude: pickupCoords.lat, longitude: pickupCoords.lng }}
                      radius={pulse.radius}
                      strokeColor="rgba(0,0,0,0)"
                      fillColor={`rgba(25, 150, 117,${pulse.opacity})`}
                    />
                  ))}
                </>
              )}
            </MapView>
          ) : (
            <WebView
              originWhitelist={["*"]}
              source={{ html: "mapHtml" }}
              style={styles.webview}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          )}
        </View>

        {RideBooked && (
          <View style={[external.mt_10, external.mh_15, styles.listView]}>
            <FlatList
              renderItem={renderItemRequest}
              data={bidValue?.data?.length > 0 ? [bidValue?.data[0]] : []}
              keyExtractor={(item) => item.id.toString()}
            />
          </View>
        )}

        {/* MODIFIED: Main bottom sheet is now non-closeable via swipe */}
        <BottomSheet
          ref={mainBottomSheetRef}
          index={0}
          snapPoints={mainSnapPoints}
          enablePanDownToClose={false}
          backgroundStyle={{ backgroundColor: bgContainer }}
          handleIndicatorStyle={{ backgroundColor: textColorStyle }}
        >
          <BottomSheetView style={[external.fx_1, external.ph_10]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.choosePackage, { color: textColorStyle, textAlign: textRTLStyle }]}>{translateData.chooseaPackage}</Text>
              <KmDetails onPackageSelect={handlePackageSelection} onpackageVehicle={handlepackagevehicle} zoneValue={zoneValue} />
              {hasValidPackageDetails && (
                <>
                  <Text style={[styles.carType, { color: textColorStyle, textAlign: textRTLStyle }]}>{translateData.vehicletype}</Text>
                  <View style={{ marginLeft: windowWidth(10) }}>
                    <FlatList
                      horizontal
                      data={packageVehicle}
                      renderItem={renderItem}
                      keyExtractor={(item) => item.id.toString()}
                      showsHorizontalScrollIndicator={false}
                    />
                  </View>
                </>
              )}
            </ScrollView>
            <View>
              <View
                style={[
                  styles.cardView,
                  {
                    flexDirection: viewRTLStyle,
                  },
                ]}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleOpenPaymentSheet}
                  style={[
                    styles.switchUser,
                    {
                      flexDirection: viewRTLStyle,
                      width: "49%",
                      backgroundColor: appColors.lightGray,
                    },
                  ]}>
                  <View style={styles.userIcon}>
                    <Card />
                  </View>
                  <Text
                    style={[
                      styles.selectText,
                      { color: textColorStyle },
                      styles.selectedText,
                    ]}>
                    {seletedPayment ? seletedPayment : translateData.payment}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleOpenRiderSheet}
                  style={[
                    styles.switchUser,
                    {
                      flexDirection: viewRTLStyle,
                      width: "49%",
                      backgroundColor: appColors.lightGray,
                    },
                  ]}>
                  <View style={styles.userIcon}>
                    <User />
                  </View>
                  <Text
                    style={[
                      styles.selectText,
                      { color: textColorStyle },
                      styles.selectedText,
                    ]}>
                    {translateData.myself}
                  </Text>
                </TouchableOpacity>

              </View>
              <View style={[external.mv_13]}>
                {!isExpanding ? (
                  <Button title={translateData.bookRide} onPress={handleBookRide} loading={bookLoading} disabled={bookLoading} />
                ) : (
                  <Button title={translateData.cancelRide} backgroundColor={appColors.textRed} onPress={handleCancelRide} loading={bookLoading} disabled={bookLoading} />
                )}
              </View>
            </View>
          </BottomSheetView>
        </BottomSheet>

        <BottomSheet ref={vehicleDetailsBottomSheetRef} index={-1} snapPoints={vehicleDetailsSnapPoints} enablePanDownToClose={true} onChange={handleSubSheetChanges} backgroundStyle={{ backgroundColor: bgContainer }} handleIndicatorStyle={{ backgroundColor: textColorStyle }}>
          <BottomSheetView>
            <ModalContainers selectedItemData={selectedItemData} onPress={() => vehicleDetailsBottomSheetRef.current?.close()} />
          </BottomSheetView>
        </BottomSheet>

        <BottomSheet ref={paymentBottomSheetRef} index={-1} snapPoints={paymentSnapPoints} enablePanDownToClose={true} onChange={handleSubSheetChanges} backgroundStyle={{ backgroundColor: bgContainer }} handleIndicatorStyle={{ backgroundColor: textColorStyle }}>
          <BottomSheetView style={[external.fx_1, external.ph_20]}>
            <Text style={[styles.payment, { color: textColorStyle, textAlign: textRTLStyle, marginBottom: 15 }]}>{translateData.paymentMethodSelect}</Text>
            <FlatList data={activePaymentMethods} renderItem={renderItem1} keyExtractor={(item) => item?.name?.toString()} showsVerticalScrollIndicator={false} />
            <Button title={translateData.confirm} onPress={handleClosePaymentSheet} containerStyle={external.mv_15} />
          </BottomSheetView>
        </BottomSheet>

        <BottomSheet ref={riderBottomSheetRef} index={-1} snapPoints={riderSnapPoints} enablePanDownToClose={true} onChange={handleSubSheetChanges} backgroundStyle={{ backgroundColor: bgContainer }} handleIndicatorStyle={{ backgroundColor: textColorStyle }}>
          <BottomSheetView style={[external.fx_1, external.ph_20]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={[commonStyles.mediumText23, { color: textColorStyle, textAlign: textRTLStyle }]}>{translateData.talkingRide}</Text>
                <Text style={[commonStyles.regularText, external.mt_3, { fontSize: fontSizes.FONT16, lineHeight: windowHeight(14), textAlign: textRTLStyle }]}>{translateData.notice}</Text>
              </TouchableOpacity>
              <View style={[external.mt_20]}>
                <View style={[external.fd_row, external.ai_center, external.js_space, { flexDirection: viewRTLStyle }]}>
                  <View style={[external.fd_row, { flexDirection: viewRTLStyle }]}><UserFill /><Text style={[commonStyles.mediumTextBlack12, external.mh_2, { fontSize: fontSizes.FONT19 }, { color: textColorStyle }]}>{translateData.myself}</Text></View>
                  <Pressable style={{ backgroundColor: appColors.selectPrimary, borderRadius: windowHeight(48) }}><RadioButton onPress={radioPress} checked={isChecked} color={appColors.primary} /></Pressable>
                </View>
                <SolidLine marginVertical={14} />
                <TouchableOpacity onPress={chooseRider} activeOpacity={0.7} style={[external.fd_row, external.js_space, { flexDirection: viewRTLStyle }]}>
                  <View style={[external.fd_row, external.ai_center, { flexDirection: viewRTLStyle }]}>
                    <NewContact />
                    <Text style={[styles.chooseAnotherAccount]}>{translateData.contact}</Text>
                  </View>
                  <Forword />
                </TouchableOpacity>
              </View>
              <View style={[external.fd_row, external.js_space, external.mt_25]}>
                <Button width={"47%"} backgroundColor={appColors.lightGray} title={translateData.cancel} textColor={appColors.primaryText} onPress={handleCloseRiderSheet} />
                <Button width={"47%"} title={translateData.continue} onPress={handleChooseRiderAndClose} />
              </View>
            </ScrollView>
          </BottomSheetView>
        </BottomSheet>

        <BottomSheet ref={rentalInfoBottomSheetRef} index={-1} snapPoints={rentalInfoSnapPoints} enablePanDownToClose={true} onChange={handleSubSheetChanges} backgroundStyle={{ backgroundColor: isDark ? appColors.darkPrimary : appColors.whiteColor }} handleIndicatorStyle={{ backgroundColor: textColorStyle }}>
          <BottomSheetView style={external.fx_1}>
            <ScrollView>
              <TouchableOpacity activeOpacity={0.7} style={styles.close} onPress={() => rentalInfoBottomSheetRef.current?.close()}><Close /></TouchableOpacity>
              <Text style={[commonStyles.extraBold, external.ti_center, { color: isDark ? appColors.whiteColor : appColors.primaryText, marginTop: windowHeight(10) }]}>{translateData.rentalRide}</Text>
              <Image style={styles.carTwo} source={Images.carTwo} />
              <View style={external.ph_20}>
                <View style={{ flexDirection: viewRTLStyle, justifyContent: "space-between" }}>
                  <Text style={[commonStyles.extraBold, external.pv_10, { color: isDark ? appColors.whiteColor : appColors.primaryText }]}>{translateData.incorporated}</Text>
                  <View style={{ flexDirection: viewRTLStyle, marginVertical: windowHeight(4.8) }}><UserFill /><Text style={styles.total}>5</Text></View>
                </View>
                <SolidLine />
                <View style={[external.mt_5]}><ModalContainer data={modelData} /></View>
                <SolidLine />
                <Text style={[commonStyles.extraBold, external.mt_10, { color: isDark ? appColors.whiteColor : appColors.primaryText }]}>{translateData.policiesFees}</Text>
                <View style={[external.mt_5]}><ModalContainer data={feesPolicies} /></View>
              </View>
            </ScrollView>
          </BottomSheetView>
        </BottomSheet>

        <BottomSheet
          ref={couponBottomSheetRef}
          index={-1}
          snapPoints={couponSnapPoint}
          onChange={handleSubSheetChanges}
          backgroundStyle={{ backgroundColor: bgContainer }}
          handleIndicatorStyle={{ backgroundColor: textColorStyle }}
          enablePanDownToClose={true}
          enableContentPanningGesture={true}
          enableHandlePanningGesture={false}

        >
          <BottomSheetView style={[external.fx_1, external.ph_10]}>
            <View>
              <View>
                <TouchableOpacity
                  style={{
                    alignSelf: 'flex-end',
                    marginHorizontal: windowWidth(15),
                  }}
                  onPress={handlecloseCouponSheet}
                >
                  <CloseCircle />
                </TouchableOpacity>
                <Text
                  style={[
                    styles.payment,
                    { color: textColorStyle, textAlign: textRTLStyle },
                  ]}>
                  {translateData.applyCoupons}
                </Text>
              </View>
              <View>
                <View
                  style={[
                    styles.containerCouponMain,
                    { flexDirection: viewRTLStyle },
                    {
                      backgroundColor: bgContainer,
                      borderColor: isDark ? appColors.darkBorder : appColors.border,
                    },
                  ]}>
                  <TextInput
                    style={[styles.input, { color: textColorStyle }]}
                    value={inputValue}
                    onChangeText={setInputValue}
                    placeholder={translateData.applyPromoCode}
                    placeholderTextColor={appColors.regularText}
                  />
                  <TouchableOpacity
                    style={styles.buttonAdd}
                    onPress={handlePress}
                    activeOpacity={0.7}>
                    <Text style={styles.buttonAddText}>{translateData.apply}</Text>
                  </TouchableOpacity>
                </View>
                <View>
                  {!isValid && (
                    <Text style={styles.invalidPromoText}>
                      {translateData.invalidPromo}
                    </Text>
                  )}
                  {couponValue?.success == true && (
                    <Text style={styles.successMessage}>{successMessage}</Text>
                  )}
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
            </View>
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}
