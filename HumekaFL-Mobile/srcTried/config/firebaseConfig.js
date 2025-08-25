// Import Firebase modules
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Load environment configuration
const loadEnvConfig = () => {
  // In React Native, we'll use a simple config object
  // In production, you should use react-native-dotenv or similar
  return {
    apiKey: "AIzaSyAfRctGz96wnVlqlEgF7RrtYoTJWpA-7fc",
    authDomain: "humekafl-af1bb.firebaseapp.com",
    projectId: "humekafl-af1bb",
    storageBucket: "humekafl-af1bb.firebasestorage.app",
    messagingSenderId: "776776043882",
    appId: "1:776776043882:web:8dcff49df094eb44282913",
    measurementId: "G-3D82Z1B4LE"
  };
};

// Firebase configuration
const firebaseConfig = loadEnvConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
})
export const db = getFirestore(app);

// Optionally export the app if needed elsewhere
export default app;
