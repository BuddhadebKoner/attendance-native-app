import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
   const [mobile, setMobile] = useState('');
   const [password, setPassword] = useState('');
   const [loading, setLoading] = useState(false);
   const { login } = useAuth();
   const router = useRouter();

   const handleLogin = async () => {
      if (!mobile || !password) {
         Alert.alert('Error', 'Please fill in all fields');
         return;
      }

      setLoading(true);
      try {
         await login({ mobile, password });
         // Navigation will be handled by the root layout
      } catch (error: any) {
         Alert.alert(
            'Login Failed',
            error.message || 'An error occurred during login'
         );
      } finally {
         setLoading(false);
      }
   };

   return (
      <SafeAreaView style={styles.container}>
         <View style={styles.content}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            <View style={styles.form}>
               <View style={styles.inputContainer}>
                  <Text style={styles.label}>Mobile Number</Text>
                  <TextInput
                     style={styles.input}
                     placeholder="Enter your mobile number"
                     placeholderTextColor="#666"
                     value={mobile}
                     onChangeText={setMobile}
                     keyboardType="phone-pad"
                     autoCapitalize="none"
                     editable={!loading}
                  />
               </View>

               <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                     style={styles.input}
                     placeholder="Enter your password"
                     placeholderTextColor="#666"
                     value={password}
                     onChangeText={setPassword}
                     secureTextEntry
                     editable={!loading}
                  />
               </View>

               <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
               >
                  {loading ? (
                     <ActivityIndicator color="#000" />
                  ) : (
                     <Text style={styles.buttonText}>Sign In</Text>
                  )}
               </TouchableOpacity>

               <View style={styles.footer}>
                  <Text style={styles.footerText}>Don't have an account? </Text>
                  <TouchableOpacity
                     onPress={() => router.push('/(public)/register')}
                     disabled={loading}
                  >
                     <Text style={styles.linkText}>Sign Up</Text>
                  </TouchableOpacity>
               </View>
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
      justifyContent: 'center',
   },
   title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 8,
   },
   subtitle: {
      fontSize: 16,
      color: '#888',
      marginBottom: 40,
   },
   form: {
      gap: 20,
   },
   inputContainer: {
      gap: 8,
   },
   label: {
      fontSize: 14,
      fontWeight: '600',
      color: '#ffffff',
   },
   input: {
      backgroundColor: '#1a1a1a',
      borderRadius: 8,
      padding: 16,
      fontSize: 16,
      color: '#ffffff',
      borderWidth: 1,
      borderColor: '#333',
   },
   button: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      marginTop: 20,
   },
   buttonDisabled: {
      opacity: 0.6,
   },
   buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#000000',
   },
   footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
   },
   footerText: {
      fontSize: 14,
      color: '#888',
   },
   linkText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#ffffff',
   },
});
