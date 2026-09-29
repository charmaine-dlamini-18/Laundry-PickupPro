import React, { useEffect } from 'react';
import './src/i18n';
import { Platform, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import { AdminProvider } from './src/context/AdminContext';
import { DriverOrdersProvider } from './src/context/DriverOrdersContext';
import { ChatProvider } from './src/context/ChatContext';
import { SupportProvider } from './src/context/SupportContext';
import { colors } from './src/theme/colors';

if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    #root {
      display: flex;
      flex-direction: column;
    }
    * {
      box-sizing: border-box;
    }
    ::-webkit-scrollbar {
      width: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(0,0,0,0.15);
      border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(0,0,0,0.25);
    }
    input, textarea, select, button {
      font-family: inherit;
    }
  `;
  document.head.appendChild(style);
  document.title = 'Laundry Pickup Pro';
}

function AppContent() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <AdminProvider>
          <DriverOrdersProvider>
            <ChatProvider>
              <SupportProvider>
                <NavigationContainer>
                  <AppNavigator />
                </NavigationContainer>
              </SupportProvider>
            </ChatProvider>
          </DriverOrdersProvider>
        </AdminProvider>
      </NotificationsProvider>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <AppContent />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
  },
});
