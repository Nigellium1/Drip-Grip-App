import React, { useEffect, useState } from 'react';
import { Switch, StyleSheet, View, ScrollView, Text, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

async function getValveState(id: number) {
  const ip = await getIP();
  const url = `http://${ip}:5000/nodeDetails?node=${id}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const json = await response.json();
    const open = json.open;
    return (open);
  } catch (error) {
    console.error("Fetch error:", error);
    return (0);
  }
}

async function setValveState(id: number, newState: number) {
  const ip = await getIP();
  const url = `http://${ip}:5000/valveChange?app=1`;
  const formData = new FormData();
  formData.append("node", id.toString());

  if (newState === 1) {
    formData.append("valveOpen", "1");
  }
  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Status: ${response.status}`);
    }
  } catch (error) {
    console.error("Set valve state error:", error);
  }
}

async function getThresholdData(id: number, highOrLow: number, thresholdOrTime: number) {
  const ip = await getIP();
  const url = `http://${ip}:5000/nodeDetails?node=${id}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const json = await response.json();
    if (highOrLow === 1) {
      if (thresholdOrTime === 1) {
        return json.threshold1
      } else {
        return json.time1
      }
    } else {
      if (thresholdOrTime === 1) {
        return json.threshold2
      } else {
        return json.time2
      }
    }
  } catch (error) {
    console.error("Fetch error:", error);
    return (0);
  }
}

async function setThresholds(node: number, threshold1: number, time1: number, threshold2: number, time2: number,) {
  const ip = await getIP();
  const url = `http://${ip}:5000/updateThresholds?app=true`;
  const formData = new FormData();

  formData.append("node", node.toString());
  formData.append("threshold1", threshold1.toString());
  formData.append("time1", time1.toString());
  formData.append("threshold2", threshold2.toString());
  formData.append("time2", time2.toString());

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`Status: ${response.status}`);
    }
  } catch (error) {
    console.error("Set valve state error:", error);
  }
}

const ValveToggle = ({ id }: { id: number }) => {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const fetchValveState = async () => {
      const state = await getValveState(id);
      setIsEnabled(state === 1);
    };

    fetchValveState();
  }, [id]);

  const toggleSwitch = async () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    await setValveState(id, newState ? 1 : 0)
  }

  return (
    <View style={styles.container}>
      <Switch
        trackColor={{ false: '#767577', true: '#e74c3c' }}
        thumbColor={isEnabled ? '#f4f3f4' : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={toggleSwitch}
        value={isEnabled}
      />
    </View>

  );
};

const TextInputExample = ({id, highOrLow, thresholdOrTime }: {id: number, highOrLow: number, thresholdOrTime: number }) => {
  const [number, onChangeNumber] = React.useState('');
  const [lastValidValue, setLastValidValue] = useState('');

  useEffect(() => {
    const fetchThreshold = async () => {
      const state = await getThresholdData(id, highOrLow, thresholdOrTime);
      onChangeNumber(String(state));
      setLastValidValue(String(state));
    };
    fetchThreshold();
  }, [id, highOrLow, thresholdOrTime]);

  const handleBlur = async () => {
    const newValue = parseFloat(number);
    if (isNaN(newValue)) {
      const originalState = await getThresholdData(id, highOrLow, thresholdOrTime);
      onChangeNumber(String(originalState));
      return;
    }
    let currentThreshold1 = await getThresholdData(id, 1, 1);
    let currentTime1 = await getThresholdData(id, 1, 2);
    let currentThreshold2 = await getThresholdData(id, 2, 1);
    let currentTime2 = await getThresholdData(id, 2, 2);
    if (highOrLow === 1) {
      if (thresholdOrTime === 1) {
        currentThreshold1 = newValue;
      } else {
        currentTime1 = newValue;
      }
    } else {
      if (thresholdOrTime === 1) {
        currentThreshold2 = newValue;
      } else {
        currentTime2 = newValue;
      }
    }
    try {
      await setThresholds(id, currentThreshold1, currentTime1, currentThreshold2, currentTime2);
      setLastValidValue(String(newValue));
    } catch (error) {
      console.log("Error updating thresholds:", error);
      const originalState = await getThresholdData(id, highOrLow, thresholdOrTime);
      onChangeNumber(String(originalState));
      onChangeNumber(lastValidValue);
    }
  };

  return (
    <TextInput
      style={styles.input}
      placeholder={lastValidValue||"0"}
      onChangeText={(text) => {
        const cleaned = text.replace(/[^0-9.]/g, '');
        onChangeNumber(cleaned);
      }}
      value={number}
      keyboardType="numeric"
      onBlur={handleBlur}
    />

  );
};

