import Constants from 'expo-constants';

// Environment configuration
export const config = {
   apiUrl: Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
   environment: Constants.expoConfig?.extra?.environment || process.env.EXPO_PUBLIC_ENV || 'development',
   googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
};

export default config;
