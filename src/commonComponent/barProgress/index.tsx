import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useValues } from '@App';
import { appColors, windowHeight, windowWidth } from '@src/themes';

interface FilledBarsProps {
  fill: number; 
  totalBars?: number;
}

export function BarProgress({ fill, totalBars = 4 }: FilledBarsProps) {
  const { colors } = useTheme();
  const { isDark, viewRTLStyle } = useValues();

  return (
    <View style={[styles.wrapper, { backgroundColor: isDark ? colors.card : appColors.whiteColor }]}>
      <View style={[styles.container, { flexDirection: viewRTLStyle }]}>
        {Array(totalBars).fill(0).map((_, index) => (
          <View
            key={index}
            style={[
              styles.bar,
              index < fill ? styles.filledBar : styles.emptyBar,
              { backgroundColor: index < fill ? '#199675' : isDark ? '#199675' : '#E3F2EE' },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: windowWidth(15),
    paddingVertical: windowHeight(2),
    borderRadius: windowHeight(2),
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bar: {
    flex: 1,
    height: windowHeight(4.5),
    borderRadius: windowHeight(2),
    marginHorizontal: windowWidth(5.3),
  },
  filledBar: {
    backgroundColor: '#199675',
  },
  emptyBar: {
    backgroundColor: '#E3F2EE',
  },
});

export default BarProgress;
