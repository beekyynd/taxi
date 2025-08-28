import React, { useState } from 'react';
import { View, Dimensions } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';
import { OfferItem } from './sliderItem/index';
import { OfferItemType } from './sliderItem/types';
import { useValues } from '../../../../App';
import styles from '../headerContainer/styles';
import { windowHeight } from '@src/themes';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

export function HomeSlider({ onSwipeStart, onSwipeEnd, bannerData }) {
  const { isRTL } = useValues();
  const scrollOffsetValue = useSharedValue<number>(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const bannerDataArray: OfferItemType[] = bannerData || [];

  const renderItem = ({ item }: { item: OfferItemType }) => (
    <OfferItem item={item} />
  );

  const handleGestureEvent = event => {
    if (event.nativeEvent.state === State.ACTIVE) {
      onSwipeStart();
    } else if (
      event.nativeEvent.state === State.END ||
      event.nativeEvent.state === State.CANCELLED
    ) {
      onSwipeEnd();
    }
  };

  return (
    <PanGestureHandler onHandlerStateChange={handleGestureEvent}>
      <View style={styles.swipeContainer}>

        <Carousel
          loop
          width={width}
          height={windowHeight(155)}
          autoPlay
          autoPlayInterval={5000}
          data={bannerDataArray}
          renderItem={renderItem}
          style={{ width: '100%' }}
          defaultScrollOffsetValue={scrollOffsetValue}
          pagingEnabled
          snapEnabled
          inverted={isRTL}
          onProgressChange={(_, absoluteProgress) => {
            const newIndex = Math.round(absoluteProgress);
            setCurrentIndex(newIndex);
          }}
          onSnapToItem={index => {
            setCurrentIndex(index);
          }}
          onConfigurePanGesture={g => {
            'worklet';
            g.enabled(true);
            g.setFailsWhenNotCaptured(true);
            g.setActivationCriteria({ minDist: 5 });
          }}
        />






        <View style={styles.paginationContainer}>
          {bannerDataArray.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>
      </View>
    </PanGestureHandler>
  );
}







