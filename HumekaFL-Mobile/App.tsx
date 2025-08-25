import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthContext, AuthContextType, AuthProvider } from "./src/Hooks/AuthContext";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";

// Main App Screens
import Home from "./src/screens/HomeScreen/Home";
import Profile from "./src/screens/HomeScreen/Profile";
import Submissions from "./src/screens/HomeScreen/Submissions";
import FAQ from "./src/screens/HomeScreen/FAQ";

// Auth Screens
import SignIn from "./src/screens/AuthScreen/SignIn";
import LogIn from "./src/screens/AuthScreen/Login";
import ForgotPassword from "./src/screens/AuthScreen/ForgotPassword";
import MainApp from "./src/screens/AuthScreen/MainApp";
import AuthScreen from "./src/screens/AuthScreen/AuthScreen";
import CustomLoading from "./src/component/CustomLoading";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * A stack navigator that contains three screens for authentication purposes.
 *
 * - The "SignIn" screen allows the user to enter their email and password to sign in.
 * - The "LogIn" screen allows the user to enter their email and password to log in.
 * - The "ForgotPassword" screen allows the user to enter their email to reset their password.
 *
 * The stack navigator will only show the header on the "ForgotPassword" screen.
 */
const AuthStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="AuthScreen" component={AuthScreen} options={{ headerShown: false }} />
    <Stack.Screen name="SignIn" component={SignIn} options={{ headerShown: false }} />
    <Stack.Screen name="LogIn" component={LogIn} options={{ headerShown: false }} />
    <Stack.Screen name="MainApp" component={MainApp} options={{ headerShown: false }} />
    <Stack.Screen
      name="ForgotPassword"
      component={ForgotPassword}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

// Bottom Tab Navigator
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === "Home") {
          iconName = focused ? "home" : "home-outline";
        } else if (route.name === "FAQ") {
          iconName = focused ? "help-circle" : "help-circle-outline";
        } else if (route.name === "Submissions") {
          iconName = focused ? "document-text" : "document-text-outline";
        } else if (route.name === "Profile") {
          iconName = focused ? "person" : "person-outline";
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: "#45B3CB",
      tabBarInactiveTintColor: "gray",
      headerShown: false, // Disable header for tabs
    })}
  >
    <Tab.Screen name="Home" component={Home} />
    <Tab.Screen name="Submissions" component={Submissions} />
    <Tab.Screen name="Profile" component={Profile} />
    <Tab.Screen name="FAQ" component={FAQ} />
  </Tab.Navigator>
);

// Main Stack with Bottom Tabs
const MainStack = () => <MainTabs />;

const AppNavigator = () => {
  const { user, loading } = useContext<AuthContextType>(AuthContext);
  console.log("THE MAIN USER APP   >>", user)
  return (
    <NavigationContainer>
      {loading ? <CustomLoading /> : user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppNavigation />
    </AuthProvider>
  );
};

const AppNavigation = () => {
  const { loading, isAuthenticated } = useContext(AuthContext);

  if (loading) {
    return <CustomLoading />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default App;

