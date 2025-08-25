import React, { useContext } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, SafeAreaView } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { signInWithEmailAndPassword } from "firebase/auth";
import { AuthContext } from "../../Hooks/AuthContext";
import { auth, db } from "../../config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore"; // Firestore functions
import CustomInput from "../../component/CustomInput";
import CustomButton from "../../component/CustomButton";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const LogIn = ({ navigation }) => {

  const [loading, setLoading] = React.useState(false);
  const [password, setPassword] = React.useState("");

  // Validation schema using Yup
  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  // Handle sign-in
  const { login } = useContext(AuthContext); // Use AuthContext to set the user
  const handleSignIn = async (values) => {
    const { email, password } = values;
    
    try {
      setLoading(true);
      await login(email, password);
    } catch (error) {
      // Error handling is now done in the login method
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text style={{ marginTop: 55, color: "#45B3CB", alignSelf: 'center', fontWeight: "600", fontSize: 35 }}>HumekaFL</Text>
      <KeyboardAwareScrollView
        enableOnAndroid={true} // Ensures behavior on Android
        extraScrollHeight={20} // Adds padding when keyboard is active
        keyboardShouldPersistTaps="handled" // Closes the keyboard when tapping outside
      >
        <View style={styles.container}>
          <Text style={styles.title}>Log In</Text>
          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={validationSchema}
            onSubmit={handleSignIn}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }: any) => (
              <View>
                {/* Email Input */}
                <CustomInput
                  label="Email"
                  placeholder="Enter your email"
                  onBlur={handleBlur("email")}
                  value={values.email}
                  onChangeText={handleChange("email")}
                />
                {touched.email && errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}

                {/* Password Input */}
                <CustomInput
                  label="Password"
                  placeholder="Enter your password"
                  onChangeText={handleChange("password")}
                  onBlur={handleBlur("password")}
                  value={values.password}
                  secureTextEntry
                />
                {touched.password && errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}

                {/* Submit Button */}
                <CustomButton title="Sign In" onPress={handleSubmit} loading={loading} />

                {/* Forgot Password */}
                <Text
                  style={styles.forgotPassword}
                  onPress={() => navigation.navigate("ForgotPassword")} // Replace with your ForgotPassword screen
                >
                  Forgot Password?
                </Text>
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
    // backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
  },
  forgotPassword: {
    color: "#45B3CB",
    textAlign: "center",
    marginTop: 10,
    fontSize: 16,
    textDecorationLine: "underline",
  },
});

export default LogIn;

