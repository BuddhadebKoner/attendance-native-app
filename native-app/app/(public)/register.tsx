import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
   const [mobile, setMobile] = useState('');
   const [password, setPassword] = useState('');
   const [confirmPassword, setConfirmPassword] = useState('');
   const [name, setName] = useState('');
   const [email, setEmail] = useState('');
   const [loading, setLoading] = useState(false);
   const { register } = useAuth();
   const router = useRouter();

   const handleRegister = async () => {
      // Validation
      if (!mobile || !password) {
         Alert.alert('Error', 'Mobile and password are required');
         return;
      }

      if (password !== confirmPassword) {
         Alert.alert('Error', 'Passwords do not match');
         return;
      }

      if (password.length < 6) {
         Alert.alert('Error', 'Password must be at least 6 characters');
         return;
      }

      setLoading(true);
      try {
         await register({
            mobile,
            password,
            name: name || undefined,
            email: email || undefined,
         });
         // Navigation will be handled by the root layout
      } catch (error: any) {
         Alert.alert(
            'Registration Failed',
            error.message || 'An error occurred during registration'
         );
      } finally {
         setLoading(false);
      }
   };

   return (
      <SafeAreaView style={styles.container}>
         <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
               <Text style={styles.title}>Create Account</Text>
               <Text style={styles.subtitle}>Sign up to get started</Text>

               <View style={styles.form}>
                  <View style={styles.inputContainer}>
                     <Text style={styles.label}>Mobile Number *</Text>
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
                     <Text style={styles.label}>Name (Optional)</Text>
                     <TextInput
                        style={styles.input}
                        placeholder="Enter your name"
                        placeholderTextColor="#666"
                        value={name}
                        onChangeText={setName}
                        editable={!loading}
                     />
                  </View>

                  <View style={styles.inputContainer}>
                     <Text style={styles.label}>Email (Optional)</Text>
                     <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor="#666"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!loading}
                     />
                  </View>

                  <View style={styles.inputContainer}>
                     <Text style={styles.label}>Password *</Text>
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

                  <View style={styles.inputContainer}>
                     <Text style={styles.label}>Confirm Password *</Text>
                     <TextInput
                        style={styles.input}
                        placeholder="Confirm your password"
                        placeholderTextColor="#666"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        editable={!loading}
                     />
                  </View>

                  <TouchableOpacity
                     style={[styles.button, loading && styles.buttonDisabled]}
                     onPress={handleRegister}
                     disabled={loading}
                  >
                     {loading ? (
                        <ActivityIndicator color="#000" />
                     ) : (
                        <Text style={styles.buttonText}>Create Account</Text>
                     )}
                  </TouchableOpacity>

                  <View style={styles.footer}>
                     <Text style={styles.footerText}>Already have an account? </Text>
                     <TouchableOpacity
                        onPress={() => router.push('/(public)/login')}
                        disabled={loading}
                     >
                        <Text style={styles.linkText}>Sign In</Text>
                     </TouchableOpacity>
                  </View>
               </View>
            </View>
         </ScrollView>
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: '#000000',
   },
   scrollView: {
      flex: 1,
   },
   content: {
      flex: 1,
      padding: 24,
      justifyContent: 'center',
      paddingTop: 40,
      paddingBottom: 40,
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
