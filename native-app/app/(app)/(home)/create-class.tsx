import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { classApi } from '../../../services/class.api';
import { useAuth } from '../../../contexts/AuthContext';

export default function CreateClassScreen() {
   const { refreshUser } = useAuth();
   const [className, setClassName] = useState('');
   const [subject, setSubject] = useState('');
   const [isLoading, setIsLoading] = useState(false);

   const handleCreateClass = async () => {
      // Validation
      if (!className.trim()) {
         Alert.alert('Error', 'Please enter a class name');
         return;
      }

      if (!subject.trim()) {
         Alert.alert('Error', 'Please enter a subject name');
         return;
      }

      setIsLoading(true);

      try {
         const response = await classApi.createClass({
            className: className.trim(),
            subject: subject.trim(),
         });

         if (response.success) {
            Alert.alert('Success', 'Class created successfully!', [
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
            Alert.alert('Error', response.message || 'Failed to create class');
         }
      } catch (error: any) {
         console.error('Create class error:', error);
         const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create class';
         Alert.alert('Error', errorMessage);
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <SafeAreaView style={styles.container}>
         <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.header}>
               <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="#ffffff" />
               </TouchableOpacity>
               <Text style={styles.headerTitle}>Create New Class</Text>
               <View style={styles.placeholder} />
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
               <View style={styles.iconContainer}>
                  <Ionicons name="school" size={60} color="#ffffff" />
               </View>

               <Text style={styles.description}>
                  Create a new class to manage students and track attendance
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
                        editable={!isLoading}
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
                        editable={!isLoading}
                        autoCapitalize="words"
                     />
                  </View>
               </View>

               <TouchableOpacity
                  style={[styles.createButton, isLoading && styles.createButtonDisabled]}
                  onPress={handleCreateClass}
                  disabled={isLoading}
               >
                  {isLoading ? (
                     <ActivityIndicator color="#000000" />
                  ) : (
                     <>
                        <Ionicons name="add-circle-outline" size={24} color="#000000" />
                        <Text style={styles.createButtonText}>Create Class</Text>
                     </>
                  )}
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
   createButton: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      gap: 8,
   },
   createButtonDisabled: {
      opacity: 0.6,
   },
   createButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#000000',
   },
});
