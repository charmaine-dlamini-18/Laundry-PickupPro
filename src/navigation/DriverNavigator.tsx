import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import DriverHomeScreen from '../screens/Driver/DriverHomeScreen';
import OrderScreen from '../screens/Driver/OrderScreen';
import PickupDetailsScreen from '../screens/Driver/PickupDetailsScreen';
import DeliveryDetailsScreen from '../screens/Driver/DeliveryDetailsScreen';
import DriverChatScreen from '../screens/Driver/ChatScreen';
import ProfileScreen from '../screens/Driver/ProfileScreen';
import NotificationScreen from '../screens/Driver/NotificationScreen';
import AccountSettingsScreen from '../screens/Driver/AccountSettingsScreen';
import NotificationSettingsScreen from '../screens/Driver/NotificationSettingsScreen';
import PrivacySecurityScreen from '../screens/Driver/PrivacySecurityScreen';
import HelpSupportScreen from '../screens/Driver/HelpSupportScreen';
import ChangePasswordScreen from '../screens/Driver/ChangePasswordScreen';
import NavigationScreen from '../screens/Driver/NavigationScreen';
import ChatScreen from '../components/ChatScreen';
import type { ChatScreenParams } from '../components/ChatScreen';

export type Order = {
  id: string;
  orderNumber: string;
  bookingReference?: string;
  type: string;
  customer: string;
  address: string;
  time: string;
  status?: string;
  phone?: string;
  driver?: string;
  laundromat?: string;
  laundromatAddress?: string;
  notes?: string;
};

export type DriverTabParamList = {
  Home: undefined;
  Orders: undefined;
  Chat: undefined;
  Profile: undefined;
};

export type DriverStackParamList = {
  DriverTabs: NavigatorScreenParams<DriverTabParamList> | undefined;

  Home: undefined;
  Orders: undefined;
  Chat: undefined;
  Profile: undefined;

  Notifications: undefined;

  AccountSettings: undefined;
  NotificationSettings: undefined;
  PrivacySecurity: undefined;
  HelpSupport: undefined;
  ChangePassword: undefined;
  Navigation: undefined;

  OrderDetails: {
    order: Order;
  };

  DeliveryDetails: {
    order: Order;
  };

  ChatScreen: ChatScreenParams;
};

const Stack = createNativeStackNavigator<DriverStackParamList>();
const Tab = createBottomTabNavigator<DriverTabParamList>();

const isWeb = Platform.OS === 'web';

const tabIcons: Record<
  keyof DriverTabParamList,
  {
    active: keyof typeof MaterialCommunityIcons.glyphMap;
    inactive: keyof typeof MaterialCommunityIcons.glyphMap;
  }
> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Orders: { active: 'clipboard-text', inactive: 'clipboard-text-outline' },
  Chat: { active: 'chat', inactive: 'chat-outline' },
  Profile: { active: 'account', inactive: 'account-outline' },
};

const renderTabIcon = (routeName: keyof DriverTabParamList) => ({
  color,
  size,
}: {
  color: string;
  size: number;
}) => {
  const icons = tabIcons[routeName];
  return (
    <MaterialCommunityIcons
      name={color === '#5F6F82' ? icons.active : icons.inactive}
      size={size}
      color={color}
    />
  );
};

function DriverTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#5F6F82',
        tabBarInactiveTintColor: '#2B3642',
        tabBarIcon: renderTabIcon(route.name as keyof DriverTabParamList),
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarStyle: styles.tabBar,
      })}
    >
      <Tab.Screen
        name="Home"
        component={DriverHomeScreen}
      />
      <Tab.Screen
        name="Orders"
        component={OrderScreen}
      />
      <Tab.Screen
        name="Chat"
        component={DriverChatScreen}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
}

export default function DriverNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="DriverTabs"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="DriverTabs"
        component={DriverTabs}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationScreen}
      />
      <Stack.Screen
        name="AccountSettings"
        component={AccountSettingsScreen}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
      />
      <Stack.Screen
        name="PrivacySecurity"
        component={PrivacySecurityScreen}
      />
      <Stack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
      />
      <Stack.Screen
        name="Navigation"
        component={NavigationScreen}
      />
      <Stack.Screen
        name="OrderDetails"
        component={PickupDetailsScreen}
      />
      <Stack.Screen
        name="DeliveryDetails"
        component={DeliveryDetailsScreen}
      />
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8ECF1',
    paddingTop: 6,
    paddingBottom: isWeb ? 10 : 6,
    height: isWeb ? 72 : 66,
    ...(isWeb ? {
      maxWidth: 500,
      alignSelf: 'center',
      width: '100%',
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      shadowColor: '#0F363F',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    } : {}),
  },
  tabItem: {
    paddingVertical: 2,
    ...(isWeb ? { minWidth: 64 } : {}),
  },
  tabLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    marginTop: 1,
  },
});
