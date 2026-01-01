import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { classApi } from '../../../../services/class.api';
import type { Class } from '../../../../types/api';

export default function ClassDetailsScreen() {
   const { id } = useLocalSearchParams<{ id: string }>();
   const [classData, setClassData] = useState<Class | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [refreshing, setRefreshing] = useState(false);

   useEffect(() => {
      if (id) {
         fetchClassDetails();
      }
   }, [id]);

   // Handle Android back button
   useEffect(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
         handleGoBack();
         return true; // Prevent default behavior
      });

      return () => backHandler.remove();
   }, []);

   const handleGoBack = () => {
      if (router.canGoBack()) {
         router.back();
      } else {
         router.replace('/(app)/(home)');
      }
   };

   const fetchClassDetails = async () => {
      try {
         setIsLoading(true);
         const response = await classApi.getClass(id);

         if (response.success && response.data) {
            setClassData(response.data.class);
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

   const onRefresh = async () => {
      setRefreshing(true);
      await fetchClassDetails();
      setRefreshing(false);
   };

   const handleDeleteClass = () => {
      Alert.alert(
         'Delete Class',
         'Are you sure you want to delete this class? This action cannot be undone.',
         [
            { text: 'Cancel', style: 'cancel' },
            {
               text: 'Delete',
               style: 'destructive',
               onPress: async () => {
                  try {
                     const response = await classApi.deleteClass(id);
                     if (response.success) {
                        Alert.alert('Success', 'Class deleted successfully', [
                           { text: 'OK', onPress: () => router.back() },
                        ]);
                     }
                  } catch (error: any) {
                     Alert.alert('Error', error?.response?.data?.message || 'Failed to delete class');
                  }
               },
            },
         ]
      );
   };

   const handleRemoveStudent = (studentId: string, studentName: string) => {
      Alert.alert(
         'Remove Student',
         `Are you sure you want to remove ${studentName} from this class?`,
         [
            { text: 'Cancel', style: 'cancel' },
            {
               text: 'Remove',
               style: 'destructive',
               onPress: async () => {
                  try {
                     const response = await classApi.removeStudent(id, studentId);
                     if (response.success) {
                        // Refresh class data to show updated student list
                        await fetchClassDetails();
                        Alert.alert('Success', 'Student removed successfully');
                     }
                  } catch (error: any) {
                     const errorMessage = error?.response?.data?.message || error?.message || 'Failed to remove student';
                     Alert.alert('Error', errorMessage);
                  }
               },
            },
         ]
      );
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

   if (!classData) {
      return (
         <SafeAreaView style={styles.container}>
            <View style={styles.errorContainer}>
               <Ionicons name="alert-circle-outline" size={64} color="#666" />
               <Text style={styles.errorText}>Class not found</Text>
               <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                  <Text style={styles.backButtonText}>Go Back</Text>
               </TouchableOpacity>
            </View>
         </SafeAreaView>
      );
   }

   const creatorInfo = typeof classData.createdBy === 'object' ? classData.createdBy : null;
   const students = Array.isArray(classData.students) ? classData.students : [];

   return (
      <SafeAreaView style={styles.container}>
         <ScrollView
            style={styles.scrollView}
            refreshControl={
               <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
            }
         >
            {/* Header */}
            <View style={styles.header}>
               <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}>
                  <Ionicons name="arrow-back" size={24} color="#ffffff" />
               </TouchableOpacity>
               <Text style={styles.headerTitle}>Class Details</Text>
               <TouchableOpacity onPress={handleDeleteClass} style={styles.headerButton}>
                  <Ionicons name="trash-outline" size={24} color="#ff4444" />
               </TouchableOpacity>
            </View>

            {/* Class Info Card */}
            <View style={styles.classInfoCard}>
               <View style={styles.iconWrapper}>
                  <Ionicons name="school" size={48} color="#ffffff" />
               </View>
               <Text style={styles.className}>{classData.className}</Text>
               <Text style={styles.subject}>{classData.subject}</Text>

               <View style={styles.metaInfo}>
                  <View style={styles.metaItem}>
                     <Ionicons name="people" size={20} color="#888" />
                     <Text style={styles.metaText}>{classData.studentCount || 0} Students</Text>
                  </View>
                  <View style={styles.metaItem}>
                     <Ionicons name="calendar" size={20} color="#888" />
                     <Text style={styles.metaText}>
                        {new Date(classData.createdAt).toLocaleDateString('en-US', {
                           month: 'short',
                           day: 'numeric',
                           year: 'numeric',
                        })}
                     </Text>
                  </View>
               </View>
            </View>

            {/* Creator Info */}
            {creatorInfo && (
               <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Created By</Text>
                  <View style={styles.creatorCard}>
                     <View style={styles.creatorAvatar}>
                        <Text style={styles.creatorAvatarText}>
                           {creatorInfo.name?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                     </View>
                     <View style={styles.creatorInfo}>
                        <Text style={styles.creatorName}>{creatorInfo.name || 'Unknown'}</Text>
                        <Text style={styles.creatorContact}>{creatorInfo.mobile}</Text>
                        {creatorInfo.email && (
                           <Text style={styles.creatorContact}>{creatorInfo.email}</Text>
                        )}
                     </View>
                  </View>
               </View>
            )}

            {/* Students Section */}
            <View style={styles.section}>
               <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Students ({students.length})</Text>
                  <TouchableOpacity
                     style={styles.addButton}
                     onPress={() => router.push(`/(app)/(home)/class/${id}/add-student`)}
                  >
                     <Ionicons name="person-add" size={20} color="#ffffff" />
                     <Text style={styles.addButtonText}>Add Student</Text>
                  </TouchableOpacity>
               </View>

               {students.length > 0 ? (
                  <View style={styles.studentsContainer}>
                     {students.map((student: any, index: number) => (
                        <View key={student._id || index} style={styles.studentCard}>
                           <View style={styles.studentAvatar}>
                              <Text style={styles.studentAvatarText}>
                                 {student.name?.charAt(0).toUpperCase() || student.mobile?.charAt(0) || 'S'}
                              </Text>
                           </View>
                           <View style={styles.studentInfo}>
                              <Text style={styles.studentName}>{student.name || 'Unknown'}</Text>
                              <Text style={styles.studentMobile}>{student.mobile}</Text>
                           </View>
                           <TouchableOpacity
                              style={styles.removeButton}
                              onPress={() => handleRemoveStudent(student._id, student.name || student.mobile)}
                           >
                              <Ionicons name="close-circle" size={24} color="#ff4444" />
                           </TouchableOpacity>
                        </View>
                     ))}
                  </View>
               ) : (
                  <View style={styles.emptyState}>
                     <MaterialCommunityIcons name="account-group-outline" size={48} color="#333" />
                     <Text style={styles.emptyStateText}>No students enrolled yet</Text>
                     <Text style={styles.emptyStateSubtext}>Add students to get started</Text>
                  </View>
               )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
               <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push(`/(app)/(home)/class/${id}/edit`)}
               >
                  <Ionicons name="create-outline" size={24} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Edit Class</Text>
               </TouchableOpacity>

               <TouchableOpacity style={styles.actionButton}>
                  <MaterialCommunityIcons name="clipboard-check-outline" size={24} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Take Attendance</Text>
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
   errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
   },
   errorText: {
      fontSize: 18,
      color: '#888',
      marginTop: 16,
      marginBottom: 24,
   },
   backButton: {
      backgroundColor: '#ffffff',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
   },
   backButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#000000',
   },
   header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: 10,
   },
   headerButton: {
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
   classInfoCard: {
      backgroundColor: '#1a1a1a',
      margin: 20,
      marginTop: 10,
      padding: 24,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#333',
      alignItems: 'center',
   },
   iconWrapper: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#333',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
   },
   className: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#ffffff',
      textAlign: 'center',
      marginBottom: 8,
   },
   subject: {
      fontSize: 16,
      color: '#888',
      marginBottom: 20,
   },
   metaInfo: {
      flexDirection: 'row',
      gap: 24,
   },
   metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
   },
   metaText: {
      fontSize: 14,
      color: '#888',
   },
   section: {
      padding: 20,
      paddingTop: 10,
   },
   sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
   },
   sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#ffffff',
   },
   addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#333',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 6,
   },
   addButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#ffffff',
   },
   creatorCard: {
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: '#333',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
   },
   creatorAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#333',
      justifyContent: 'center',
      alignItems: 'center',
   },
   creatorAvatarText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#ffffff',
   },
   creatorInfo: {
      flex: 1,
   },
   creatorName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 4,
   },
   creatorContact: {
      fontSize: 14,
      color: '#888',
      marginBottom: 2,
   },
   studentsContainer: {
      gap: 12,
   },
   studentCard: {
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: '#333',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
   },
   studentAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#333',
      justifyContent: 'center',
      alignItems: 'center',
   },
   studentAvatarText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#ffffff',
   },
   studentInfo: {
      flex: 1,
   },
   studentName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 2,
   },
   studentMobile: {
      fontSize: 14,
      color: '#888',
   },
   removeButton: {
      padding: 4,
   },
   emptyState: {
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      padding: 40,
      borderWidth: 1,
      borderColor: '#333',
      alignItems: 'center',
   },
   emptyStateText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#888',
      marginTop: 12,
   },
   emptyStateSubtext: {
      fontSize: 14,
      color: '#666',
      marginTop: 4,
   },
   actionButtonsContainer: {
      padding: 20,
      paddingTop: 10,
      gap: 12,
      paddingBottom: 40,
   },
   actionButton: {
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: '#333',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
   },
   actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
   },
});
