import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";

const CustomButton = ({ title, logout=false, onPress, disabled = false, loading = false }) => {
  return (
    <TouchableOpacity
      style={[styles.button, logout ? styles.logOutButton : disabled ? styles.disabledButton : styles.activeButton ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFF" />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
    marginHorizontal: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2, // Adds subtle depth for Android
  },
  activeButton: {
    backgroundColor: "#45B3CB",
  },
  disabledButton: {
    backgroundColor: "#A9A9A9",
  },
  logOutButton: {
    backgroundColor: "red",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CustomButton;
