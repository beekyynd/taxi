import { Pressable, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import React from "react";
import { commonStyles } from "../../styles/commonStyle";
import { styles } from "./styles";
import { ButtonProps } from "./types";
import { appColors } from "@src/themes";

export function Button({ title, onPress, width, backgroundColor, textColor, loading }: ButtonProps) {
  const widthNumber = width || "100%";

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[
        styles.container,
        {
          width: widthNumber,
          backgroundColor: backgroundColor || appColors.primary,

        },
      ]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator
          size="large"
          color={textColor || appColors.whiteColor}
          style={{ alignSelf: "center" }}
        />
      ) : (
        <Text
          style={[
            commonStyles.extraBold,
            { color: textColor || appColors.whiteColor },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
