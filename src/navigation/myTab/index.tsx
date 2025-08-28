import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../../screens/homeScreen/home/index';
import { Category, HistoryEmpty, HistoryFill, Home, HomeLight, Setting, SettingPrimary } from '@utils/icons';
import { ProfileSetting } from '../../screens/bottomTab/profileTab/profileSetting/index';
import { RideScreen } from '../../screens/bottomTab/myRide/RideScreen/index';
import { CategoryScreen } from '../../screens/bottomTab/category/categoryScreen/index';
import { appColors, windowHeight } from '@src/themes';
import { SafeAreaView, StatusBar, Text, TouchableOpacity, Vibration } from 'react-native';
import { useValues } from '../../../App';
import styles from './styles';
import { useSelector } from 'react-redux';

const Tab = createBottomTabNavigator();

export function MyTabs() {

  const { translateData } = useSelector((state: any) => state.setting);

  const { isDark, isRTL } = useValues();
  const screens = [
    {
      name: 'HomeScreen',
      component: HomeScreen,
      label: translateData?.home,
      icon: ({ focused }) => focused
        ? <Home colors={appColors.primary} width={24} height={24} />
        : <HomeLight />,
    },
    {
      name: 'CategoryScreen',
      component: CategoryScreen,
      label: translateData?.services,
      icon: ({ focused }) => focused
        ? <Category fill={appColors.primary} colors={appColors.primary} />
        : <Category colors={appColors.regularText} />,
    },
    {
      name: 'RideScreen',
      component: RideScreen,
      label: translateData?.history,
      icon: ({ focused }) => focused ? <HistoryFill /> : <HistoryEmpty />,
    },
    {
      name: 'Profile',
      component: ProfileSetting,
      label: translateData?.setting,
      icon: ({ focused }) => focused
        ? <SettingPrimary />
        : <Setting colors={appColors.regularText} />,
    },
  ];

  const orderedScreens = isRTL ? [...screens].reverse() : screens;

  return (
    <SafeAreaView style={{ ...styles.flex, backgroundColor: isDark ? appColors.primaryText : appColors.lightGray }}>
      <Tab.Navigator
        initialRouteName="HomeScreen"
        screenOptions={{
          lazy: true,
          tabBarStyle: {
            ...styles.tabBar,
            borderTopColor: isDark ? appColors.primaryText : appColors.lightGray,
            backgroundColor: isDark ? appColors.darkHeader : appColors.whiteColor,
            borderTopRightRadius: windowHeight(20),
            borderTopLeftRadius: windowHeight(20),
          },
          headerShown: false,
        }}
      >
        {orderedScreens.map(({ name, component, label, icon }) => (
          <Tab.Screen
            key={name}
            name={name}
            component={component}
            options={{
              tabBarLabel: ({ focused }) => (
                <Text
                  style={[
                    styles.text,
                    {
                      color: focused ? appColors.primary : appColors.regularText,
                      textAlign: isRTL ? 'right' : 'left',
                      writingDirection: isRTL ? 'rtl' : 'ltr',
                    },
                  ]}
                >
                  {label}
                </Text>
              ),
              tabBarIcon: icon,
              tabBarButton: (props) => (
                <TouchableOpacity
                  {...props}
                  onPress={() => {
                    Vibration.vibrate(42);
                    props.onPress?.();
                  }}
                />
              ),
            }}
          />
        ))}
      </Tab.Navigator>

    </SafeAreaView>
  );
}
