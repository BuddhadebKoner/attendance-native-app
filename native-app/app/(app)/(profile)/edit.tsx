import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useUpdateProfile } from '../../../hooks/queries';
import { useRequireAuth } from '../../../hooks/useRequireAuth';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function EditProfileScreen() {
   const { user } = useAuth();
   const router = useRouter();
   const { requireAuth, isAuthenticated } = useRequireAuth();
   const updateProfileMutation = useUpdateProfile();
   const [name, setName] = useState('');
   const [email, setEmail] = useState('');
   const [mobile, setMobile] = useState('');
   const [role, setRole] = useState<'teacher' | 'student' | undefined>(undefined);
   const loading = updateProfileMutation.isPending;

   useEffect(() => {
      if (!isAuthenticated) {
         requireAuth();
         return;
      }
      // Pre-fill form with current user data
      if (user) {
         setName(user.name || '');
         setEmail(user.email || '');
         setMobile(user.mobile || '');
         setRole(user.role || undefined);
      }
   }, [user]);

   const handleUpdate = async () => {
      updateProfileMutation.mutate(
         {
            name: name || undefined,
            email: email || undefined,
            mobile: mobile || undefined,
            role,
         },
         {
            onSuccess: () => {
               Alert.alert('Success', 'Profile updated successfully', [
                  { text: 'OK', onPress: () => router.back() },
               ]);
            },
            onError: (error: any) => {
               Alert.alert(
                  'Update Failed',
                  error.message || 'An error occurred while updating profile'
               );
            },
         }
      );
   };

   const handleRoleSwitch = (newRole: 'teacher' | 'student') => {
      if (newRole === role) return;
      const roleLabel = newRole === 'teacher' ? 'Teacher' : 'Student';
      Alert.alert(
         `Switch to ${roleLabel}?`,
         'This will change your dashboard layout and available features.',
         [
            { text: 'Cancel', style: 'cancel' },
            {
               text: 'Switch',
               onPress: () => setRole(newRole),
            },
         ]
      );
   };

   return (
      <SafeAreaView style={styles.container}>
         <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
               <View style={styles.header}>
                  <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                     <Text style={styles.backButtonText}>← Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.title}>Edit Profile</Text>
               </View>

               <View style={styles.avatarContainer}>
                  <View style={styles.avatarLarge}>
                     <Text style={styles.avatarTextLarge}>
                        {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                     </Text>
                  </View>
                  <Text style={styles.mobileText}>{user?.email}</Text>
               </View>

               <View style={styles.form}>
                  <View style={styles.inputContainer}>
                     <Text style={styles.label}>Name</Text>
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
                     <Text style={styles.label}>Email</Text>
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
                     <Text style={styles.label}>Mobile Number (Optional)</Text>
                     <TextInput
                        style={styles.input}
                        placeholder="Enter your mobile number"
                        placeholderTextColor="#666"
                        value={mobile}
                        onChangeText={setMobile}
                        keyboardType="phone-pad"
                        editable={!loading}
                     />
                  </View>

                  <View style={styles.inputContainer}>
                     <Text style={styles.label}>Account Type</Text>
                     <View style={styles.roleContainer}>
                        <TouchableOpacity
                           style={[styles.roleOption, role === 'teacher' && styles.roleOptionSelected]}
                           onPress={() => handleRoleSwitch('teacher')}
                           disabled={loading}
                        >
                           <MaterialCommunityIcons
                              name="school-outline"
                              size={22}
                              color={role === 'teacher' ? '#007AFF' : '#888'}
                           />
                           <Text style={[styles.roleOptionText, role === 'teacher' && styles.roleOptionTextSelected]}>
                              Teacher
                           </Text>
                           {role === 'teacher' && (
                              <Ionicons name="checkmark-circle" size={18} color="#007AFF" />
                           )}
                        </TouchableOpacity>
                        <TouchableOpacity
                           style={[styles.roleOption, role === 'student' && styles.roleOptionSelected]}
                           onPress={() => handleRoleSwitch('student')}
                           disabled={loading}
                        >
                           <Ionicons
                              name="person-outline"
                              size={22}
                              color={role === 'student' ? '#007AFF' : '#888'}
                           />
                           <Text style={[styles.roleOptionText, role === 'student' && styles.roleOptionTextSelected]}>
                              Student
                           </Text>
                           {role === 'student' && (
                              <Ionicons name="checkmark-circle" size={18} color="#007AFF" />
                           )}
                        </TouchableOpacity>
                     </View>
                  </View>

                  <TouchableOpacity
                     style={[styles.button, loading && styles.buttonDisabled]}
                     onPress={handleUpdate}
                     disabled={loading}
                  >
                     {loading ? (
                        <ActivityIndicator color="#000" />
                     ) : (
                        <Text style={styles.buttonText}>Save Changes</Text>
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
   header: {
      marginBottom: 20,
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
   },
   avatarContainer: {
      alignItems: 'center',
      marginBottom: 30,
   },
   avatarLarge: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#333',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
   },
   avatarTextLarge: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#ffffff',
   },
   mobileText: {
      fontSize: 14,
      color: '#888',
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
   roleContainer: {
      flexDirection: 'row',
      gap: 12,
   },
   roleOption: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#1a1a1a',
      borderRadius: 8,
      padding: 14,
      borderWidth: 2,
      borderColor: '#333',
   },
   roleOptionSelected: {
      borderColor: '#007AFF',
      backgroundColor: '#0a1a2f',
   },
   roleOptionText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#888',
   },
   roleOptionTextSelected: {
      color: '#007AFF',
   },
});
