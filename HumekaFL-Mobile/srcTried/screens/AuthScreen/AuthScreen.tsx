import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import CustomButton from '../../component/CustomButton';

const AuthScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text style={styles.title}>HumekaFL</Text>
      <Image
        source={require('../../../assets/icon.png')} // Adjust the path as needed
        style={styles.icon}
        resizeMode="contain"
      />
      <View style={styles.container}>
        <CustomButton title="Log In" onPress={() => navigation.navigate('LogIn')} loading={false} />
        <CustomButton title="Register" onPress={() => navigation.navigate('SignIn')} loading={false} />
        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => navigation.navigate('MainApp')}
        >
          <Text style={styles.smallButtonText}>Continue without Signing In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 150,
    flexGrow: 1
  },
  title: {
    marginTop: 105,
    marginBottom: 10,
    color: "#45B3CB",
    alignSelf: 'center',
    fontWeight: "600",
    fontSize: 35
  },
  smallButton: {
    marginTop: 10,
    alignSelf: 'center'
  },
  smallButtonText: {
    fontSize: 16,
    color: '#45B3CB',
    textDecorationLine: 'underline',
  },
  icon: {
    width: 100, // Adjust size as needed
    height: 100,
    alignSelf: 'center',
    marginBottom: 20,
  },
});

export default AuthScreen;
