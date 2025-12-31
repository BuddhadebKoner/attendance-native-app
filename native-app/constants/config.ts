import Constants from 'expo-constants';

// Environment configuration
export const config = {
   apiUrl: Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
   environment: Constants.expoConfig?.extra?.environment || process.env.EXPO_PUBLIC_ENV || 'development',
};

export default config;
