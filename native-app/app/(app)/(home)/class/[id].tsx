import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, RefreshControl, BackHandler, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useClass, useDeleteClass, useRemoveStudent, useBulkRemoveStudents } from '../../../../hooks/queries';
import { useAttendance } from '../../../../hooks/useAttendance';
import type { Class, User } from '../../../../types/api';
import {
   ClassDetailsHeader,
   ClassInfoCard,
   ClassActionButtons,
   ClassCreatorCard,
   ClassStudentsSection,
   ActiveAttendanceSection,
   ClassQRCodeModal,
} from '../../../../components/features/class';
import {
   AttendanceTypeModal,
   QuickAttendanceForm,
   ScheduledAttendanceForm,
} from '../../../../components/features/attendance';
import { useRequireAuth } from '../../../../hooks/useRequireAuth';

export default function ClassDetailsScreen() {
   const { id } = useLocalSearchParams<{ id: string }>();
   const { requireAuth, isAuthenticated } = useRequireAuth();
   const [currentPage, setCurrentPage] = useState(1);
   const [attendancePage, setAttendancePage] = useState(1);
   const [refreshing, setRefreshing] = useState(false);
   const studentsPerPage = 10;
   const attendancesPerPage = 10;

   const { data: classResponse, isLoading, refetch } = useClass(id, currentPage, studentsPerPage, true, attendancePage, attendancesPerPage);
   const activeAttendances = classResponse?.activeAttendances ?? [];
   const attendancePagination = classResponse?.attendancePagination ?? null;
   const classData = classResponse?.class ?? null;
   const pagination = classResponse?.pagination ?? null;
   const isCreator = classResponse?.isCreator ?? false;
   const acceptedCount = classData?.acceptedCount ?? 0;
   const pendingCount = classData?.pendingCount ?? 0;
   const requestedCount = classData?.requestedCount ?? 0;
   const deleteClassMutation = useDeleteClass();
   const removeStudentMutation = useRemoveStudent();
   const bulkRemoveMutation = useBulkRemoveStudents();

   // Get creator object for display
   const creatorObj = classData && typeof classData.createdBy === 'object' ? classData.createdBy as User : null;

   // Selection mode for bulk actions
   const [selectionMode, setSelectionMode] = useState(false);
   const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

   // Attendance modal states
   const [showAttendanceTypeModal, setShowAttendanceTypeModal] = useState(false);
   const [showQuickForm, setShowQuickForm] = useState(false);
   const [showScheduledForm, setShowScheduledForm] = useState(false);
   const [showQRModal, setShowQRModal] = useState(false);
   const { createAttendance, isCreating } = useAttendance(id);

   useEffect(() => {
      if (!isAuthenticated) {
         requireAuth();
         return;
      }
   }, [isAuthenticated]);

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

   const onRefresh = useCallback(async () => {
      setRefreshing(true);
      setCurrentPage(1);
      try {
         await refetch();
      } finally {
         setRefreshing(false);
      }
   }, [refetch]);

   const handleNextPage = () => {
      if (pagination?.hasNextPage) {
         setCurrentPage((prev) => prev + 1);
      }
   };

   const handlePrevPage = () => {
      if (pagination?.hasPrevPage) {
         setCurrentPage((prev) => prev - 1);
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
               onPress: () => {
                  deleteClassMutation.mutate(id, {
                     onSuccess: () => {
                        Alert.alert('Success', 'Class deleted successfully', [
                           { text: 'OK', onPress: () => router.back() },
                        ]);
                     },
                     onError: (error: any) => {
                        Alert.alert('Error', error?.response?.data?.message || 'Failed to delete class');
                     },
                  });
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
               onPress: () => {
                  removeStudentMutation.mutate(
                     { classId: id, studentId },
                     {
                        onSuccess: () => {
                           Alert.alert('Success', 'Student removed successfully');
                        },
                        onError: (error: any) => {
                           const errorMessage = error?.response?.data?.message || error?.message || 'Failed to remove student';
                           Alert.alert('Error', errorMessage);
                        },
                     }
                  );
               },
            },
         ]
      );
   };
   const handleToggleSelectionMode = () => {
      setSelectionMode((prev) => {
         if (prev) setSelectedStudents(new Set());
         return !prev;
      });
   };

   const handleToggleSelect = (studentId: string) => {
      setSelectedStudents((prev) => {
         const next = new Set(prev);
         if (next.has(studentId)) {
            next.delete(studentId);
         } else {
            next.add(studentId);
         }
         return next;
      });
   };

   const handleSelectAll = () => {
      const students = Array.isArray(classData?.students) ? classData.students : [];
      const allIds = students.map((s: any) => (typeof s === 'object' ? s._id : s));
      const allSelected = allIds.every((id: string) => selectedStudents.has(id));
      if (allSelected) {
         setSelectedStudents(new Set());
      } else {
         setSelectedStudents(new Set(allIds));
      }
   };

   const handleBulkRemove = (studentIds: string[]) => {
      const count = studentIds.length;
      Alert.alert(
         'Remove Students',
         `Are you sure you want to remove ${count} student${count > 1 ? 's' : ''} from this class?`,
         [
            { text: 'Cancel', style: 'cancel' },
            {
               text: 'Remove',
               style: 'destructive',
               onPress: () => {
                  bulkRemoveMutation.mutate(
                     { classId: id, studentIds },
                     {
                        onSuccess: (data: any) => {
                           Alert.alert('Success', `${data.removedCount} student${data.removedCount > 1 ? 's' : ''} removed`);
                           setSelectedStudents(new Set());
                           setSelectionMode(false);
                        },
                        onError: (error: any) => {
                           Alert.alert('Error', error?.response?.data?.message || error?.message || 'Failed to remove students');
                        },
                     }
                  );
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
               isCreator={isCreator}
               isDeleting={deleteClassMutation.isPending}
            />

            <ClassInfoCard
               className={classData.className}
               subject={classData.subject}
               studentCount={classData.studentCount || 0}
               acceptedCount={acceptedCount}
               pendingCount={pendingCount}
               requestedCount={requestedCount}
               createdAt={classData.createdAt}
               showStudentInfo={isCreator}
            />

            {isCreator ? (
               <ClassActionButtons
                  isCreator={isCreator}
                  onEdit={() => router.push(`/(app)/(home)/class/${id}/edit`)}
                  onShowQR={() => setShowQRModal(true)}
                  onTakeAttendance={() => {
                     if (pendingCount > 0) {
                        Alert.alert(
                           'Pending Enrollments',
                           `${pendingCount} student(s) have pending enrollment. All students must accept their invitation before attendance can be taken.`
                        );
                        return;
                     }
                     if (acceptedCount === 0) {
                        Alert.alert(
                           'No Students',
                           'No accepted students in this class. Add and wait for students to accept their invitation before taking attendance.'
                        );
                        return;
                     }
                     setShowAttendanceTypeModal(true);
                  }}
               />
            ) : (
               <ClassActionButtons
                  isCreator={false}
                  onEdit={() => { }}
                  onTakeAttendance={() => { }}
                  onViewAttendanceStats={() =>
                     router.push({
                        pathname: '/(app)/(profile)/class-attendance',
                        params: { classId: id },
                     } as any)
                  }
               />
            )}

            {creatorObj && <ClassCreatorCard creator={creatorObj} />}

            {!isCreator && (
               <ActiveAttendanceSection
                  attendances={activeAttendances}
                  pagination={attendancePagination ?? undefined}
                  onNextPage={() => {
                     if (attendancePagination?.hasNextPage) {
                        setAttendancePage((prev) => prev + 1);
                     }
                  }}
                  onPrevPage={() => {
                     if (attendancePagination?.hasPrevPage) {
                        setAttendancePage((prev) => prev - 1);
                     }
                  }}
               />
            )}

            {isCreator && (
               <ClassStudentsSection
                  students={students as User[]}
                  totalCount={classData.studentCount || 0}
                  acceptedCount={acceptedCount}
                  pendingCount={pendingCount}
                  requestedCount={requestedCount}
                  pagination={pagination}
                  isCreator={isCreator}
                  onAddStudent={() => router.push(`/(app)/(home)/class/${id}/add-student`)}
                  onRemoveStudent={handleRemoveStudent}
                  onBulkRemove={handleBulkRemove}
                  onNextPage={handleNextPage}
                  onPrevPage={handlePrevPage}
                  selectionMode={selectionMode}
                  selectedStudents={selectedStudents}
                  onToggleSelectionMode={handleToggleSelectionMode}
                  onToggleSelect={handleToggleSelect}
                  onSelectAll={handleSelectAll}
                  isBulkRemoving={bulkRemoveMutation.isPending}
               />
            )}
         </ScrollView>

         {/* Attendance modals — only for creator */}
         {isCreator && (
            <>
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
            </>
         )}

         {/* Class QR Code modal — only for creator */}
         {isCreator && classData && (
            <ClassQRCodeModal
               visible={showQRModal}
               onClose={() => setShowQRModal(false)}
               classId={id}
               className={classData.className}
               subject={classData.subject}
            />
         )}
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
