import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from '@react-native-async-storage/async-storage';

const styles = StyleSheet.create({
  notificationContainer: {
    backgroundColor: "#F1F1F1",
    borderBottomWidth: 0.5,
    borderBottomColor: "#CDCDCD",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  noNotifications: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff"
  },
  text: {
    flex: 1,
    color: "#000",
    fontSize: 18,
  },
  closeButton: {
    fontSize: 40,
    marginLeft: "auto",
  },
});

async function getIP() {
  try {
    const ip = await AsyncStorage.getItem('raspberry_pi_ip');
    return ip
  } catch (e) {
    console.error('Error loading IP from storage', e);
    return '192.168.68.114';
  }
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<
    { id: string; message: string; time: Date }[]
  >([]);
-
  useEffect(() => {
    getData(setNotifications);
    const interval = setInterval(() => {
      getData(setNotifications);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  async function deleteNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    const ip = await getIP();
    const url = `http://${ip}:5000/notification/delete?app=1`;
    try {
      const formData = new FormData();
      formData.append("id", id);

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error(`Response status: ${response.status}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Delete error:", message);
      getData(setNotifications);
    }
  }


  if (notifications.length === 0) {
    return (
      <View style={styles.noNotifications}>
        <Text>No notifications</Text>
      </View>
    );
  }
  else
    return (
      <ScrollView style={{ backgroundColor: "#fff" }}>
        {notifications.map((notification) => (
          <View key={notification.id} style={styles.notificationContainer}>
            <Text style={styles.text}>
              {notification.message} at {notification.time.toLocaleString()}
            </Text>
            <TouchableOpacity onPress={() => deleteNotification(notification.id)}>
              <Ionicons name="close-outline" style={styles.closeButton} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    );
}

async function getData(
  setNotifications: (data: { id: string; message: string; time: Date }[]) => void
) {
  const ip = await getIP();
  const url = `http://${ip}:5000/notifications/list`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Response status: ${response.status}`);
    const data = await response.json();

    const formatted = data.map((item: any) => ({
      id: item.id,
      message: item.message,
      time: new Date(item.time * 1000),
    }));

    setNotifications(formatted);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    setNotifications([
      { id: "", message: `Error: ${message}`, time: new Date(0) }
    ]);
  }
}
