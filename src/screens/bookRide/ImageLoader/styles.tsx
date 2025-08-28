import { windowHeight, windowWidth } from "@src/themes";
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    width: windowWidth(130),
    borderRadius: windowHeight(6),
    paddingVertical: windowHeight(10),
    marginHorizontal: windowWidth(12),
    marginTop: windowHeight(10),
    borderWidth: windowHeight(1),
  },
  paymentView: {
    flex: 1,
  },
  img: {
    width: windowWidth(75),
    height: windowHeight(25),
    resizeMode: "contain",
  },
  modalTitle: {
    justifyContent: "space-between",
    marginTop: windowHeight(5),
  },
  verticalLine: {
    height: windowHeight(12),
    borderRightWidth: windowHeight(0.9),
    marginHorizontal: windowWidth(4.5),
    marginVertical: windowHeight(2),
  },
  price: {
    marginHorizontal: windowWidth(5),
  },
  vehicleName: {
    height: windowHeight(3),
    width: windowWidth(30),
  },
});
export default styles;
