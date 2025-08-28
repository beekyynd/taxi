import { View, Text, Image, TouchableOpacity, Modal, TextInput, ActivityIndicator } from "react-native";
import React, { useState, useEffect, useContext, useRef } from "react";
import { Button, notificationHelper } from "@src/commonComponent";
import styles from "./styles";
import Images from "@utils/images";
import { Back, StarEmpty, StarFill } from "@utils/icons";
import { appColors } from "@src/themes";
import { useValues } from "../../../App";
import { DriverData } from "./component/driverData/index";
import { TotalFare } from "./component/totalFare/index";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import MapView, { Marker, Polyline } from "react-native-maps";
import { allRides, paymentsData } from "@src/api/store/actions";
import { CustomBackHandler } from "@src/components";
import { useAppNavigation } from "@src/utils/navigation";
import { external } from "@src/styles/externalStyle";
import { clearValue } from "@src/utils/localstorage";
import firestore from '@react-native-firebase/firestore';

const calculateBearing = (startLat, startLng, endLat, endLng) => {
  const toRadians = (degree) => degree * (Math.PI / 180);
  const toDegrees = (radian) => radian * (180 / Math.PI);

  const lat1 = toRadians(startLat);
  const lat2 = toRadians(endLat);
  const dLng = toRadians(endLng - startLng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance * 1000;
};

export function PaymentRental() {
  const dispatch = useDispatch();
  const [modalVisible, setModalVisible] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const { linearColorStyle, bgFullStyle, textColorStyle, textRTLStyle, viewRTLStyle, Google_Map_Key } = useValues();
  const route = useRoute();
  const { rideId } = route.params;
  const { navigate, goBack } = useAppNavigation();
  const { rideData } = useSelector((state) => state.allRide);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");
  const [location, setLocation] = useState(null);
  const [heading, setHeading] = useState(0);
  const [distanceCovered, setDistanceCovered] = useState(0);
  const [coordinates, setCoordinates] = useState([]);
  const markerRef = useRef(null);
  const previousLocation = useRef(null);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const { translateData } = useSelector((state) => state.setting);
  const navigation = useNavigation()
  const [rideDatas, setRideData] = useState(null);
  const [duration, setDuration] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalDistance, setTotalDistance] = useState(null);
  const origin = rideDatas?.location_coordinates?.[0];
  const ridePath = rideDatas?.ride_path;



  useEffect(() => {
    if (origin && ridePath?.length > 0) {
      fetchOnRoadPath();
    }
  }, [rideDatas]);

  function decodePolyline(encoded) {
    let points = [];
    let index = 0, lat = 0, lng = 0;

    while (index < encoded.length) {
      let b, shift = 0, result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += deltaLat;
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const deltaLng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += deltaLng;
      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }
    return points;
  }


  const fetchOnRoadPath = async () => {
    try {
      const originStr = `${origin.lat},${origin.lng}`;
      const dest = ridePath[ridePath.length - 1];
      const destinationStr = `${dest.latitude},${dest.longitude}`;
      const waypointsStr = ridePath
        .slice(0, -1)
        .map(p => `${p.latitude},${p.longitude}`)
        .join('|');

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&waypoints=${waypointsStr}&key=${Google_Map_Key}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.routes.length) {
        const encodedPolyline = json.routes[0].overview_polyline.points;
        const decodedPoints = decodePolyline(encodedPolyline);
        setRouteCoords(decodedPoints);
        const totalMeters = json.routes[0].legs.reduce((acc, leg) => {
          return acc + leg.distance.value; 
        }, 0);

        const distanceInKm = (totalMeters / 1000).toFixed(2);
        setTotalDistance(distanceInKm);

      } else {
        console.warn('No route found');
      }
    } catch (e) {
      console.error('Error fetching directions:', e);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (!rideId) return;
    const unsubscribe = firestore()
      .collection('rides')
      .doc(rideId.toString())
      .onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          setRideData(data);
        } else {
        }
      });

    return () => unsubscribe();
  }, [rideId]);


  useEffect(() => {
    dispatch(paymentsData())
      .unwrap()
      .then((res: any) => {

        if (res?.status == 403) {
          notificationHelper('', translateData.loginAgain, 'error');
          clearValue('token').then(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'SignIn' }],
            });
          });
        }
      })
      .catch((error) => {
        console.error("Error in paymentsData:", error);
      });
  }, []);


  useEffect(() => {
    if (isRunning && rideData?.start_time) {
      const timerInterval = setInterval(() => {
        const now = new Date();

        const [hours, minutes, seconds] = rideData.start_time
          .split(":")
          .map(Number);
        const startTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          hours,
          minutes,
          seconds
        );

        if (!isNaN(startTime.getTime())) {
          const secondsGap = Math.floor(
            (now.getTime() - startTime.getTime()) / 1000
          );
          setElapsedSeconds(secondsGap);

          const hrs = Math.floor(secondsGap / 3600)
            .toString()
            .padStart(2, "0");
          const mins = Math.floor((secondsGap % 3600) / 60)
            .toString()
            .padStart(2, "0");
          const secs = (secondsGap % 60).toString().padStart(2, "0");

          setElapsedTime(`${hrs}:${mins}:${secs}`);
        } else {
          console.error("Invalid start time format:", rideData.start_time);
        }
      }, 1000);
      return () => clearInterval(timerInterval);
    }
  }, [isRunning, rideData?.start_time]);

  const startTrackingLocation = () => {
    getCurrentLocation();
    const locationInterval = setInterval(() => {
      getCurrentLocation();
    }, 5000);
    return () => clearInterval(locationInterval);
  };

  const getCurrentLocation = () => {
    const newLocation = {
      latitude: rideData?.driver?.location[0]?.lat,
      longitude: rideData?.driver?.location[0]?.lng,
    };
    if (previousLocation.current) {
      const newHeading = calculateBearing(
        previousLocation?.current.latitude,
        previousLocation?.current.longitude,
        newLocation?.latitude,
        newLocation?.longitude
      );
      setHeading(newHeading);
      const distance = calculateDistance(
        previousLocation?.current.latitude,
        previousLocation?.current.longitude,
        newLocation?.latitude,
        newLocation?.longitude
      );
      setDistanceCovered((prevDistance) => prevDistance + distance);
    }
    animateMarker(newLocation);
    setLocation(newLocation);
    setCoordinates((prevCoords) => [...prevCoords, newLocation]);
    previousLocation.current = newLocation;
  };

  const animateMarker = (newLocation) => {
    if (markerRef.current) {
      markerRef.current.animateMarkerToCoordinate(newLocation, 500);
    }
  };

  useEffect(() => {
    return () => clearInterval(startTrackingLocation);
  }, []);

  const handleStarPress = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handlePress = (rideData) => {
    navigate("PaymentMethod", { rideData });
    dispatch(allRides())
  };

  const review = () => {
    setModalVisible(false);
    navigate("MyTabs");
  };

  const displayDistance = () => {
    if (!totalDistance) return null;

    const isMile = rideData?.hourly_packages?.distance_type?.toLowerCase() === 'mile';
    const convertedDistance = isMile
      ? (parseFloat(totalDistance) * 0.621371).toFixed(2)
      : totalDistance;

    const unit = isMile ? 'mile' : 'km';
    return `${convertedDistance} ${unit}`;
  };


  return (
    <View style={external.main}>
      <CustomBackHandler />
      <View style={styles.mapSection}>
        {rideDatas?.location_coordinates?.length > 0 ? (
          <MapView
            style={external.main}
            initialRegion={{
              latitude: parseFloat(rideDatas.location_coordinates[0].lat),
              longitude: parseFloat(rideDatas.location_coordinates[0].lng),
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
            followsUserLocation={true}
          >
            <Marker
              coordinate={{
                latitude: parseFloat(rideDatas?.location_coordinates[0]?.lat),
                longitude: parseFloat(rideDatas?.location_coordinates[0]?.lng),
              }}
              title="Start Location"
            />

            <Polyline
              coordinates={routeCoords}
              strokeWidth={5}
              strokeColor={appColors.primary}
            />
          </MapView>
        ) : (
          <View style={[external.ai_center, external.js_center, external.main]}>
            <ActivityIndicator size="large" color={appColors.primary} />
          </View>

        )}
      </View>
      <View style={{ flex: 0.3, backgroundColor: linearColorStyle }} />
      <TouchableOpacity onPress={() => goBack()} style={styles.backIconView} activeOpacity={0.7}>
        <Back />
      </TouchableOpacity>
      <View style={[styles.viewMain, { flexDirection: viewRTLStyle }]}>
        <View
          style={[
            styles.usedView,
            { flexDirection: viewRTLStyle },
            {
              backgroundColor:
                elapsedTime > `${rideData?.hourly_package?.hour}:00:00`
                  ? appColors.alertRed
                  : appColors.primary,
            },
          ]}
        >
          <View style={styles.totalView}>
            <Text style={{ color: appColors.categoryTitle }}>
              {translateData.used}
            </Text>
            <Text style={{ color: appColors.whiteColor }}>{elapsedTime}</Text>
          </View>
          <View style={styles.totalMainView} />
          <View style={styles.totalView}>
            <Text style={{ color: appColors.categoryTitle }}>
              {translateData.total}
            </Text>
            <Text style={{ color: appColors.whiteColor }}>
              {rideData?.hourly_packages?.hour}:00:00
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.usedView,
            { flexDirection: viewRTLStyle },
            {
              backgroundColor:
                distanceCovered / 1000 > rideData?.hourly_package?.distance
                  ? appColors.alertRed
                  : appColors.primary,
            },
          ]}
        >
          <View style={styles.totalView}>
            <Text style={{ color: appColors.categoryTitle }}>
              {translateData.used}
            </Text>
            <Text style={{ color: appColors.whiteColor }}>
              {displayDistance()}
            </Text>
          </View>
          <View style={styles.totalMainView} />
          <View style={styles.totalView}>
            <Text style={{ color: appColors.categoryTitle }}>
              {translateData.total}
            </Text>
            <Text style={{ color: appColors.whiteColor }}>
              {rideDatas?.hourly_packages?.distance}{" "}
              {rideData?.hourly_packages?.distance_type}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.mainView}>
        <DriverData driverDetails={rideDatas} duration={duration} />
        <View style={[styles.card2, { backgroundColor: bgFullStyle }]}>
          <TotalFare
            handlePress={() => handlePress(rideDatas)}
            fareAmount={rideDatas?.total || 0}
            rideStatus={rideDatas?.ride_status?.slug || ""}
          />
          <Modal
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
              setModalVisible(false);
            }}
          >
            <View style={styles.bgmodal}>
              <View
                style={[styles.background, { backgroundColor: bgFullStyle }]}
              >
                <Text style={[styles.title, { color: textColorStyle }]}>
                  {translateData.modalTitle}
                </Text>
                <View style={styles.userAlign}>
                  <Image
                    source={Images.profileUser}
                    style={styles.modalImage}
                  />
                  <Text style={[styles.modalName, { color: textColorStyle }]}>
                    {translateData.name}
                  </Text>
                  <Text style={[styles.modalMail, { color: textColorStyle }]}>
                    {translateData.mailID}
                  </Text>
                </View>
                <Image source={Images.lineBottom} style={styles.lineImage} />
                <Text
                  style={[
                    styles.rate,
                    { color: textColorStyle, textAlign: textRTLStyle },
                  ]}
                >
                  {translateData.driverRating}
                </Text>
                <View
                  style={[
                    styles.containerReview,
                    { flexDirection: viewRTLStyle },
                  ]}
                >
                  {[1, 2, 3, 4, 5]?.map((index) => (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      key={index}
                      onPress={() => handleStarPress(index)}
                      style={styles.starIcon}
                    >
                      {index <= rating ? <StarFill /> : <StarEmpty />}
                    </TouchableOpacity>
                  ))}
                  <View
                    style={[styles.ratingView, { flexDirection: viewRTLStyle }]}
                  >
                    <View style={styles.borderVertical} />
                    <Text style={[styles.rating, { color: textColorStyle }]}>
                      {rating}/5
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.comment,
                    { color: textColorStyle, textAlign: textRTLStyle },
                  ]}
                >
                  {translateData.addComments}
                </Text>
                <TextInput
                  style={[
                    styles.textinput,
                    { color: textColorStyle, textAlign: textRTLStyle },
                  ]}
                  multiline={true}
                  textAlignVertical="top"
                />
                <View style={styles.border2} />
                <View style={styles.buttonView}>
                  <Button
                    width={330}
                    backgroundColor={appColors.primary}
                    textColor={appColors.whiteColor}
                    title={translateData.submit}
                    onPress={review}
                  />
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </View>
  );
}
