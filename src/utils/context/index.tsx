import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContextType } from '../themeContext';
import { bgFullStyle, iconColorStyle, linearColorStyle, linearColorStyleTwo, textColorStyle, bgFullLayout, bgContainer, ShadowContainer } from '@src/styles/darkStyle';
import { imageRTLStyle, textRTLStyle, viewRTLStyle, viewSelfRTLStyle } from '@src/styles/rtlStyle';


const defaultValues: ThemeContextType = {
    isRTL: false,
    setIsRTL: () => { },
    isDark: false,
    setIsDark: () => { },
    ShadowContainer: '',
    bgContainer: '',
    bgFullLayout: '',
    linearColorStyleTwo: '',
    linearColorStyle: '',
    textColorStyle: '',
    iconColorStyle: '',
    bgFullStyle: '',
    textRTLStyle: '',
    viewRTLStyle: '',
    imageRTLStyle: 0,
    viewSelfRTLStyle: '',
    token: '',
    setToken: '',
    googleMapKey: '',
};

export const CommonContext = createContext<ThemeContextType>(defaultValues);

export const AppContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [isRTL, setIsRTL] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [token, setToken] = useState('');

    const googleMapKey =
        Platform.OS === 'android' ? 'your-android-key' : 'your-ios-key';

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const darkTheme = await AsyncStorage.getItem('darkTheme');
                if (darkTheme) setIsDark(JSON.parse(darkTheme));

                const rtl = await AsyncStorage.getItem('rtl');
                if (rtl) setIsRTL(JSON.parse(rtl));

                const tokenValue = await AsyncStorage.getItem('token');
                if (tokenValue) setToken(JSON.parse(tokenValue));
            } catch (error) {
                console.error('Context load error:', error);
            }
        };

        fetchSettings();
    }, []);

    const contextValues: ThemeContextType = {
        isRTL,
        setIsRTL,
        isDark,
        setIsDark,
        ShadowContainer: ShadowContainer(isDark),
        bgContainer: bgContainer(isDark),
        bgFullLayout: bgFullLayout(isDark),
        linearColorStyleTwo: linearColorStyleTwo(isDark),
        linearColorStyle: linearColorStyle(isDark),
        textColorStyle: textColorStyle(isDark),
        iconColorStyle: iconColorStyle(isDark),
        bgFullStyle: bgFullStyle(isDark),
        textRTLStyle: textRTLStyle(isRTL),
        viewRTLStyle: viewRTLStyle(isRTL),
        imageRTLStyle: imageRTLStyle(isRTL),
        viewSelfRTLStyle: viewSelfRTLStyle(isRTL),
        token,
        setToken,
        googleMapKey,
    };

    return (
        <CommonContext.Provider value={contextValues}>
            {children}
        </CommonContext.Provider>
    );
};

export const useValues = () => useContext(CommonContext);
