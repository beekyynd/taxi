import React from "react";
import styles from "./styles";
import { View } from "react-native";
import { external } from "@src/styles/externalStyle";

export function ImageLoader() {
  return (
    <View style={[styles.container]}>
      <View style={[external.ai_center]}>
        <View style={styles.img} />
      </View>
      <View style={[external.fd_row, external.js_space, external.mh_8]}>
        <View style={styles.vehicleName} />
      </View>
    </View>
  );
}
