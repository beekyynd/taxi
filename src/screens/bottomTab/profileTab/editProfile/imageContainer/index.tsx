import { Image, View, TouchableOpacity, Text } from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { styles } from "../style";
import { Camera } from "@utils/icons";
import { useValues } from "../../../../../../App";
import { launchImageLibrary } from "react-native-image-picker";
import { setValue, getValue } from "../../../../../utils/localstorage/index";
import { appColors, windowHeight } from "@src/themes";
import { SkeletonEditImage } from "./component";
import Images from "@src/utils/images";

export function ImageContainer({ data, storeProfile }) {
  const { bgFullStyle, isDark } = useValues();
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadImageUri = async () => {
      setLoading(true);
      try {
        const storedUri = await getValue("profile_image_uri");
        const apiUri = data?.profile_image?.original_url;

        setImageUri(storedUri || apiUri);
      } catch (error) {
        console.error("Error loading image URI:", error);
      }
      setLoading(false);
    };

    loadImageUri();
  }, [data?.profile_image?.original_url]);

  const selectImage = useCallback(() => {
    launchImageLibrary(
      {
        mediaType: "photo",
        maxWidth: 300,
        maxHeight: 300,
        quality: 1,
      },
      async (response) => {
        if (response.didCancel || response.errorCode) return;

        const selectedImage = response?.assets?.[0];
        if (selectedImage?.uri) {
          setImageUri(selectedImage.uri);
          storeProfile(selectedImage);

          try {
            await setValue("profile_image_uri", selectedImage.uri);
          } catch (error) {
            console.error("Error saving image URI:", error);
          }
        }
      }
    );
  }, [storeProfile]);

  if (loading) {
    return (
      <View style={styles.profileImageContainer}>
        <SkeletonEditImage />
      </View>
    );
  }

  return (
    <>
      <View style={{ position: 'absolute', width: '100%', height: windowHeight(50) }}>
        <Image source={Images.profileBackground} style={{ width: '100%', height: windowHeight(78), borderTopLeftRadius: windowHeight(8), borderTopRightRadius: windowHeight(8) }} />
      </View>
      <View style={styles.profileImageContainer}>
        <View style={[styles.profileImageWrapper, { borderColor: isDark ? appColors.darkBorder : appColors.border }]}>
          {imageUri ? (
            <Image style={styles.profileImage} source={{ uri: imageUri }} />
          ) : (
            <Text style={[styles.char, { color: appColors.primary }]}>
              {data?.name?.charAt(0) || ""}
            </Text>
          )}
          <View
            style={[
              styles.editIconContainer,
              { backgroundColor: bgFullStyle },
            ]}
          >
            <TouchableOpacity onPress={selectImage} activeOpacity={0.7}>
              <Camera />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
}
