import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";

const CustomLoading = () => {
    return (
        <View style={styles.loader}><ActivityIndicator size="large" color="#111" /></View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
    },
    loader: {
        backgroundColor: 'white',
        justifyContent: "center",
        alignItems: "center",
        height: '100%'
    },
});

export default CustomLoading;