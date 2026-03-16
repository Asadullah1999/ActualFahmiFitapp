import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { RootNavigatorParamList } from '@/types';

import LoginScreen from '@/screens/auth/LoginScreen';
import SignupScreen from '@/screens/auth/SignupScreen';
import OnboardingScreen from '@/screens/onboarding/OnboardingScreen';
import TabNavigator from './TabNavigator';
import AIChatScreen from '@/screens/chat/AIChatScreen';
import MealScannerScreen from '@/screens/meal/MealScannerScreen';
import BarcodeScannerScreen from '@/screens/scan/BarcodeScannerScreen';
import ScanMenuScreen from '@/screens/scan/ScanMenuScreen';
import WeightLogScreen from '@/screens/weight/WeightLogScreen';
import SleepTrackerScreen from '@/screens/sleep/SleepTrackerScreen';
import GroceryListScreen from '@/screens/grocery/GroceryListScreen';
import WhatsAppSetupScreen from '@/screens/whatsapp/WhatsAppSetupScreen';
import RemindersScreen from '@/screens/reminders/RemindersScreen';
import SettingsScreen from '@/screens/settings/SettingsScreen';
import WorkoutScreen from '@/screens/workout/WorkoutScreen';
import PricingScreen from '@/screens/pricing/PricingScreen';

const Stack = createNativeStackNavigator<RootNavigatorParamList>();

export default function RootNavigator() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const isAuthenticated = !!session;
  const isOnboarded = !!profile?.onboarded;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bg },
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : !isOnboarded ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="AIChat" component={AIChatScreen} />
            <Stack.Screen name="MealScanner" component={MealScannerScreen} />
            <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} />
            <Stack.Screen name="ScanMenu" component={ScanMenuScreen} />
            <Stack.Screen name="WeightLog" component={WeightLogScreen} />
            <Stack.Screen name="SleepTracker" component={SleepTrackerScreen} />
            <Stack.Screen name="GroceryList" component={GroceryListScreen} />
            <Stack.Screen name="WhatsAppSetup" component={WhatsAppSetupScreen} />
            <Stack.Screen name="Reminders" component={RemindersScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Workout" component={WorkoutScreen} />
            <Stack.Screen name="Pricing" component={PricingScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