async function getIP() {
  try {
    const ip = await AsyncStorage.getItem('raspberry_pi_ip');
    return ip
  } catch (e) {
    console.error('Error loading IP from storage', e);
    return '192.168.68.114';
  }
}

export default function ControlsScreen() {
const ServerIPInput = () => {
  const [ip, setIP] = useState('');

  useEffect(() => {
    const loadIP = async () => {
      const savedIP = await AsyncStorage.getItem('raspberry_pi_ip');
      if (savedIP) setIP(savedIP);
    };
    loadIP();
  }, []);

  const handleChange = async (text: string) => {
    setIP(text);
    await AsyncStorage.setItem('raspberry_pi_ip', text);
  };

  return (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>Server IP:</Text>
      <TextInput
        style={[styles.input, { width: 150 }]}
        placeholder="192.168.x.x"
        value={ip}
        onChangeText={handleChange}
      />
    </View>
  );
};

  return (
    <ScrollView style={styles.container}>
      <View style={styles.nodeContainer}>
        <ServerIPInput />
      </View>
      <View style={styles.nodeContainer}>
        <Text style={styles.nodeLabel}>Bathroom Sink</Text>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>Open Valve:</Text>
          <ValveToggle id={1} />
        </View>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>Low Threshold:</Text>
          <View style={styles.rightLine}>
            <TextInputExample id={1} highOrLow={1} thresholdOrTime={1} />
            <Text style={styles.lineLabel}>      L/min</Text>
          </View>
        </View>
        <View style={styles.rightLine}>
          <Text style={styles.lineLabel}>for </Text>
          <TextInputExample id={1} highOrLow={1} thresholdOrTime={2} />
          <Text style={styles.lineLabel}>  seconds</Text>
        </View>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>High Threshold:</Text>
          <View style={styles.rightLine}>
            <TextInputExample id={1} highOrLow={2} thresholdOrTime={1} />
            <Text style={styles.lineLabel}>      L/min</Text>
          </View>
        </View>
        <View style={styles.rightLine}>
          <Text style={styles.lineLabel}>for </Text>
          <TextInputExample id={1} highOrLow={2} thresholdOrTime={2} />
          <Text style={styles.lineLabel}>  seconds</Text>
        </View>
      </View>

      <View style={styles.nodeContainer}>
        <Text style={styles.nodeLabel}>Kitchen Sink</Text>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>Open Valve:</Text>
          <ValveToggle id={4} />
        </View>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>Low Threshold:</Text>
          <View style={styles.rightLine}>
            <TextInputExample id={4} highOrLow={1} thresholdOrTime={1} />
            <Text style={styles.lineLabel}>      L/min</Text>
          </View>
        </View>
        <View style={styles.rightLine}>
          <Text style={styles.lineLabel}>for </Text>
          <TextInputExample id={4} highOrLow={1} thresholdOrTime={2} />
          <Text style={styles.lineLabel}>  seconds</Text>
        </View>
        <View style={styles.line}>
          <Text style={styles.lineLabel}>High Threshold:</Text>
          <View style={styles.rightLine}>
            <TextInputExample id={4} highOrLow={2} thresholdOrTime={1} />
            <Text style={styles.lineLabel}>      L/min</Text>
          </View>
        </View>
        <View style={styles.rightLine}>
          <Text style={styles.lineLabel}>for </Text>
          <TextInputExample id={4} highOrLow={2} thresholdOrTime={2} />
          <Text style={styles.lineLabel}>  seconds</Text>
        </View>
      </View>
    </ScrollView>)
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: "fff",
  },
  nodeContainer: {
    paddingTop: 0,
    padding: 10,
    margin: 10,
    borderRadius: 10,
    backgroundColor: "#81c3d7",
  },
  nodeLabel: {
    color: "#fff",
    fontSize: 20,
    textAlign: "center",
    margin: 5,
    fontFamily: "Roboto-Bold"
  },
  lineLabel: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Roboto-Regular"
  },
  line: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  rightLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end"
  },
  input: {
    height: 25,
    margin: 5,
    borderWidth: 1,
    padding: 3,
    borderColor: "#000",
    backgroundColor: "#fff",
    borderRadius: 10,
    width: 60,
    textAlign: "left"
  },
});