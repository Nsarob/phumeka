import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  User,
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { Alert } from "react-native";
import { auth, db } from "../config/firebaseConfig";

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  userCollection: any | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  register: (registerData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    hospitalName: string;
    country: string;
    city: string;
    position: string;
    hospitalType?: string;
  }) => Promise<void>;
  updateProfile: (updateData: {
    firstName?: string;
    lastName?: string;
    hospitalName?: string;
    country?: string;
    city?: string;
    position?: string;
    hospitalType?: string;
  }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  userCollection: null,
  login: async () => { },
  logout: async () => { },
  isAuthenticated: false,
  register: async () => { },
  updateProfile: async () => { },
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userCollection, setUserCollection] = useState<any | null>(null);


  useEffect(() => {
    setLoading(true);
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        // User is signed in
        setUser(currentUser);
  
        // Fetch user collection from Firestore
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(userDocRef);
  
          if (docSnap.exists()) {
            setUserCollection(docSnap.data());
          } else {
            setUserCollection(null);
          }

          setLoading(false)
        } catch (error) {
          setLoading(false)
          console.error("Failed to fetch user data:", error);
        }
      } else {
        // User is signed out
        setLoading(false)
        setUser(null);
        setUserCollection(null);
      }
    });
  
    // Cleanup subscription
    return () => unsubscribe();
  }, []);
  

  const register = async (registerData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    hospitalName: string;
    country: string;
    city: string;
    position: string;
    hospitalType?: string;
    confirmPassword: string;
  }) => {
    // Password confirmation
    if (registerData.password !== registerData.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      throw new Error("Passwords do not match");
    }

    try {
      // Destructure the data
      const {
        email,
        password,
        firstName,
        lastName,
        hospitalName,
        country,
        city,
        position,
        hospitalType
      } = registerData;

      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userId = user.uid;

      // Create user document in Firestore
      const userDocRef = doc(db, "users", userId);
      await setDoc(userDocRef, {
        email: user.email?.toLowerCase(),
        createdAt: new Date(),
        firstName,
        lastName,
        hospitalName,
        country,
        city,
        position,
        hospitalType
      });

      // Fetch and set user collection
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        setUserCollection(docSnap.data());
      } else {
        setUserCollection(null);
      }

      setUser(user);

      Alert.alert("Success", "Account created successfully!");
    } catch (error: any) {
      let errorMessage;
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "This email is already in use. Please try another.";
          break;
        case "auth/invalid-email":
          errorMessage = "The email address is not valid.";
          break;
        case "auth/weak-password":
          errorMessage = "The password is too weak. Please use a stronger password.";
          break;
        default:
          errorMessage = error.message || "Failed to create an account.";
      }

      Alert.alert("Error", errorMessage);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Fetch user collection
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        setUserCollection(docSnap.data());
      } else {
        setUserCollection(null);
      }

      setUser(firebaseUser);

      Alert.alert("Success", "Signed in successfully!");
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message || "Failed to sign in");
      throw error;
    }
  };

  const updateProfile = async (updateData: {
    firstName?: string;
    lastName?: string;
    hospitalName?: string;
    country?: string;
    city?: string;
    position?: string;
    hospitalType?: string;
  }) => {
    if (!user) {
      Alert.alert("Error", "User not logged in.");
      throw new Error("User not logged in");
    }

    try {
      const userDocRef = doc(db, "users", user.uid);

      // Update Firestore document
      await updateDoc(userDocRef, updateData);

      // Fetch updated user collection
      const updatedDocSnap = await getDoc(userDocRef);
      if (updatedDocSnap.exists()) {
        setUserCollection(updatedDocSnap.data());
      }

      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile.");
      throw error;
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setUserCollection(null);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        userCollection,
        login,
        logout,
        register,
        updateProfile,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
