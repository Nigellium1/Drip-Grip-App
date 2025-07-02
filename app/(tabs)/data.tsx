import 'react-native-reanimated';
import { Text, View, StyleSheet, ScrollView } from "react-native";
import { CartesianChart, Line } from "victory-native";
import { Dimensions } from "react-native";
import { useFont } from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const screenWidth = Dimensions.get("window").width;
const roboto = require("@/assets/fonts/Roboto-Regular.ttf")

async function getIP() {
  try {
    const ip = await AsyncStorage.getItem('raspberry_pi_ip');
    return ip
  } catch (e) {
    console.error('Error loading IP from storage', e);
    return '192.168.68.114';
  }
}

async function getDailyData(node: number, setData: (data: { time: number; litresLost: number }[]) => void) {
  const currentTime = Date.now() / 1000;
  /* const currentTime = 1751447376; */
  console.log(currentTime)
  const startTime = currentTime - 86400;
  const ip = await getIP();
  const url = `http://${ip}:5000/graph?node=${node}&startTime=${startTime}&endTime=${currentTime}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const json = await response.json();
    const formatted = json.map((item: any) => ({
      time: item.time,
      flowrate: item.flowrate,
    }));
    const litresLost = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    formatted.forEach((item: any) => {
      const hour = Math.floor((item.time - startTime) / 3600);
      litresLost[hour] = litresLost[hour] + item.flowrate * (5 / 60);
    });
    const hourValues: number[] = [];
    for (let i = 23; i >= 0; i--) {
      hourValues.push(currentTime - i * 3600);
    }
    const returnData = hourValues.map((time, i) => ({
      time,
      litresLost: litresLost[i],
    }));
    console.log(url);
    setData(returnData);
  } catch (error) {
    console.error("Fetch error:", error);
    setData([]);
  }
}
async function getMonthlyData(node: number, setData: (data: { time: number; litresLost: number }[]) => void) {
  const currentTime = Date.now() / 1000;
  /* const currentTime = 1741901325; */
  const startTime = currentTime - 2419200;
  const ip = await getIP();
  const url = `http://${ip}:5000/graph?node=${node}&startTime=${startTime}&endTime=${currentTime}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const json = await response.json();
    const formatted = json.map((item: any) => ({
      time: item.time,
      flowrate: item.flowrate,
    }));
    const litresLost = [0, 0, 0, 0];
    formatted.forEach((item: any) => {
      const week = Math.floor((item.time - startTime) / 604800);
      litresLost[week] = litresLost[week] + item.flowrate * (5 / 60);
    });
    const weekValues = [0, 1, 2, 3];
    const returnData = weekValues.map((time, i) => ({
      time,
      litresLost: litresLost[i],
    }));
    setData(returnData);
  } catch (error) {
    console.error("Fetch error:", error);
    setData([]);
  }
}

function getOptimalTickCount(fontSize: number, minLabelSpacing: number = 5) {
  const labelWidthEstimate = fontSize * 4;
  const totalLabelSpace = labelWidthEstimate + minLabelSpacing;
  const tickCount = Math.floor(screenWidth / totalLabelSpace);
  return tickCount;
}


