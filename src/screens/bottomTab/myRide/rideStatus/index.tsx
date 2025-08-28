import { FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { ridesStatusData } from '../../../../data/rideStatus/index';
import { appColors } from '@src/themes';
import { styles } from './styles';
import { commonStyles } from '../../../../styles/commonStyle';
import { ActiveRide } from './activeRide/index';
import { PendingRide } from './pendingRide/index';
import { CompletedRide } from './completedRide/index';
import { CancelRide } from './cancelRide/index';
import { ScheduleRide } from './scheduleRide/index';
import { useValues } from '../../../../../App';
import { useLoadingContext } from '@src/utils/context';
import { SkeletonRideStatus } from './component';
import { useFocusEffect } from '@react-navigation/native';

export function RideStatus() {
  const { isRTL, isDark } = useValues();
  const { addressLoaded, setAddressLoaded } = useLoadingContext();
  const [selected, setSelected] = useState(0);
  const rideStatusData = ridesStatusData();
  const isMounted = useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      setSelected(0);
    }, [])
  );

  useEffect(() => {
    if (!isMounted.current && !addressLoaded) {
      isMounted.current = true;
      setAddressLoaded(true);
    }
  }, [addressLoaded, setAddressLoaded]);

  const renderRideContent = useMemo(() => {
    switch (selected) {
      case 0:
        return <ActiveRide />;
      case 1:
        return <PendingRide />;
      case 2:
        return <ScheduleRide />;
      case 3:
        return <CompletedRide />;
      case 4:
        return <CancelRide />;
      default:
        return null;
    }
  }, [selected]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => setSelected(item.id)}
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? appColors.darkPrimary
            : appColors.whiteColor,
        },
        { borderColor: isDark ? appColors.darkBorder : appColors.border },
        item.id === selected ? { borderColor: appColors.primary } : null,
      ]}>
      <Text
        style={[
          commonStyles.mediumTextBlack12,
          item.id === selected
            ? { color: appColors.primary }
            : { color: appColors.regularText },
        ]}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  if (!addressLoaded) {
    return <SkeletonRideStatus />;
  }

  return (
    <View>
      <View style={styles.mainView}>
        <FlatList
          showsHorizontalScrollIndicator={false}
          horizontal
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          data={rideStatusData}
          inverted={isRTL}
        />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderRideContent}
      </ScrollView>
    </View>
  );
}
