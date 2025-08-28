import { StyleSheet } from 'react-native';
import { windowHeight } from '@src/themes';


const styles = StyleSheet.create({
    driverMarker: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    marker: {
        width: windowHeight(25),
        height: windowHeight(25),
        resizeMode: 'contain'
    }
});
export { styles };
