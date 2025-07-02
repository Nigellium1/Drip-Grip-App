import { Text, View, StyleSheet } from "react-native";
import { Image } from "expo-image";

const LeftImage = require('@/assets/images/left.png');
const RightImage = require('@/assets/images/right.png');

export default function Index() {
  return (
    <View style={styles.container}>
      <View style={styles.sectionContainer}>
        <Text style={[styles.title, { fontFamily: 'Impact' }]}>THE DRIP GRIP</Text>
        <View style={styles.textContainer}>
          <Text style={styles.text}>
            The Drip Grip™ is a system to monitor water flow in sinks and toilets, detect leaks, and shut off the flow of water. It uses an ESP32 and Raspberry Pi 4 to monitor the flow via a flow sensor which controls a solenoid valve that stops the flow of water when a leak is detected.
          </Text>
        </View>
      </View>
      <View style={styles.bottomImageContainer}>
        <Image source={LeftImage} style={styles.leftImage} />
        <Image source={RightImage} style={styles.rightImage} />
      </View>
      <View style={styles.credits}>
        <Text style={styles.text}>THE DRIP GRIP™ by George Keylock, Joan Kurian, William Appleby, Nigel Wong, and Joseph Thompson</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
    justifyContent: "space-between",
  },
  credits: {
    margin: 10,
  },
  sectionContainer: {
    margin: 20,
    paddingTop: 0,
    padding: 10,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#81c3d7",
    borderRadius: 10,
    alignSelf: "stretch",
  },
  textContainer: {
    fontFamily: "Impact",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: "600",
    color: "#fff",

  },
  text: {
    color: "#000",
    textAlign: "center",
    fontFamily: "Roboto-Regular"
  },
  bottomImageContainer: {
    flexDirection: "row",
    alignSelf: "stretch",
    justifyContent: "space-between",
  },
  leftImage: {
    width: 125,
    height: 125,
    borderRadius: 18,
    alignSelf: "flex-start",
  },
  rightImage: {
    width: 125,
    height: 125,
    borderRadius: 18,
    alignSelf: "flex-end",
  },
});