import { View, Text, Image, TouchableOpacity, Alert, TextInput } from 'react-native'
import React, { useCallback, useState } from 'react'
import { Button, Header } from '@src/commonComponent'
import { CloseIcon, Download } from '@src/utils/icons'
import styles from './styles'
import { useSelector } from 'react-redux'
import { useValues } from '@App'
import { appColors, appFonts, fontSizes, windowHeight, windowWidth } from '@src/themes'
import DocumentPicker from "react-native-document-picker";
import { useAppNavigation } from '@src/utils/navigation'

export function AddVehicle() {
    const { translateData } = useSelector((state) => state.setting);
    const {
        bgFullLayout,
        textColorStyle,
        textRTLStyle,
        isDark,
        viewRTLStyle,
        isRTL
    } = useValues();
    const [files, setFiles] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedPriority, setSelectedPriority] = useState(null);
    const [priorityList, setPriorityList] = useState([]);
    const { goBack } = useAppNavigation();

    const handleDocumentUpload = useCallback(async () => {
        try {
            const response = await DocumentPicker.pick({
                type: [DocumentPicker.types.images],
                allowMultiSelection: true,
            });
            setFiles([...files, ...response]);
        } catch (err) {
            if (!DocumentPicker.isCancel(err)) {
                Alert.alert("Error", "Failed to upload file(s).");
            }
        }
    }, [files]);

    const handleRemoveFile = (index: number) => {
        const updatedFiles = files.filter((_, i) => i !== index);
        setFiles(updatedFiles);
    };


    return (
        <View style={styles.view}>
            <Header value='Add Vehicle Info' />
            <View style={styles.mainView}>
                <Text style={styles.fieldTitle}>What kind of vehicle is it?</Text>
                <DropDownPicker
                    open={open}
                    value={selectedPriority}
                    items={priorityList}
                    setOpen={setOpen}
                    setValue={setSelectedPriority}
                    placeholder={translateData.selectPriority}
                    style={[
                        styles.dropDownContainer,
                        {
                            backgroundColor: isDark ? bgFullLayout : appColors.whiteColor,
                            borderColor: isDark ? appColors.darkBorder : appColors.border,
                            flexDirection: viewRTLStyle,
                            paddingHorizontal: windowHeight(12),
                        },
                    ]}
                    dropDownContainerStyle={{
                        backgroundColor: isDark ? bgFullLayout : appColors.lightGray,
                        borderColor: isDark ? appColors.darkBorder : appColors.border,
                    }}
                    tickIconStyle={{
                        tintColor: isDark ? appColors.whiteColor : appColors.blackColor,
                    }}
                    textStyle={{
                        textAlign: isRTL ? "right" : "left",
                        color: isDark ? appColors.whiteColor : appColors.blackColor,
                        fontFamily: appFonts.regular,
                        fontSize: fontSizes.FONT17
                    }}
                    iconContainerStyle={{
                        color: isDark ? appColors.whiteColor : appColors.blackColor,
                    }}
                    arrowIconStyle={{
                        tintColor: isDark ? appColors.whiteColor : appColors.blackColor,
                    }}
                    placeholderStyle={{
                        color: isDark ? appColors.darkText : appColors.regularText,
                    }}
                    dropDownDirection="TOP"
                    zIndex={2}
                    rtl={isRTL}
                />
                <Text style={styles.fieldTitle}>What's your vehicle brand?</Text>
                <DropDownPicker
                    open={open}
                    value={selectedPriority}
                    items={priorityList}
                    setOpen={setOpen}
                    setValue={setSelectedPriority}
                    placeholder={translateData.selectPriority}
                    style={[
                        styles.dropDownContainer,
                        {
                            backgroundColor: isDark ? bgFullLayout : appColors.whiteColor,
                            borderColor: isDark ? appColors.darkBorder : appColors.border,
                            flexDirection: viewRTLStyle,
                            paddingHorizontal: windowHeight(12),
                        },
                    ]}
                    dropDownContainerStyle={{
                        backgroundColor: isDark ? bgFullLayout : appColors.lightGray,
                        borderColor: isDark ? appColors.darkBorder : appColors.border,
                    }}
                    tickIconStyle={{
                        tintColor: isDark ? appColors.whiteColor : appColors.blackColor,
                    }}
                    textStyle={{
                        textAlign: isRTL ? "right" : "left",
                        color: isDark ? appColors.whiteColor : appColors.blackColor,
                        fontFamily: appFonts.regular,
                        fontSize: fontSizes.FONT17
                    }}
                    iconContainerStyle={{
                        color: isDark ? appColors.whiteColor : appColors.blackColor,
                    }}
                    arrowIconStyle={{
                        tintColor: isDark ? appColors.whiteColor : appColors.blackColor,
                    }}
                    placeholderStyle={{
                        color: isDark ? appColors.darkText : appColors.regularText,
                    }}
                    dropDownDirection="TOP"
                    zIndex={2}
                    rtl={isRTL}
                />
                <Text style={styles.fieldTitle}>License Vehicle Number</Text>
                <TextInput style={styles.input}
                    placeholder='Enter license number'
                    placeholderTextColor={appColors.gray} />
                <Text style={styles.fieldTitle}>When is your vehicle registered?</Text>
                <TextInput style={styles.input}
                    placeholder='Enter'
                    placeholderTextColor={appColors.gray} />
                <Text style={styles.fieldTitle}>What's your vehicle's color?</Text>
                <TextInput style={styles.input}
                    placeholder='Enter vehicle color'
                    placeholderTextColor={appColors.gray} />
                <Text
                    style={[
                        styles.fieldTitle,
                        { color: textColorStyle },
                        { textAlign: textRTLStyle },
                        { fontFamily: appFonts.medium },
                    ]}
                >
                    Upload Vehicle Image
                </Text>
                {files.length > 0 ? (
                    <View style={[styles.imgContainer, { flexDirection: viewRTLStyle }]}>
                        {files.map((file, index) => (
                            <View key={index} style={[styles.imgView, { borderColor: isDark ? appColors.darkBorder : appColors.border }]}>
                                <TouchableOpacity
                                    style={styles.closeIcon}
                                    onPress={() => handleRemoveFile(index)}
                                >
                                    <CloseIcon />
                                </TouchableOpacity>
                                {file?.type?.includes("image") ? (
                                    <Image source={{ uri: file?.uri }} style={styles.img} />
                                ) : (
                                    <View style={styles.placeholder}>
                                        <Text style={styles.placeholderText}>{file?.name}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                ) : (
                    <TouchableOpacity
                        onPress={handleDocumentUpload}
                        activeOpacity={0.7}
                        style={[
                            styles.docSelection,
                            { backgroundColor: isDark ? bgFullLayout : appColors.whiteColor },
                            { borderColor: isDark ? appColors.darkBorder : appColors.border },
                        ]}
                    >
                        <View style={styles.docContainer}>
                            <Download />
                            <Text style={styles.uploadText}>{translateData.upload}</Text>
                        </View>
                    </TouchableOpacity>
                )}


            </View>
            <View style={styles.goBackBtn}>
                <Button title='Save' onPress={goBack} />
            </View>
        </View>
    )
}

