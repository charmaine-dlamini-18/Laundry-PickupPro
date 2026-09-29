import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from './src/lib/supabase';

import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import { AdminProvider } from './src/context/AdminContext';
import { DriverOrdersProvider } from './src/context/DriverOrdersContext';
import { ChatProvider } from './src/context/ChatContext';
import { SupportProvider } from './src/context/SupportContext';

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
  useEffect(() => {
    const handleAuthUrl = async (url: string) => {
      try {
        console.log('AUTH URL RECEIVED:', url);
        const { params, errorCode } = QueryParams.getQueryParams(url);

        if (errorCode) {
          console.log('AUTH URL ERROR:', errorCode);
          return;
        }

        const { access_token, refresh_token } = params;

        if (!access_token || !refresh_token) {
          return;
        }

        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          console.log('AUTH SESSION ERROR:', error.message);
        }
      } catch (error) {
        console.log('AUTH URL HANDLING ERROR:', error);
      }
    };

    const handleInitialUrl = async () => {
      const url = await Linking.getInitialURL();

      if (url) {
        await handleAuthUrl(url);
      }
    };

    handleInitialUrl();

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleAuthUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

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
      <AppContent />
    </SafeAreaProvider>
  );
}