import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, RefreshControl, BackHandler, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { classApi } from '../../../../services/class.api';
import { useAttendance } from '../../../../hooks/useAttendance';
import type { Class, User } from '../../../../types/api';
import {
   ClassDetailsHeader,
   ClassInfoCard,
   ClassActionButtons,
   ClassCreatorCard,
   ClassStudentsSection,
} from '../../../../components/features/class';
import {
   AttendanceTypeModal,
   QuickAttendanceForm,
   ScheduledAttendanceForm,
} from '../../../../components/features/attendance';

export default function ClassDetailsScreen() {
   const { id } = useLocalSearchParams<{ id: string }>();
   const [classData, setClassData] = useState<Class | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [refreshing, setRefreshing] = useState(false);
   const [currentPage, setCurrentPage] = useState(1);
   const [pagination, setPagination] = useState<any>(null);
   const studentsPerPage = 10;

   // Attendance modal states
   const [showAttendanceTypeModal, setShowAttendanceTypeModal] = useState(false);
   const [showQuickForm, setShowQuickForm] = useState(false);
   const [showScheduledForm, setShowScheduledForm] = useState(false);
   const { createAttendance, isCreating } = useAttendance(id);

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

   const fetchClassDetails = async (page = currentPage) => {
      try {
         setIsLoading(true);
         const response = await classApi.getClass(id, page, studentsPerPage);

         if (response.success && response.data) {
            setClassData(response.data.class);
            if (response.data.pagination) {
               setPagination(response.data.pagination);
            }
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
      setCurrentPage(1);
      await fetchClassDetails(1);
      setRefreshing(false);
   };

   const handleNextPage = async () => {
      if (pagination?.hasNextPage) {
         const nextPage = currentPage + 1;
         setCurrentPage(nextPage);
         await fetchClassDetails(nextPage);
      }
   };

   const handlePrevPage = async () => {
      if (pagination?.hasPrevPage) {
         const prevPage = currentPage - 1;
         setCurrentPage(prevPage);
         await fetchClassDetails(prevPage);
      }
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
            <ClassDetailsHeader
               title="Class Details"
               onBack={handleGoBack}
               onDelete={handleDeleteClass}
            />

            <ClassInfoCard
               className={classData.className}
               subject={classData.subject}
               studentCount={classData.studentCount || 0}
               createdAt={classData.createdAt}
            />

            <ClassActionButtons
               onEdit={() => router.push(`/(app)/(home)/class/${id}/edit`)}
               onTakeAttendance={() => setShowAttendanceTypeModal(true)}
            />

            {creatorInfo && <ClassCreatorCard creator={creatorInfo as User} />}

            <ClassStudentsSection
               students={students as User[]}
               totalCount={students.length}
               pagination={pagination}
               onAddStudent={() => router.push(`/(app)/(home)/class/${id}/add-student`)}
               onRemoveStudent={handleRemoveStudent}
               onNextPage={handleNextPage}
               onPrevPage={handlePrevPage}
            />
         </ScrollView>

         {/* Attendance Type Selection Modal */}
         <AttendanceTypeModal
            visible={showAttendanceTypeModal}
            onClose={() => setShowAttendanceTypeModal(false)}
            onSelectQuick={() => {
               setShowAttendanceTypeModal(false);
               setShowQuickForm(true);
            }}
            onSelectScheduled={() => {
               setShowAttendanceTypeModal(false);
               setShowScheduledForm(true);
            }}
         />

         {/* Quick Attendance Form Modal */}
         <Modal
            visible={showQuickForm}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowQuickForm(false)}
         >
            <QuickAttendanceForm
               classId={id}
               className={classData?.className || ''}
               onSubmit={async (data) => {
                  await createAttendance(data);
                  setShowQuickForm(false);
               }}
               onCancel={() => setShowQuickForm(false)}
            />
         </Modal>

         {/* Scheduled Attendance Form Modal */}
         <Modal
            visible={showScheduledForm}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowScheduledForm(false)}
         >
            <ScheduledAttendanceForm
               classId={id}
               className={classData?.className || ''}
               onSubmit={async (data) => {
                  await createAttendance(data);
                  setShowScheduledForm(false);
               }}
               onCancel={() => setShowScheduledForm(false)}
            />
         </Modal>
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
});
