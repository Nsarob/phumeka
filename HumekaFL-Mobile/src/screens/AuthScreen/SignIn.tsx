import React, { useContext } from "react";
import { View, Text, TextInput, StyleSheet, Alert, SafeAreaView, ScrollView } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { AuthContext } from "../../Hooks/AuthContext";
import { auth, db } from "../../config/firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore"; // Firestore functions
import CustomButton from "../../component/CustomButton";
import CustomInput from "../../component/CustomInput";
import { Picker } from '@react-native-picker/picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const SignIn = ({navigation}) => {
  const { register } = useContext(AuthContext);
  const [loading, setLoading] = React.useState(false);
  const [hospitalType, setHospitalType] = React.useState('Public');

  const handleRegister = async (values) => {
    try {
      setLoading(true);
      await register({
        ...values,
        hospitalType
      });
      //

    } catch (error) {
      // Error handling is now done in the register method
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text style={{ marginTop: 20, marginBottom: 10, color: "#45B3CB", alignSelf: 'center', fontWeight: "600", fontSize: 35 }}>HumekaFL</Text>
      <KeyboardAwareScrollView
        enableOnAndroid={true} // Ensures behavior on Android
        extraScrollHeight={20} // Adds padding when keyboard is active
        keyboardShouldPersistTaps="handled" // Closes the keyboard when tapping outside
      >
        <View style={styles.mainContainer}>
          <Text style={styles.title}>Register</Text>
          <Text style={styles.subTitle}>Personal Info</Text>
          <Formik
            initialValues={{ email: "", password: "", confirmPassword: "" }}
            validationSchema={Yup.object({
              firstName: Yup.string().required("First Name is Required"),
              lastName: Yup.string().required("Last Name is Required"),
              hospitalName: Yup.string().required("Hospital Name is Required"),
              country: Yup.string().required("Country Name is Required"),
              city: Yup.string().required("City Name is Required"),
              position: Yup.string().optional(),
              email: Yup.string().email("Invalid email address").required("Email is required"),
              password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
              confirmPassword: Yup.string()
                .oneOf([Yup.ref("password")], "Passwords must match")
                .required("Confirm password is required"),

            })}
            onSubmit={handleRegister}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }: any) => (
              <View>
                {/* Email Input */}
                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                  <CustomInput
                    label="First Name"
                    placeholder="Enter your first Name"
                    onBlur={handleBlur("firstName")}
                    value={values.firstName}
                    error={touched.firstName && errors.firstName}
                    style={{
                      width: '50%',
                      marginRight: 4
                    }}
                    onChangeText={handleChange("firstName")}
                  />
                  {touched.firstName && errors.firstName && (
                    <Text style={styles.errorText}>{errors.firstName}</Text>
                  )}
                  <CustomInput
                    label="Last Name"
                    placeholder="Enter your Last Name"
                    onBlur={handleBlur("lastName")}
                    style={{
                      width: '50%',
                    }}
                    error={touched.lastName && errors.lastName}
                    value={values.lastName}
                    onChangeText={handleChange("lastName")}
                  />
                </View>
                <CustomInput
                  label="position"
                  placeholder="Enter your position"
                  onBlur={handleBlur("position")}
                  value={values.position}
                  onChangeText={handleChange("position")}
                />
                <CustomInput
                  label="Email"
                  placeholder="Enter your email"
                  onBlur={handleBlur("email")}
                  error={touched.email && errors.email}
                  value={values.email}
                  onChangeText={handleChange("email")}
                />

                {/* Password Input */}
                <CustomInput
                  label="Password"
                  placeholder="Enter your password"
                  onChangeText={handleChange("password")}
                  error={touched.password && errors.password}
                  onBlur={handleBlur("password")}
                  value={values.password}
                  secureTextEntry
                />

                <CustomInput
                  label="Confirm Password"
                  placeholder="COnfirm your password"
                  onChangeText={handleChange("confirmPassword")}
                  error={touched.confirmPassword && errors.confirmPassword}
                  onBlur={handleBlur("confirmPassword")}
                  value={values.confirmPassword}
                  secureTextEntry
                />



                {/* Hospital Info */}
                <Text style={styles.subTitle}>Hospital Info</Text>
                <CustomInput
                  label="Name of the Hospital"
                  placeholder="Enter your hospital's Name"
                  onBlur={handleBlur("hospitalName")}
                  value={values.hospitalName}
                  error={touched.hospitalName && errors.hospitalName}
                  onChangeText={handleChange("hospitalName")}
                />
                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                  <CustomInput
                    label="City"
                    placeholder="Enter your City"
                    onBlur={handleBlur("city")}
                    error={touched.city && errors.city}
                    style={{
                      width: '50%',
                      marginRight: 4
                    }}
                    value={values.city}
                    onChangeText={handleChange("city")}
                  />
                  <CustomInput
                    label="Country"
                    placeholder="Enter your Country"
                    onBlur={handleBlur("country")}
                    value={values.country}
                    error={touched.country && errors.country}
                    style={{
                      width: '50%',
                    }}
                    onChangeText={handleChange("country")}
                  />
                </View>

                <Text style={styles.label}>Hospital Type</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={hospitalType}
                    onValueChange={(itemValue) => setHospitalType(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Public" value="Public" />
                    <Picker.Item label="Private" value="Private" />
                  </Picker>
                </View>


                {/* Submit Button */}
                <CustomButton title="Register" onPress={handleSubmit} loading={loading} />

                <Text
                  style={styles.GoBackButton}
                  onPress={() => navigation.goBack()} // Replace with your ForgotPassword screen
                >
                  Go Back
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
  mainContainer: {
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
  subTitle: {
    fontSize: 18,
    color: "#333",
    marginVertical: 5,
    fontWeight: "600",
    textAlign: "left",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
  },
  errorText: {
    color: "red",
    fontSize: 12,
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
  },
  picker: {
    height: 150,
    color: '#333',
  },
  GoBackButton: {
    color: "#45B3CB",
    textAlign: "center",
    marginTop: 5,
    fontSize: 16,
    textDecorationLine: "underline",
  },
});

export default SignIn;
