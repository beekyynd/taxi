import { View, Text, ActivityIndicator } from "react-native";
import React from "react";
import { useValues } from "../../../../../App";
import styles from "../../styles";
import { PlatNumber } from "@utils/icons";
import { appColors } from "@src/themes";
import { useSelector } from "react-redux";

export function TexiDetail({ otp, vehicleData }: { otp: number, vehicleData: any }) {
  const { viewRTLStyle, textRTLStyle, textColorStyle, viewSelfRTLStyle } = useValues();
  const { translateData } = useSelector((state) => state.setting);
  return (
    <>
      {otp ? (
        <View style={[styles.texiDetail, { flexDirection: viewRTLStyle }]}>
          <View style={styles.detailView}>
            <View style={{ flexDirection: viewRTLStyle, alignItems: "center" }}>
              <Text
                style={[
                  styles.texiNo,
                  { color: textColorStyle, textAlign: textRTLStyle },
                ]}
              >{vehicleData?.plate_number}
              </Text>
              <PlatNumber />
            </View>
            <Text
              style={[
                styles.textName,
                { color: textColorStyle, textAlign: textRTLStyle },
              ]}
            >
              {vehicleData?.vehicle_model}
            </Text>
          </View>
          <View style={[styles.pinView, { alignItems: viewSelfRTLStyle }]}>
            <View style={{ flexDirection: viewRTLStyle }}>
              {otp
                ? otp
                  .toString()
                  .split("")
                  ?.map((digit, index) => (
                    <Text key={index} style={styles.pin}>
                      {digit}
                    </Text>
                  ))
                : null}
            </View>

            <Text
              style={[
                styles.pinTitle,
                { color: textColorStyle, textAlign: textRTLStyle },
              ]}
            >
              {translateData.pin}
            </Text>
          </View>
        </View>
      ) : (
        <View style={[styles.loader, { flexDirection: viewRTLStyle }]}>
          <ActivityIndicator size="large" color={appColors.primary} />
        </View>
      )}
    </>
  );
}
