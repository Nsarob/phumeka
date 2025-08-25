import React, { useContext, useEffect, useState } from "react";
import { StyleSheet, Text, Alert, ScrollView, SafeAreaView, ActivityIndicator, View } from "react-native";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../config/firebaseConfig";
import CustomInput from "../../component/CustomInput";
import CustomButton from "../../component/CustomButton";
import CustomLoading from "../../component/CustomLoading";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { AuthContext } from "../../Hooks/AuthContext";
import { Picker } from "@react-native-picker/picker";

const Profile = ({ navigation }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [position, setPosition] = useState("");
  const [hospitalType, setHospitalType] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [mainLoading, setMainLoading] = useState(false);

  const { updateProfile, logout } = useContext(AuthContext);

  const userId = auth.currentUser?.uid;

  // Fetch user data on load
  useEffect(() => {
    setMainLoading(true)
    const fetchUserData = async () => {
      if (!userId) return;
      try {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFirstName(userData.firstName || "");
          setLastName(userData.lastName || "");
          setHospitalName(userData.hospitalName || "");
          setCountry(userData.country || "");
          setCity(userData.city || "");
          setPosition(userData.position || "");
          setHospitalType(userData.hospitalType || "");
        } else {
          Alert.alert("Error", "User data not found.");
        }
        setMainLoading(false)
      } catch (error) {
        console.error("Error fetching user data:", error);
        setMainLoading(false)
        Alert.alert("Error", "Failed to fetch user data.");
      }
    };

    fetchUserData();
  }, [userId]);

  // Handle profile update
  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      await updateProfile({
        firstName,
        lastName,
        hospitalName,
        country,
        city,
        position,
        hospitalType,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout()
      Alert.alert("Success", "Logged out successfully!");
      // navigation.navigate("Login");
      setLogoutLoading(false)
    } catch (error) {
      console.error("Error logging out:", error);
      setLogoutLoading(false)
      Alert.alert("Error", "Failed to log out.");
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {mainLoading ? <CustomLoading /> :
        <><Text style={styles.header}>Edit Profile</Text>
          <KeyboardAwareScrollView contentContainerStyle={styles.container}>
            <CustomInput
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter your first name"
            />
            <CustomInput
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter your last name"
            />
            <CustomInput
              label="Hospital Name"
              value={hospitalName}
              onChangeText={setHospitalName}
              placeholder="Enter your hospital name"
            />
            <CustomInput
              label="Country"
              value={country}
              onChangeText={setCountry}
              placeholder="Enter your country"
            />
            <CustomInput
              label="City"
              value={city}
              onChangeText={setCity}
              placeholder="Enter your city"
            />
            <CustomInput
              label="Position"
              value={position}
              onChangeText={setPosition}
              placeholder="Enter your position"
            />
            <Text style={styles.label}>Hospital Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={hospitalType}
                onValueChange={(itemValue) => setHospitalType(itemValue)}
              >
                <Picker.Item label="Public" value="Public" />
                <Picker.Item label="Private" value="Private" />
              </Picker>
            </View>
            <CustomButton
              title="Update Profile"
              onPress={handleUpdateProfile}
              loading={loading}
            />
            <CustomButton
              title="Log Out"
              logout
              onPress={handleLogout}
              loading={logoutLoading}
            />
          </KeyboardAwareScrollView></>}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    color: '#45B3CB',
    marginBottom: 20,
    marginTop: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
    fontWeight: "600",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#45B3CB',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 10,
    height: 180,
  },
});

export default Profile;