import { View, Text, TouchableOpacity, Image } from 'react-native';
import React from 'react';
import { useValues } from '../../../../../App';
import styles from '../../styles';
import { Star } from '@utils/icons';
import { external } from '@src/styles/externalStyle';

export function DriverData({ driverData, driverDetail }) {
  const { viewRTLStyle, textColorStyle } = useValues();

  return (
    <TouchableOpacity
      style={{ flexDirection: viewRTLStyle }}
      onPress={driverData}
      activeOpacity={0.7}>
      {driverDetail?.profile_image_url ? (
        <Image
          source={{ uri: driverDetail.profile_image_url }}
          style={styles.userImage}
        />
      ) : (
        <View style={[styles.userImage, styles.fallbackImage]}>
          <Text style={styles.initialText}>
            {driverDetail?.name?.charAt(0)?.toUpperCase() || 'D'}
          </Text>
        </View>
      )}{' '}
      <View style={styles.profileData}>
        <Text style={[styles.name, { color: textColorStyle }]}>
          {driverDetail?.name}
        </Text>
        <View style={[external.ai_center, { flexDirection: viewRTLStyle }]}>
          <View style={styles.star}>
            <Star />
          </View>

          <Text style={[styles.rating, { color: textColorStyle }]}>
            {Number(driverDetail?.rating_count).toFixed(1)}
          </Text>
          <Text style={styles.review}>({driverDetail?.review_count})</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
