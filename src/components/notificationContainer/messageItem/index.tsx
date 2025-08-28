import { Text, View } from 'react-native';
import React from 'react';
import { styles } from '../messageContainer/styles';
import { external } from '../../../styles/externalStyle';
import { commonStyles } from '../../../styles/commonStyle';
import { useValues } from '../../../../App';
import { appColors } from '@src/themes'; 
import { useTheme } from '@react-navigation/native';

export function MessageItem({ item }) {
    const { isDark, linearColorStyle, textColorStyle, textRTLStyle, viewRTLStyle } = useValues();
    const {colors}=useTheme()
    return (
        <View
            style={[
                styles.container,
                { backgroundColor: isDark ? appColors.darkPrimary : appColors.whiteColor },
                { borderColor: colors.border, flexDirection: viewRTLStyle },
            ]}>
            <View
                style={[
                    styles.viewText,
                    { backgroundColor: isDark ? appColors.greenColor : appColors.lightGreen },
                ]}>
                {item.icon}
            </View>
            <View style={[external.ph_10]}>
                <Text style={[styles.titleText, { color: textColorStyle, textAlign: textRTLStyle }]}>
                    {item.title}
                </Text>
                <Text style={[styles.subTitleText, { color: textColorStyle, textAlign: textRTLStyle }]}>
                    {item.subtitle}
                </Text>
                <Text style={[commonStyles.regularText, external.pt_5, { textAlign: textRTLStyle }]}>
                    {item.time}
                </Text>
            </View>
        </View>
    );
};
