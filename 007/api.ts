import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";

const fromConfig = Constants?.expoConfig?.extra?.API_URL as string | undefined;

const localBaseURL =
  Platform.OS === "ios"
    ? "http://192.168.18.76:3000/api"
    : Platform.OS === "android"
    ? "http://10.0.2.2:3000/api"
    : "http://192.168.18.76:3000/api";

export const api = axios.create({
  baseURL: fromConfig ?? localBaseURL,
  timeout: 12000,
});