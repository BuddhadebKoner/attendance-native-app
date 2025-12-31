import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { classApi } from '../../../services/class.api';
import { useAuth } from '../../../contexts/AuthContext';

export default function UpdateClassScreen() {
   const { id } = useLocalSearchParams<{ id: string }>();
   const { refreshUser } = useAuth();
   const [className, setClassName] = useState('');
   const [subject, setSubject] = useState('');
   const [isLoading, setIsLoading] = useState(true);
   const [isSaving, setIsSaving] = useState(false);

   useEffect(() => {
      if (id) {
         fetchClassDetails();
      }
   }, [id]);

   const fetchClassDetails = async () => {
      try {
         setIsLoading(true);
         const response = await classApi.getClass(id);

         if (response.success && response.data) {
            setClassName(response.data.class.className);
            setSubject(response.data.class.subject);
         } else {
            Alert.alert('Error', response.message || 'Failed to fetch class details');
         }
      } catch (error: any) {
         console.error('Fetch class error:', error);
         const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch class details';
         Alert.alert('Error', errorMessage);
      } finally {
         setIsLoading(false);
      }
   };

   const handleUpdateClass = async () => {
      // Validation
      if (!className.trim()) {
         Alert.alert('Error', 'Please enter a class name');
         return;
      }

      if (!subject.trim()) {
         Alert.alert('Error', 'Please enter a subject name');
         return;
      }

      setIsSaving(true);

      try {
         const response = await classApi.updateClass(id, {
            className: className.trim(),
            subject: subject.trim(),
         });

         if (response.success) {
            Alert.alert('Success', 'Class updated successfully!', [
               {
                  text: 'OK',
                  onPress: async () => {
                     // Refresh user data to update classes list
                     await refreshUser();
                     router.back();
                  },
               },
            ]);
         } else {
            Alert.alert('Error', response.message || 'Failed to update class');
         }
      } catch (error: any) {
         console.error('Update class error:', error);
         const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update class';
         Alert.alert('Error', errorMessage);
      } finally {
         setIsSaving(false);
      }
   };

   if (isLoading) {
      return (
         <SafeAreaView style={styles.container}>
            <View style={styles.loadingContainer}>
               <ActivityIndicator size="large" color="#ffffff" />
               <Text style={styles.loadingText}>Loading class details...</Text>
            </View>
         </SafeAreaView>
      );
   }

   return (
      <SafeAreaView style={styles.container}>
         <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.header}>
               <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="#ffffff" />
               </TouchableOpacity>
               <Text style={styles.headerTitle}>Update Class</Text>
               <View style={styles.placeholder} />
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
               <View style={styles.iconContainer}>
                  <Ionicons name="create" size={60} color="#ffffff" />
               </View>

               <Text style={styles.description}>
                  Update the class name or subject information
               </Text>

               <View style={styles.inputContainer}>
                  <Text style={styles.label}>Class Name</Text>
                  <View style={styles.inputWrapper}>
                     <Ionicons name="bookmark-outline" size={20} color="#888" style={styles.inputIcon} />
                     <TextInput
                        style={styles.input}
                        placeholder="e.g., Computer Science 101"
                        placeholderTextColor="#666"
                        value={className}
                        onChangeText={setClassName}
                        editable={!isSaving}
                        autoCapitalize="words"
                     />
                  </View>
               </View>

               <View style={styles.inputContainer}>
                  <Text style={styles.label}>Subject</Text>
                  <View style={styles.inputWrapper}>
                     <Ionicons name="book-outline" size={20} color="#888" style={styles.inputIcon} />
                     <TextInput
                        style={styles.input}
                        placeholder="e.g., Programming Fundamentals"
                        placeholderTextColor="#666"
                        value={subject}
                        onChangeText={setSubject}
                        editable={!isSaving}
                        autoCapitalize="words"
                     />
                  </View>
               </View>

               <TouchableOpacity
                  style={[styles.updateButton, isSaving && styles.updateButtonDisabled]}
                  onPress={handleUpdateClass}
                  disabled={isSaving}
               >
                  {isSaving ? (
                     <ActivityIndicator color="#000000" />
                  ) : (
                     <>
                        <Ionicons name="checkmark-circle-outline" size={24} color="#000000" />
                        <Text style={styles.updateButtonText}>Update Class</Text>
                     </>
                  )}
               </TouchableOpacity>

               <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => router.back()}
                  disabled={isSaving}
               >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
               </TouchableOpacity>
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
   loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
   },
   loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: '#888',
   },
   header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: 10,
   },
   backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
   },
   headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#ffffff',
   },
   placeholder: {
      width: 40,
   },
   formContainer: {
      padding: 20,
   },
   iconContainer: {
      alignItems: 'center',
      marginBottom: 20,
      marginTop: 20,
   },
   description: {
      fontSize: 14,
      color: '#888',
      textAlign: 'center',
      marginBottom: 40,
      lineHeight: 20,
   },
   inputContainer: {
      marginBottom: 24,
   },
   label: {
      fontSize: 14,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 8,
   },
   inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#333',
      paddingHorizontal: 16,
   },
   inputIcon: {
      marginRight: 12,
   },
   input: {
      flex: 1,
      height: 50,
      fontSize: 16,
      color: '#ffffff',
   },
   updateButton: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      gap: 8,
   },
   updateButtonDisabled: {
      opacity: 0.6,
   },
   updateButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#000000',
   },
   cancelButton: {
      backgroundColor: 'transparent',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
      borderWidth: 1,
      borderColor: '#333',
   },
   cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#888',
   },
});
