import { Alert, BackHandler, Linking, PermissionsAndroid, Platform } from 'react-native';
import { isLocationEnabled, promptForEnableLocationIfNeeded } from 'react-native-android-location-enabler';
import Geolocation from '@react-native-community/geolocation';

let isAlertVisible = false;
let hasPromptedGPS = false;


// export const ensureLocationAccess = async (): Promise<void> => {
//     const gpsEnabled = await ensureGPSIsEnabled();
//     if (!gpsEnabled) return;

//     const permissionGranted = await ensureLocationPermission();
//     if (!permissionGranted) return;
// };


const ensureGPSIsEnabled = async (): Promise<boolean> => {
    try {
        const isEnabled = await isLocationEnabled();
        if (isEnabled) return true;

        if (hasPromptedGPS) {
            // Already shown system prompt, now show app alert
            showGPSDeniedAlert();
            return false;
        }

        // Show native system GPS prompt once
        hasPromptedGPS = true;

        await promptForEnableLocationIfNeeded({
            interval: 10000,
            fastInterval: 5000,
        });

        const recheck = await isLocationEnabled();
        if (recheck) return true;

        showGPSDeniedAlert(); // fallback if still disabled
        return false;
    } catch (err) {
        console.warn('GPS enable error:', err);
        showGPSDeniedAlert();
        return false;
    }
};


/**
 * Step 2: Ensure location permission is granted
 */
const ensureLocationPermission = async (): Promise<boolean> => {
    try {
        if (Platform.OS !== 'android') return true;

        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: 'Location Access Required',
                message: 'This app needs to access your location to function properly.',
                buttonPositive: 'OK',
            }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            showPermissionDeniedAlert();
            console.warn('[PermissionHelper] Foreground location not granted');
            return false;
        }

        if (Platform.Version >= 33) {
            const bgGranted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
            );

            if (bgGranted !== PermissionsAndroid.RESULTS.GRANTED) {
                showPermissionDeniedAlert();
                console.warn('[PermissionHelper] Background location not granted');
                return false;
            }
        }

        return true;
    } catch (err) {
        console.warn('[PermissionHelper] Error requesting permissions:', err);
        showPermissionDeniedAlert();
        return false;
    }
};

/**
 * Optional: Use this when you want to run a callback only if permission is granted.
 */
export const requestLocationPermissionAndRun = async (onSuccess: () => void): Promise<void> => {
    try {
        if (Platform.OS === 'ios') {
            onSuccess();
            return;
        }

        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: 'Location Access Required',
                message: 'This app needs to access your location to function properly.',
                buttonPositive: 'OK',
            }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            onSuccess();
        } else {
            showPermissionDeniedAlert();
        }
    } catch (err) {
        console.warn('Permission error:', err);
    }
};


// const showGPSDeniedAlert = () => {
//     if (isAlertVisible) return;

//     isAlertVisible = true;

//     Alert.alert(
//         'GPS Required',
//         'Please enable GPS to use this app.',
//         [
//             {
//                 text: 'Exit',
//                 style: 'destructive',
//                 onPress: () => {
//                     isAlertVisible = false;
//                     BackHandler.exitApp();
//                 },
//             },
//             {
//                 text: 'Enable GPS',
//                 onPress: async () => {
//                     isAlertVisible = false;
//                     hasPromptedGPS = false;
//                     const enabled = await ensureGPSIsEnabled();
//                     if (enabled) {
//                         ensureLocationAccess();
//                     }
//                 },
//             },
//         ],
//         {
//             cancelable: false,
//             onDismiss: () => {
//                 isAlertVisible = false;
//             },
//         }
//     );
// };
export const showGPSDeniedAlert = () => {
    if (isAlertVisible) return;

    isAlertVisible = true;

    Alert.alert(
        "GPS Required",
        "Please enable GPS to use this app.",
        [
            {
                text: "Exit",
                style: "destructive",
                onPress: () => {
                    isAlertVisible = false;
                    BackHandler.exitApp();
                },
            },
            {
                text: "Enable GPS",
                onPress: async () => {
                    isAlertVisible = false;

                    if (Platform.OS === "android") {
                        const enabled = await ensureGPSIsEnabled(); // only Android
                        if (enabled) {
                            ensureLocationAccess();
                        } else {
                            showGPSDeniedAlert();
                        }
                    } else {
                        // iOS → only need to check location permission
                        ensureLocationAccess();
                    }
                },
            },
        ],
        {
            cancelable: false,
            onDismiss: () => {
                isAlertVisible = false;
            },
        }
    );
};

export const ensureLocationAccess = async (): Promise<void> => {
    if (Platform.OS === "android") {
        const gpsEnabled = await ensureGPSIsEnabled();
        if (!gpsEnabled) return;
    }

    const permissionGranted = await ensureLocationPermission();
    if (!permissionGranted) {
        showGPSDeniedAlert();
        return;
    }
};


const showPermissionDeniedAlert = () => {
    if (isAlertVisible) return;

    isAlertVisible = true;
    Alert.alert(
        'Permission Required',
        'Location permission is needed. Please enable it from settings.',
        [
            {
                text: 'Exit',
                style: 'destructive',
                onPress: () => {
                    isAlertVisible = false;
                    BackHandler.exitApp();
                },
            },
            {
                text: 'Open Settings',
                onPress: () => {
                    isAlertVisible = false;
                    Linking.openSettings();
                },
            },
        ],
        {
            cancelable: false,
            onDismiss: () => {
                isAlertVisible = false;
            },
        }
    );
};




export const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    // iOS auto granted via plist, add fallback if needed
    return true;
};

export const getDeviceLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                resolve({ lat: latitude, lng: longitude });
            },
            (error) => {
                console.error("Geolocation error:", error);
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 1000,
            }
        );
    });
};