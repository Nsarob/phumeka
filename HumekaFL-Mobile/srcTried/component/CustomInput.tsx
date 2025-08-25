import React from "react";
import { View, TextInput, StyleSheet, Text } from "react-native";

const CustomInput = ({ label, style={}, error=false, placeholder,onBlur=() => {}, value, onChangeText, secureTextEntry = false, keyboardType="default" }: any) => {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, { borderColor: error ? "red" : "#45B3CB" }]}
        placeholder={placeholder}
        placeholderTextColor="#A9A9A9"
        value={value}
        onBlur={onBlur}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
    fontWeight: "600",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#F9F9F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2, // Adds a subtle shadow on Android
  },
});

export default CustomInput;
