import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../services/api';

export default function ChangePasswordScreen() {
   const router = useRouter();
   const { logout } = useAuth();
   const [oldPassword, setOldPassword] = useState('');
   const [newPassword, setNewPassword] = useState('');
   const [confirmPassword, setConfirmPassword] = useState('');
   const [loading, setLoading] = useState(false);

   const handleChangePassword = async () => {
      // Validation
      if (!oldPassword || !newPassword || !confirmPassword) {
         Alert.alert('Error', 'All fields are required');
         return;
      }

      if (newPassword !== confirmPassword) {
         Alert.alert('Error', 'New passwords do not match');
         return;
      }

      if (newPassword.length < 6) {
         Alert.alert('Error', 'New password must be at least 6 characters');
         return;
      }

      if (oldPassword === newPassword) {
         Alert.alert('Error', 'New password must be different from old password');
         return;
      }

      setLoading(true);
      try {
         const response = await authApi.changePassword({
            oldPassword,
            newPassword,
         });

         if (response.success) {
            Alert.alert(
               'Success',
               'Password changed successfully. You will be logged out.',
               [
                  {
                     text: 'OK',
                     onPress: async () => {
                        await logout();
                        router.replace('/(public)/login');
                     },
                  },
               ]
            );
         } else {
            Alert.alert('Error', response.message || 'Failed to change password');
         }
      } catch (error: any) {
         Alert.alert(
            'Change Password Failed',
            error.message || 'An error occurred while changing password'
         );
      } finally {
         setLoading(false);
      }
   };

   return (
      <SafeAreaView style={styles.container}>
         <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
               <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                  <Text style={styles.backButtonText}>← Back</Text>
               </TouchableOpacity>
               <Text style={styles.title}>Change Password</Text>
               <Text style={styles.subtitle}>Enter your current and new password</Text>

               <View style={styles.form}>
                  <View style={styles.inputContainer}>
                     <Text style={styles.label}>Current Password</Text>
                     <TextInput
                        style={styles.input}
                        placeholder="Enter your current password"
                        placeholderTextColor="#666"
                        value={oldPassword}
                        onChangeText={setOldPassword}
                        secureTextEntry
                        editable={!loading}
                     />
                  </View>

                  <View style={styles.inputContainer}>
                     <Text style={styles.label}>New Password</Text>
                     <TextInput
                        style={styles.input}
                        placeholder="Enter your new password"
                        placeholderTextColor="#666"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                        editable={!loading}
                     />
                  </View>

                  <View style={styles.inputContainer}>
                     <Text style={styles.label}>Confirm New Password</Text>
                     <TextInput
                        style={styles.input}
                        placeholder="Confirm your new password"
                        placeholderTextColor="#666"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        editable={!loading}
                     />
                  </View>

                  <View style={styles.infoBox}>
                     <Text style={styles.infoText}>
                        • Password must be at least 6 characters long{'\n'}
                        • You will be logged out after changing your password{'\n'}
                        • You'll need to login again with your new password
                     </Text>
                  </View>

                  <TouchableOpacity
                     style={[styles.button, loading && styles.buttonDisabled]}
                     onPress={handleChangePassword}
                     disabled={loading}
                  >
                     {loading ? (
                        <ActivityIndicator color="#000" />
                     ) : (
                        <Text style={styles.buttonText}>Change Password</Text>
                     )}
                  </TouchableOpacity>
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
      paddingTop: 10,
   },
   backButton: {
      marginBottom: 10,
   },
   backButtonText: {
      fontSize: 16,
      color: '#ffffff',
   },
   title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 8,
   },
   subtitle: {
      fontSize: 16,
      color: '#888',
      marginBottom: 30,
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
   infoBox: {
      backgroundColor: '#1a1a1a',
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: '#333',
   },
   infoText: {
      fontSize: 12,
      color: '#888',
      lineHeight: 18,
   },
   button: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      marginTop: 10,
   },
   buttonDisabled: {
      opacity: 0.6,
   },
   buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#000000',
   },
});
