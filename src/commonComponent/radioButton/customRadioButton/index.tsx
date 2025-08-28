import { useTheme } from '@react-navigation/native';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { appColors } from '@src/themes'; 
import { useValues } from '../../../../App';
import styles from './styles';

interface RadioButtonProps {
    label?: string;
    selected: boolean;
    onPress: () => void;
}

export function CustomRadioButton({ label, selected, onPress }: RadioButtonProps) {
    const { viewRTLStyle } = useValues();
    const { colors } = useTheme();
    return (
        <TouchableOpacity onPress={onPress} style={[styles.radioButton, { flexDirection: viewRTLStyle }]} activeOpacity={0.7} >
            <View
                style={[
                    styles.radioButtonOuter,
                    {
                        borderColor: selected ? appColors.lightGreen : appColors.border,
                        backgroundColor: selected ? appColors.lightGreen : colors.background,
                    },
                ]}>
                {selected && <View style={styles.radioButtonInner} />}
            </View>
            <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
    );
};