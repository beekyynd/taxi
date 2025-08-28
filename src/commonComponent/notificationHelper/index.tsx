// import { Notifier, NotifierComponents } from "react-native-notifier";

// export function notificationHelper(title, message, type) {
//   Notifier.showNotification({
//     title,
//     description: message,
//     duration: 3000,
//     showAnimationDuration: 800,
//     hideAnimationDuration: 800,
//     Component: NotifierComponents.Alert,
//     componentProps: {
//       alertType: type,
//     },
//   });
// };

import { Notifier } from "react-native-notifier";
import React from "react";
import { View, Text, StyleSheet } from "react-native";

// ✅ Custom Alert Component
const CustomNotification = ({ title, description, alertType }) => {
  const backgroundColor =
    alertType === "error"
      ? "#FF4D4F"
      : alertType === "success"
        ? "#52C41A"
        : alertType === "warn"
          ? "#FAAD14"
          : "#1890FF"; // default/info

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
};

// ✅ Exported Helper Function
export function notificationHelper(title, message, type = "info") {
  Notifier.showNotification({
    title,
    description: message,
    duration: 3000,
    showAnimationDuration: 800,
    hideAnimationDuration: 800,
    Component: CustomNotification,
    componentProps: {
      alertType: type,
    },
  });
}

// ✅ Styles
const styles = StyleSheet.create({
  container: {
    padding: 16,
    elevation: 4,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: 'center'
  },
  description: {
    fontSize: 14,
    color: "#ffffff",
  },
});
