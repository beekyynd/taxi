import React from "react";
import { TouchableOpacity, View, Text ,TextStyle } from "react-native";
import styles from "./styles";
import { useValues } from "@App";

type checkBoxProps  = {
  isChecked : boolean, 
  onPress : () => void, 
  label : string, 
  labelStyle?: TextStyle
} 

export default function Checkbox({ isChecked, onPress, label, labelStyle } : checkBoxProps) {
  const {viewRTLStyle}=useValues()
  return (
    <TouchableOpacity
      style={[styles.container,{flexDirection:viewRTLStyle}]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, isChecked && styles.checkedCheckbox]}>
        {isChecked && (
          <View style={styles.tickContainer}>
            <Text style={styles.tick}>✓</Text>
          </View>
        )}
      </View>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
    </TouchableOpacity>
  );
}

