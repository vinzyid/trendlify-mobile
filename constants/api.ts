import { Platform } from "react-native";

const LOCAL_IP = process.env.EXPO_PUBLIC_API_URL;

export const API_URL = LOCAL_IP ?? (
  Platform.OS === "android"
    ? "http://10.0.2.2:8000"
    : "http://127.0.0.1:8000"
);
