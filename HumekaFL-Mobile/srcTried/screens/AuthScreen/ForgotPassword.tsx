import React from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native";
import CustomInput from "../../component/CustomInput";
import CustomButton from "../../component/CustomButton";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../config/firebaseConfig";

const ForgotPassword = ({ navigation }) => {
  const auth = getAuth();
  const [loading, setLoading] = React.useState(false);

  // Validation schema using Yup
  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
  });

  // Handle sign-in
  const handleForgetPassword = async (values) => {
    try {
      setLoading(true);
      const { email } = values;

      const normalizedEmail = email.toLowerCase()
  
      // Check if the email exists in your Firestore users collection
      const usersCollection = collection(db, "users");
      const emailQuery = query(usersCollection, where("email", "==", normalizedEmail));
      const querySnapshot = await getDocs(emailQuery);
  
      if (querySnapshot.empty) {
        // Email is not registered
        setLoading(false);
        Alert.alert("Error", "This email is not registered. Please try again.");
        return;
      }
  
      // Email is registered, send the password reset email
      await sendPasswordResetEmail(auth, email);
  
      setLoading(false);
      Alert.alert("Success", "Email has been sent successfully!");
    } catch (error) {
      console.error(error);
      setLoading(false);
      Alert.alert("Error", error.message || "Failed to send an email");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text style={{ marginTop: 40, marginBottom: 10, color: "#45B3CB", alignSelf: 'center', fontWeight: "600", fontSize: 35 }}>HumekaFL</Text>
      <KeyboardAwareScrollView
        enableOnAndroid={true} // Ensures behavior on Android
        extraScrollHeight={20} // Adds padding when keyboard is active
        keyboardShouldPersistTaps="handled" // Closes the keyboard when tapping outside
      >
        <View style={styles.mainContainer}>
          <Text style={styles.title}>Forget Password</Text>
          <Formik
            initialValues={{ email: "" }}
            validationSchema={validationSchema}
            onSubmit={handleForgetPassword}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }: any) => (
              <View>
                {/* Email Input */}
                <CustomInput
                  label="Email"
                  placeholder="Enter your email"
                  onBlur={handleBlur("email")}
                  error={touched.email && errors.email}
                  value={values.email}
                  onChangeText={handleChange("email")}
                />

                {/* Submit Button */}
                <CustomButton title="Submit" onPress={handleSubmit} loading={loading} />
              </View>
            )}
          </Formik>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
  },
  mainContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    // backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 40,
    textAlign: "center",
  },
});

export default ForgotPassword;
