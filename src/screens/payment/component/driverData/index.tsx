import { View, Text, Image, TouchableOpacity, Share, Linking } from "react-native";
import React, { useState, useEffect } from "react";
import styles from "../../styles";
import { useValues } from "../../../../../App";
import Images from "@utils/images";
import { Call, Message, PlatNumber, RatingEmptyStart, RatingHalfStar, RatingStar, ShareTrip, SOS } from "@utils/icons";
import { useNavigation } from "@react-navigation/native";
import style from "./style";
import { useSelector } from "react-redux";
import { appColors, windowHeight, windowWidth } from "@src/themes";

export function DriverData({ driverDetails, duration, onSOSPress }) {
  const { bgFullStyle, viewRTLStyle, textColorStyle, textRTLStyle } = useValues();
  const { navigate } = useNavigation();
  const [status, setStatus] = useState("ongoing");
  const [endTime, setEndTime] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const { translateData, taxidoSettingData } = useSelector((state) => state.setting);
  const { isDark } = useValues()


  const gotoChat = () => {
    navigate("ChatScreen", { driverId: driverDetails?.driver?.id, riderId: driverDetails?.rider?.id, rideId: driverDetails?.id, driverName: driverDetails?.driver?.name, driverImage: driverDetails?.driver?.profile_image_url });
  };

  const gotoDiler = (phoneNumber: number) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  useEffect(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const formattedCurrentTime = `${formattedHours}:${formattedMinutes} ${ampm}`;
    setCurrentTime(formattedCurrentTime);
    const endTime = new Date(now.getTime() + duration * 60 * 1000);
    const endHours = endTime.getHours();
    const endMinutes = endTime.getMinutes();
    const endAmpm = endHours >= 12 ? "PM" : "AM";
    const formattedEndHours = endHours % 12 || 12;
    const formattedEndMinutes = endMinutes < 10 ? `0${endMinutes}` : endMinutes;
    const formattedEndTime = `${formattedEndHours}:${formattedEndMinutes} ${endAmpm}`;
    setEndTime(formattedEndTime);
  }, []);

  const handleShare = async () => {

    try {
      const result = await Share.share({
        message: `Taxido Details
                            Expected time of arrival: ${endTime}
                            Pickup: ${driverDetails?.locations[0]}
                            Destination: ${driverDetails?.locations[1]}
                            Driver Name : ${driverDetails?.driver?.name}
                            Vehicle details: 
                            Vehicle Type:  ${driverDetails?.vehicle_type?.vehicle_model}, 
                            Plat No:  ${driverDetails?.vehicle_type?.plate_number}`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
        } else {
        }
      } else if (result.action === Share.dismissedAction) {
      }
    } catch (error: any) {
      console.error("Error sharing:", error.message);
    }
  };

  return (
    <View style={[styles.card1, { backgroundColor: bgFullStyle }]}>
      <View style={[styles.subCard1, { flexDirection: viewRTLStyle }]}>
        <View style={{ flexDirection: viewRTLStyle }}>
          <Image
            source={
              driverDetails?.driver?.profile_image_url
                ? { uri: driverDetails?.driver?.profile_image_url }
                : Images.defultImage
            }
            style={styles.driverImage}
          />
          <View style={styles.details}>
            <Text style={[styles.name, { color: textColorStyle }]}>
              {driverDetails?.driver?.name}
            </Text>
            <View style={{ flexDirection: viewRTLStyle }}>
              {Array.from({ length: 5 }).map((_, index) => {
                const fullStarThreshold = index + 1;
                const halfStarThreshold = index + 0.5;
                if (driverDetails?.driver?.rating_count >= fullStarThreshold) {
                  return <RatingStar key={index} />;
                } else if (
                  driverDetails?.driver?.rating_count >= halfStarThreshold
                ) {
                  return <RatingHalfStar key={index} />;
                } else {
                  return <RatingEmptyStart key={index} />;
                }
              })}
              <View style={{ flexDirection: 'row', marginHorizontal: windowWidth(3) }}>
                <Text style={[styles.rating, { color: textColorStyle }]}>
                  {Number(driverDetails?.driver?.rating_count).toFixed(1)}
                </Text>
                <Text style={styles.totalReview}>
                  ({driverDetails?.driver?.review_count})
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: viewRTLStyle }}>
          {taxidoSettingData?.taxido_values?.activation?.sos_enable == 0 && (
            <TouchableOpacity style={[styles.message, { backgroundColor: appColors.alertBg }]} activeOpacity={0.7} onPress={onSOSPress}>
              <SOS />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.message, { backgroundColor: isDark ? appColors.darkBorder : appColors.lightGray }]} onPress={gotoChat} activeOpacity={0.7}>
            <Message />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.call, { backgroundColor: isDark ? appColors.darkBorder : appColors.lightGray }]}
            onPress={() => gotoDiler(driverDetails?.driver?.phone)}
          >
            <Call />
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ borderBottomWidth: 1, borderColor: isDark ? appColors.darkBorder : appColors.border, marginBottom: windowHeight(5) }} />

      <View>
        <View style={{ flexDirection: viewRTLStyle, alignItems: "center" }}>
          <Text
            style={[
              styles.number,
              { color: textColorStyle, textAlign: textRTLStyle },
            ]}
          >
            {driverDetails?.plate_number}
          </Text>
          <PlatNumber />
        </View>
        <View style={[styles.taxiDetail, { flexDirection: viewRTLStyle }]}>
          <Text style={[styles.taxiType, { color: textColorStyle }]}>
            {driverDetails?.vehicle_type?.vehicle_model}
          </Text>
          {status === "ongoing" ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleShare}
              style={[style.shreTripView, {
                flexDirection: viewRTLStyle,
              }]}
            >
              <ShareTrip color={textColorStyle} />
              <Text
                style={[
                  styles.share,
                  { color: textColorStyle, marginBottom: 10 },
                ]}
              >
                {translateData.shareTrip}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View >
  );
}
