import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius } from '@/constants/theme';
import { MainTabParamList } from '@/types';

import DashboardScreen from '@/screens/dashboard/DashboardScreen';
import MealCheckinScreen from '@/screens/meal/MealCheckinScreen';
import ScanMenuScreen from '@/screens/scan/ScanMenuScreen';
import ProgressScreen from '@/screens/progress/ProgressScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

function ScanTabButton({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) {
  return (
    <TouchableOpacity
      style={styles.scanButtonContainer}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['#22c55e', '#06b6d4']}
        style={styles.scanButton}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {children}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textDim,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () => (
          <View style={styles.tabBarBg} />
        ),
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="LogMeal"
        component={MealCheckinScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant" size={size} color={color} />
          ),
          tabBarLabel: 'Log',
        }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanMenuScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons name="scan" size={28} color={focused ? '#fff' : '#fff'} />
          ),
          tabBarLabel: '',
          tabBarButton: (props) => (
            <ScanTabButton onPress={props.onPress as () => void}>
              <Ionicons name="scan" size={28} color="#fff" />
            </ScanTabButton>
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up" size={size} color={color} />
          ),
          tabBarLabel: 'Progress',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.bgCard,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabBarBg: {
    flex: 1,
    backgroundColor: Colors.bgCard,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  scanButtonContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