export default function DataScreen() {
  const fontSize = 12;
  const font = useFont(roboto, fontSize);
  const [dailyData1, setDailyData1] = useState<{ time: number; litresLost: number }[]>([]);
  const [monthlyData1, setMonthlyData1] = useState<{ time: number; litresLost: number }[]>([]);
  const [dailyData2, setDailyData2] = useState<{ time: number; litresLost: number }[]>([]);
  const [monthlyData2, setMonthlyData2] = useState<{ time: number; litresLost: number }[]>([]);
  const tickCount = getOptimalTickCount(fontSize);

  useEffect(() => {
    getDailyData(1, setDailyData1);
    const interval = setInterval(() => {
      getDailyData(1, setDailyData1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    getMonthlyData(1, setMonthlyData1);
    const interval = setInterval(() => {
      getMonthlyData(1, setMonthlyData1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    getDailyData(4, setDailyData2);
    const interval = setInterval(() => {
      getDailyData(4, setDailyData2);
    }, 30000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    getMonthlyData(4, setMonthlyData2);
    const interval = setInterval(() => {
      getMonthlyData(4, setMonthlyData2);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.nodeContainer}>
        <Text style={styles.graphLabel}>Bathroom Sink (Daily)</Text>
        <View style={styles.container}>
          <CartesianChart
            data={dailyData1}
            xKey="time"
            yKeys={["litresLost"]}
            xAxis={{
              font,
              tickCount: tickCount,
              formatXLabel: (value: number) => {
                const date = new Date(value*1000);
                const hour = date.getHours();
                const suffix = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour % 12 === 0 ? 12 : hour % 12;
                return `${hour12}${suffix}`;
              }
            }}
            axisOptions={{ font }}
            domainPadding={{ top: 10, bottom: 10, right: 40 }}
          >
            {({ points }) => (
              <Line
                points={points.litresLost}
                color="#e74c3c"
                strokeWidth={3}
                animate={{ type: "timing", duration: 300 }}
                curveType="monotoneX"
              />
            )}
          </CartesianChart>
          <Text style={styles.xAxisLabel}>Time</Text>
          <Text style={styles.yAxisLabel}>Water Lost (L)</Text>
        </View>

        <Text style={styles.graphLabel}>Bathroom Sink (Monthly)</Text>
        <View style={styles.container}>
          <CartesianChart
            data={monthlyData1}
            xKey="time"
            yKeys={["litresLost"]}
            xAxis={{
              font,
              tickCount: 4,
              formatXLabel: (value: number) => {
                const labels = ["3 Weeks Ago", "2 Weeks Ago", "Last Week", "This Week"];
                return labels[value] || "";
              }
            }}
            axisOptions={{ font }}
            domainPadding={{ top: 10, bottom: 10, right: 40, left: 10 }}
          >
            {({ points }) => (
              <Line
                points={points.litresLost}
                color="#e74c3c"
                strokeWidth={3}
                animate={{ type: "timing", duration: 300 }}
                curveType="monotoneX"
              />
            )}
          </CartesianChart>
          <Text style={styles.xAxisLabel}>Time</Text>
          <Text style={styles.yAxisLabel}>Water Lost (L)</Text>
        </View>
      </View>

      <View style={styles.nodeContainer}>
        <Text style={styles.graphLabel}>Kitchen Sink (Daily)</Text>
        <View style={styles.container}>
          <CartesianChart
            data={dailyData2}
            xKey="time"
            yKeys={["litresLost"]}
            xAxis={{
              font,
              tickCount: tickCount,
              formatXLabel: (value: number) => {
                const date = new Date(value*1000);
                const hour = date.getHours();
                const suffix = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour % 12 === 0 ? 12 : hour % 12;
                return `${hour12}${suffix}`;
              }
            }}
            axisOptions={{ font }}
            domainPadding={{ top: 10, bottom: 10, right: 10 }}
          >
            {({ points }) => (
              <Line
                points={points.litresLost}
                color="#e74c3c"
                strokeWidth={3}
                animate={{ type: "timing", duration: 300 }}
                curveType="monotoneX"
              />
            )}
          </CartesianChart>
          <Text style={styles.xAxisLabel}>Time</Text>
          <Text style={styles.yAxisLabel}>Water Lost (L)</Text>
        </View>

        <Text style={styles.graphLabel}>Kitchen Sink (Monthly)</Text>
        <View style={styles.container}>
          <CartesianChart
            data={monthlyData2}
            xKey="time"
            yKeys={["litresLost"]}
            xAxis={{
              font,
              tickCount: 4,
              formatXLabel: (value: number) => {
                const labels = ["3 Weeks Ago", "2 Weeks Ago", "Last Week", "This Week"];
                return labels[value] || "";
              }
            }}
            axisOptions={{ font }}
            domainPadding={{ top: 10, bottom: 10, right: 40, left: 10 }}
          >
            {({ points }) => (
              <Line
                points={points.litresLost}
                color="#e74c3c"
                strokeWidth={3}
                animate={{ type: "timing", duration: 300 }}
                curveType="monotoneX"
              />
            )}
          </CartesianChart>
          <Text style={styles.xAxisLabel}>Time</Text>
          <Text style={styles.yAxisLabel}>Water Lost (L)</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  nodeContainer: {
    paddingTop: 0,
    padding: 10,
    margin: 10,
    borderRadius: 10,
    backgroundColor: "#81c3d7",
  },
  container: {
    padding: 5,
    paddingLeft: 20,
    backgroundColor: "#fff",
    height: screenWidth * 2 / 3,
    width: screenWidth - 40,
    borderRadius: 10,
    overflow: "visible"
  },
  xAxisLabel: {
    textAlign: "center",
  },
  yAxisLabel: {
    position: "absolute",
    left: -40,
    top: "50%",
    transform: [{ rotate: "-90deg" }],
    width: 100,
    textAlign: "center",
  },
  graphLabel: {
    color: "#fff",
    fontSize: 20,
    textAlign: "center",
    margin: 5,
    fontFamily: "Roboto-Bold"
  }
});