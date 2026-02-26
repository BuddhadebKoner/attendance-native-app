import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuth } from '../../contexts/AuthContext';
import config from '../../constants/config';

// Configure Google Sign-In once
GoogleSignin.configure({
   webClientId: config.googleWebClientId,
});

export default function LoginScreen() {
   const [googleLoading, setGoogleLoading] = useState(false);
   const { googleSignIn } = useAuth();

   const handleGoogleSignIn = async () => {
      setGoogleLoading(true);
      try {
         await GoogleSignin.hasPlayServices();
         // Sign out first to always show the account picker
         await GoogleSignin.signOut();
         const response = await GoogleSignin.signIn();
         const idToken = response.data?.idToken;
         console.log('[Google Auth] Got idToken:', !!idToken);
         if (idToken) {
            await googleSignIn({ idToken });
         } else {
            Alert.alert('Google Sign-In Failed', 'No ID token received from Google');
         }
      } catch (error: any) {
         if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            console.log('[Google Auth] User cancelled');
         } else if (error.code === statusCodes.IN_PROGRESS) {
            console.log('[Google Auth] Already in progress');
         } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            Alert.alert('Error', 'Google Play Services not available');
         } else {
            console.error('[Google Auth] Error:', error);
            Alert.alert('Google Sign-In Failed', error.message || 'An error occurred');
         }
      } finally {
         setGoogleLoading(false);
      }
   };

   return (
      <SafeAreaView style={styles.container}>
         <View style={styles.content}>
            <View style={styles.brandingSection}>
               <View style={styles.iconCircle}>
                  <Text style={styles.iconText}>📋</Text>
               </View>
               <Text style={styles.title}>Attendance App</Text>
               <Text style={styles.subtitle}>
                  Track attendance, manage classes, and stay organized — all in one place.
               </Text>
            </View>

            <View style={styles.authSection}>
               <TouchableOpacity
                  style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
                  onPress={handleGoogleSignIn}
                  disabled={googleLoading}
               >
                  {googleLoading ? (
                     <ActivityIndicator color="#fff" />
                  ) : (
                     <View style={styles.googleButtonContent}>
                        <Image
                           source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                           style={styles.googleIcon}
                        />
                        <Text style={styles.googleButtonText}>Continue with Google</Text>
                     </View>
                  )}
               </TouchableOpacity>

               <Text style={styles.termsText}>
                  By continuing, you agree to our Terms of Service and Privacy Policy
               </Text>
            </View>
         </View>
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: '#000000',
   },
   content: {
      flex: 1,
      padding: 24,
      justifyContent: 'space-between',
   },
   brandingSection: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 40,
   },
   iconCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: '#1a1a1a',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#333',
   },
   iconText: {
      fontSize: 48,
   },
   title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 12,
      textAlign: 'center',
   },
   subtitle: {
      fontSize: 16,
      color: '#888',
      textAlign: 'center',
      lineHeight: 24,
      paddingHorizontal: 20,
   },
   authSection: {
      paddingBottom: 20,
      gap: 16,
   },
   googleButton: {
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      padding: 18,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#333',
   },
   buttonDisabled: {
      opacity: 0.6,
   },
   googleButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
   },
   googleIcon: {
      width: 22,
      height: 22,
   },
   googleButtonText: {
      fontSize: 17,
      fontWeight: '600',
      color: '#ffffff',
   },
   termsText: {
      fontSize: 12,
      color: '#555',
      textAlign: 'center',
      lineHeight: 18,
      paddingHorizontal: 20,
   },
});
