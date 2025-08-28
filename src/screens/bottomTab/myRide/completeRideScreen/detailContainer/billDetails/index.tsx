import { Text, View } from 'react-native';
import React from 'react';
import { SolidLine, DetailContainer } from '@src/commonComponent';
import { external } from '../../../../../../styles/externalStyle';
import { styles } from './styles';
import { useValues } from '../../../../../../../App';
import { commonStyles } from '../../../../../../styles/commonStyle';
import { appColors } from '@src/themes';
import { BillDetailsInterface } from '@src/api/interface/rideRequestInterface';
import { useSelector } from 'react-redux';

interface BillDetailsProps {
  billDetail: BillDetailsInterface;
}

export function BillDetails({ billDetail }: BillDetailsProps) {
  const { textColorStyle, textRTLStyle, viewRTLStyle, isDark } = useValues();
  const { translateData } = useSelector((state) => state.setting);

  return (
    <View>
      <View style={styles.viewHeder}>
        <Text style={[styles.billSummary, { color: textColorStyle, textAlign: textRTLStyle }]}>
          {translateData.billSummary}
        </Text>
        <SolidLine color={isDark ? appColors.darkBorder : appColors.border} />
        {billDetail?.ride_fare > 0 && (
          <View style={[external.mv_5]}>
            <DetailContainer
              value={[billDetail?.currency_symbol, billDetail?.ride_fare]}
              title={translateData.baseFare}
            />
          </View>
        )}
        {billDetail?.additional_distance_charge > 0 && (
          <View style={[external.mv_5]}>
            <DetailContainer
              value={[billDetail?.currency_symbol, billDetail?.additional_distance_charge]}
              title={translateData.additionalFare}
            />
          </View>
        )}
        {billDetail?.vehicle_rent > 0 && (
          <View style={[external.mv_5]}>
            <DetailContainer
              value={[billDetail?.currency_symbol, billDetail?.vehicle_rent]}
              title={translateData.vehicleFare}
            />
          </View>
        )}
        {billDetail?.additional_minute_charge > 0 && (
          <View style={[external.mv_5]}>
            <DetailContainer
              value={[billDetail?.currency_symbol, billDetail?.additional_minute_charge]}
              title={translateData.timeFare}
            />
          </View>
        )}
        {billDetail?.additional_weight_charge > 0 && (
          <View style={[external.mv_5]}>
            <DetailContainer
              value={[billDetail?.currency_symbol, billDetail?.additional_weight_charge]}
              title={translateData.weightFare}
            />
          </View>
        )}
        {billDetail?.bid_extra_amount > 0 && (
          <View style={[external.mv_5]}>
            <DetailContainer
              value={[billDetail?.currency_symbol, billDetail?.bid_extra_amount]}
              title={translateData.bidFare}
            />
          </View>
        )}
        {billDetail?.commission > 0 && (
          <View style={[external.mv_5]}>
            <DetailContainer
              value={[billDetail?.currency_symbol, billDetail?.commission]}
              title={translateData.commission}
            />
          </View>
        )}
        {billDetail?.tax > 0 && (
          <View style={[external.mv_5]}>
            <DetailContainer
              value={[billDetail?.currency_symbol, billDetail?.tax]}
              title={translateData.tax}
            />
          </View>
        )}
        {billDetail?.platform_fees > 0 && (
          <View style={[external.js_space, external.ai_center, external.mt_5, { flexDirection: viewRTLStyle }]}>
            <Text style={[commonStyles.regularText, { textAlign: textRTLStyle }]}>{translateData.platformFees}</Text>
            <Text
              style={[
                commonStyles.regularText,
                { color: appColors.primaryText, textAlign: textRTLStyle },
              ]}
            >
              {billDetail?.currency_symbol}{billDetail?.platform_fees}
            </Text>
          </View>
        )}
      </View>
      <View style={[styles.container, { borderColor: isDark ? appColors.darkBorder : appColors.primaryGray }]} />
      <View style={styles.detailContainerText}>
        <View style={[, external.js_space, external.ai_center, { flexDirection: viewRTLStyle }]}>
          <Text style={[commonStyles.regularText, { textAlign: textRTLStyle }]}>{translateData.totalBill}</Text>
          <Text
            style={[
              commonStyles.regularText,
              { color: appColors.price, textAlign: textRTLStyle },
            ]}
          >
            {billDetail?.currency_symbol}{billDetail?.total}
          </Text>
        </View>
      </View>
    </View>
  );
};
