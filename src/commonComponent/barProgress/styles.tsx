import { StyleSheet } from "react-native"
import { windowHeight, windowWidth } from "@src/themes";

const styles=StyleSheet.create({
    container: {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: windowWidth(4),
        marginVertical: windowHeight(5.5),
      },
      filledBar: {
        backgroundColor:'#199675',
        flex: 1,
        height: windowHeight(4.7),
        borderRadius: windowHeight(1),
        marginHorizontal: windowWidth(0.3),
      },
      emptyBar: {
        flex: 1,
        height: windowHeight(4.7),
        borderRadius: windowHeight(1),
        marginHorizontal: windowWidth(0.3),
      },
})
export default styles;