import { Text, TextInput, View } from 'react-native';
import React,{useState} from 'react';
import { commonStyles } from '../../../../styles/commonStyle';
import { appColors } from '@src/themes'; 
import { external } from '../../../../styles/externalStyle';
import { styles } from './styles';
import { useValues } from '../../../../../App';
import { description, fiveBoxes } from '../../../../constant/index';

export function DescriptionText({ onTextChange } : {onTextChange : any}) {
  const { bgContainer, textColorStyle, textRTLStyle, isDark } = useValues();
  const [inputValue, setInputValue] = useState(''); 

  const handleTextChange = (text : string) => {
    setInputValue(text); 
    onTextChange(text);
  };

  return (
    <View style={[external.mt_10]}>
      <Text
        style={[
          commonStyles.extraBold,
          { color: textColorStyle },
          { textAlign: textRTLStyle },
        ]}>
        {description}
      </Text>
      <View style={[styles.container, { backgroundColor: bgContainer, borderColor: isDark ? appColors.darkBorder : appColors.border }]}>
        <TextInput
          multiline={true}
          placeholderTextColor={appColors.subtitle}
          style={[
            external.pv_10,
            external.ph_10,
            commonStyles.regularText,
            { textAlign: textRTLStyle },
          ]}
          placeholder={fiveBoxes}
          onChangeText={handleTextChange} 
          value={inputValue} 
        />
      </View>
    </View>
  );
};
