import React, { useEffect, useState } from 'react';
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   TouchableOpacity,
   ActivityIndicator,
   Alert,
   RefreshControl,
   Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { attendanceApi } from '../../../../services/attendance.api';
import type { Attendance, User, AttendanceRecord } from '../../../../types/api';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export default function AttendanceDetailsScreen() {
   const { id } = useLocalSearchParams<{ id: string }>();
   const [attendance, setAttendance] = useState<Attendance | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [refreshing, setRefreshing] = useState(false);
   const [isUpdating, setIsUpdating] = useState(false);
   const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
   const [showStatusModal, setShowStatusModal] = useState(false);

   useEffect(() => {
      if (id) {
         fetchAttendanceDetails();
      }
   }, [id]);

   const fetchAttendanceDetails = async () => {
      try {
         setIsLoading(true);
         const response = await attendanceApi.getAttendance(id);

         if (response.success && response.data) {
            setAttendance(response.data.attendance);
         } else {
            Alert.alert('Error', response.message || 'Failed to fetch attendance details');
         }
      } catch (error: any) {
         console.error('Fetch attendance error:', error);
         Alert.alert('Error', error?.response?.data?.message || 'Failed to fetch attendance details');
      } finally {
         setIsLoading(false);
      }
   };

   const onRefresh = async () => {
      setRefreshing(true);
      await fetchAttendanceDetails();
      setRefreshing(false);
   };

   const handleMarkStudent = async (studentId: string, status: AttendanceStatus) => {
      if (!attendance || attendance.status !== 'in-progress') {
         Alert.alert('Error', 'Cannot mark attendance. Attendance is not in progress.');
         return;
      }

      setIsUpdating(true);
      try {
         const response = await attendanceApi.markStudent(id, {
            studentId,
            status,
         });

         if (response.success && response.data) {
            setAttendance(response.data.attendance);
            setShowStatusModal(false);
            setSelectedStudent(null);
         } else {
            Alert.alert('Error', response.message || 'Failed to mark student');
         }
      } catch (error: any) {
         console.error('Mark student error:', error);
         Alert.alert('Error', error?.response?.data?.message || 'Failed to mark student');
      } finally {
         setIsUpdating(false);
      }
   };

   const handleCompleteAttendance = () => {
      Alert.alert(
         'Complete Attendance',
         'Are you sure you want to complete this attendance? You will not be able to make changes after completing.',
         [
            { text: 'Cancel', style: 'cancel' },
            {
               text: 'Complete',
               style: 'default',
               onPress: async () => {
                  try {
                     setIsUpdating(true);
                     const response = await attendanceApi.completeAttendance(id);

                     if (response.success) {
                        Alert.alert('Success', 'Attendance completed successfully', [
                           { text: 'OK', onPress: () => fetchAttendanceDetails() },
                        ]);
                     }
                  } catch (error: any) {
                     Alert.alert('Error', error?.response?.data?.message || 'Failed to complete attendance');
                  } finally {
                     setIsUpdating(false);
                  }
               },
            },
         ]
      );
   };

   const handleDeleteAttendance = () => {
      Alert.alert(
         'Delete Attendance',
         'Are you sure you want to delete this attendance? This action cannot be undone.',
         [
            { text: 'Cancel', style: 'cancel' },
            {
               text: 'Delete',
               style: 'destructive',
               onPress: async () => {
                  try {
                     const response = await attendanceApi.deleteAttendance(id);
                     if (response.success) {
                        Alert.alert('Success', 'Attendance deleted successfully', [
                           { text: 'OK', onPress: () => router.back() },
                        ]);
                     }
                  } catch (error: any) {
                     Alert.alert('Error', error?.response?.data?.message || 'Failed to delete attendance');
                  }
               },
            },
         ]
      );
   };

   const getStatusColor = (status: string) => {
      switch (status) {
         case 'present':
            return '#4CAF50';
         case 'absent':
            return '#F44336';
         case 'late':
            return '#FF9800';
         case 'excused':
            return '#2196F3';
         default:
            return '#888';
      }
   };

   const getStatusIcon = (status: string) => {
      switch (status) {
         case 'present':
            return 'checkmark-circle';
         case 'absent':
            return 'close-circle';
         case 'late':
            return 'time';
         case 'excused':
            return 'information-circle';
         default:
            return 'help-circle';
      }
   };

   const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
         weekday: 'long',
         month: 'long',
         day: 'numeric',
         year: 'numeric',
      });
   };

   const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
         hour: '2-digit',
         minute: '2-digit',
      });
   };

   const renderStatusModal = () => {
      if (!selectedStudent) return null;

      const studentRecord = attendance?.studentRecords.find(
         (r: AttendanceRecord) => {
            const student = typeof r.student === 'object' ? r.student : null;
            return student?._id === selectedStudent;
         }
      );

      const student = studentRecord && typeof studentRecord.student === 'object' ? studentRecord.student : null;

      const statuses: { value: AttendanceStatus; label: string; icon: string }[] = [
         { value: 'present', label: 'Present', icon: 'checkmark-circle' },
         { value: 'absent', label: 'Absent', icon: 'close-circle' },
         { value: 'late', label: 'Late', icon: 'time' },
         { value: 'excused', label: 'Excused', icon: 'information-circle' },
      ];

      return (
         <Modal
            visible={showStatusModal}
            transparent
            animationType="fade"
            onRequestClose={() => {
               setShowStatusModal(false);
               setSelectedStudent(null);
            }}
         >
            <View style={styles.modalOverlay}>
               <View style={styles.modalContainer}>
                  <View style={styles.modalHeader}>
                     <Text style={styles.modalTitle}>Mark Attendance</Text>
                     <TouchableOpacity
                        onPress={() => {
                           setShowStatusModal(false);
                           setSelectedStudent(null);
                        }}
                     >
                        <Ionicons name="close" size={24} color="#ffffff" />
                     </TouchableOpacity>
                  </View>

                  <Text style={styles.studentName}>{student?.name || 'Student'}</Text>
                  <Text style={styles.studentMobile}>{student?.mobile}</Text>

                  <View style={styles.statusOptions}>
                     {statuses.map((statusOption) => (
                        <TouchableOpacity
                           key={statusOption.value}
                           style={[
                              styles.statusOption,
                              studentRecord?.status === statusOption.value && styles.statusOptionActive,
                              {
                                 borderColor:
                                    studentRecord?.status === statusOption.value
                                       ? getStatusColor(statusOption.value)
                                       : '#2a2a2a',
                              },
                           ]}
                           onPress={() => handleMarkStudent(selectedStudent, statusOption.value)}
                           disabled={isUpdating}
                        >
                           <Ionicons
                              name={statusOption.icon as any}
                              size={32}
                              color={getStatusColor(statusOption.value)}
                           />
                           <Text
                              style={[
                                 styles.statusOptionText,
                                 { color: getStatusColor(statusOption.value) },
                              ]}
                           >
                              {statusOption.label}
                           </Text>
                        </TouchableOpacity>
                     ))}
                  </View>

                  {isUpdating && (
                     <View style={styles.updatingContainer}>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={styles.updatingText}>Updating...</Text>
                     </View>
                  )}
               </View>
            </View>
         </Modal>
      );
   };

   if (isLoading) {
      return (
         <SafeAreaView style={styles.container}>
            <View style={styles.loadingContainer}>
               <ActivityIndicator size="large" color="#ffffff" />
               <Text style={styles.loadingText}>Loading attendance...</Text>
            </View>
         </SafeAreaView>
      );
   }

   if (!attendance) {
      return (
         <SafeAreaView style={styles.container}>
            <View style={styles.errorContainer}>
               <Ionicons name="alert-circle-outline" size={64} color="#666" />
               <Text style={styles.errorText}>Attendance not found</Text>
               <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                  <Text style={styles.backButtonText}>Go Back</Text>
               </TouchableOpacity>
            </View>
         </SafeAreaView>
      );
   }

   const classInfo = typeof attendance.class === 'object' ? attendance.class : null;
   const takenByInfo = typeof attendance.takenBy === 'object' ? attendance.takenBy : null;
   const isInProgress = attendance.status === 'in-progress';

   return (
      <SafeAreaView style={styles.container}>
         <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
               <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Attendance Details</Text>
            {isInProgress && (
               <TouchableOpacity onPress={handleDeleteAttendance} style={styles.headerButton}>
                  <Ionicons name="trash-outline" size={24} color="#F44336" />
               </TouchableOpacity>
            )}
            {!isInProgress && <View style={styles.headerButton} />}
         </View>

         <ScrollView
            style={styles.scrollView}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
         >
            {/* Class Info Card */}
            <View style={styles.card}>
               <View style={styles.cardHeader}>
                  <Ionicons name="school" size={24} color="#ffffff" />
                  <View style={styles.cardHeaderText}>
                     <Text style={styles.className}>{classInfo?.className || 'Class'}</Text>
                     {classInfo?.subject && <Text style={styles.subject}>{classInfo.subject}</Text>}
                  </View>
               </View>
            </View>

            {/* Attendance Info */}
            <View style={styles.card}>
               <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                     <Ionicons
                        name={attendance.attendanceType === 'quick' ? 'flash' : 'calendar'}
                        size={20}
                        color="#888"
                     />
                     <Text style={styles.infoLabel}>Type</Text>
                  </View>
                  <Text style={styles.infoValue}>
                     {attendance.attendanceType === 'quick' ? 'Quick' : 'Scheduled'}
                  </Text>
               </View>

               <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                     <Ionicons name="calendar-outline" size={20} color="#888" />
                     <Text style={styles.infoLabel}>Date</Text>
                  </View>
                  <Text style={styles.infoValue}>{formatDate(attendance.attendanceDate)}</Text>
               </View>

               <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                     <Ionicons name="time-outline" size={20} color="#888" />
                     <Text style={styles.infoLabel}>Started At</Text>
                  </View>
                  <Text style={styles.infoValue}>{formatTime(attendance.startedAt)}</Text>
               </View>

               {attendance.finishedAt && (
                  <View style={styles.infoRow}>
                     <View style={styles.infoItem}>
                        <Ionicons name="checkmark-done" size={20} color="#888" />
                        <Text style={styles.infoLabel}>Finished At</Text>
                     </View>
                     <Text style={styles.infoValue}>{formatTime(attendance.finishedAt)}</Text>
                  </View>
               )}

               <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                     <Ionicons name="information-circle-outline" size={20} color="#888" />
                     <Text style={styles.infoLabel}>Status</Text>
                  </View>
                  <View
                     style={[
                        styles.statusBadge,
                        {
                           backgroundColor:
                              attendance.status === 'completed'
                                 ? '#4CAF50'
                                 : attendance.status === 'in-progress'
                                    ? '#2196F3'
                                    : '#F44336',
                        },
                     ]}
                  >
                     <Text style={styles.statusText}>{attendance.status}</Text>
                  </View>
               </View>
            </View>

            {/* Statistics */}
            <View style={styles.statsCard}>
               <Text style={styles.statsTitle}>Statistics</Text>
               <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                     <Ionicons name="people" size={24} color="#888" />
                     <Text style={styles.statValue}>{attendance.totalStudents}</Text>
                     <Text style={styles.statLabel}>Total</Text>
                  </View>
                  <View style={[styles.statBox, { borderColor: '#4CAF50' }]}>
                     <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                     <Text style={[styles.statValue, { color: '#4CAF50' }]}>{attendance.totalPresent}</Text>
                     <Text style={styles.statLabel}>Present</Text>
                  </View>
                  <View style={[styles.statBox, { borderColor: '#F44336' }]}>
                     <Ionicons name="close-circle" size={24} color="#F44336" />
                     <Text style={[styles.statValue, { color: '#F44336' }]}>{attendance.totalAbsent}</Text>
                     <Text style={styles.statLabel}>Absent</Text>
                  </View>
                  <View style={[styles.statBox, { borderColor: '#FF9800' }]}>
                     <Ionicons name="time" size={24} color="#FF9800" />
                     <Text style={[styles.statValue, { color: '#FF9800' }]}>{attendance.totalLate}</Text>
                     <Text style={styles.statLabel}>Late</Text>
                  </View>
               </View>
               {attendance.attendancePercentage !== undefined && (
                  <View style={styles.percentageContainer}>
                     <Text style={styles.percentageLabel}>Attendance Rate</Text>
                     <Text style={styles.percentageValue}>{attendance.attendancePercentage}%</Text>
                  </View>
               )}
            </View>

            {/* Students List */}
            <View style={styles.card}>
               <View style={styles.studentsHeader}>
                  <Text style={styles.studentsTitle}>Students ({attendance.studentRecords.length})</Text>
                  {isInProgress && (
                     <Text style={styles.studentsHint}>Tap to mark attendance</Text>
                  )}
               </View>

               {attendance.studentRecords.map((record: AttendanceRecord, index: number) => {
                  const student = typeof record.student === 'object' ? record.student : null;
                  if (!student) return null;

                  return (
                     <TouchableOpacity
                        key={student._id}
                        style={[
                           styles.studentItem,
                           index === attendance.studentRecords.length - 1 && styles.studentItemLast,
                        ]}
                        onPress={() => {
                           if (isInProgress) {
                              setSelectedStudent(student._id);
                              setShowStatusModal(true);
                           }
                        }}
                        disabled={!isInProgress}
                     >
                        <View style={styles.studentInfo}>
                           <View
                              style={[
                                 styles.studentAvatar,
                                 { backgroundColor: getStatusColor(record.status) + '20' },
                              ]}
                           >
                              <Text
                                 style={[
                                    styles.studentAvatarText,
                                    { color: getStatusColor(record.status) },
                                 ]}
                              >
                                 {student.name?.charAt(0).toUpperCase() || 'S'}
                              </Text>
                           </View>
                           <View style={styles.studentDetails}>
                              <Text style={styles.studentName}>{student.name || 'Student'}</Text>
                              <Text style={styles.studentMobile}>{student.mobile}</Text>
                           </View>
                        </View>
                        <View
                           style={[
                              styles.studentStatus,
                              { backgroundColor: getStatusColor(record.status) + '20' },
                           ]}
                        >
                           <Ionicons
                              name={getStatusIcon(record.status) as any}
                              size={20}
                              color={getStatusColor(record.status)}
                           />
                           <Text
                              style={[styles.studentStatusText, { color: getStatusColor(record.status) }]}
                           >
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                           </Text>
                        </View>
                     </TouchableOpacity>
                  );
               })}
            </View>

            {attendance.notes && (
               <View style={styles.card}>
                  <Text style={styles.notesTitle}>Notes</Text>
                  <Text style={styles.notesText}>{attendance.notes}</Text>
               </View>
            )}

            {isInProgress && (
               <TouchableOpacity
                  style={styles.completeButton}
                  onPress={handleCompleteAttendance}
                  disabled={isUpdating}
               >
                  {isUpdating ? (
                     <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                     <>
                        <Ionicons name="checkmark-done-circle" size={24} color="#ffffff" />
                        <Text style={styles.completeButtonText}>Complete Attendance</Text>
                     </>
                  )}
               </TouchableOpacity>
            )}

            <View style={{ height: 40 }} />
         </ScrollView>

         {renderStatusModal()}
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: '#000000',
   },
   header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#1a1a1a',
   },
   headerButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
   },
   headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#ffffff',
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
   card: {
      backgroundColor: '#1a1a1a',
      marginHorizontal: 20,
      marginTop: 20,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: '#2a2a2a',
   },
   cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
   },
   cardHeaderText: {
      flex: 1,
   },
   className: {
      fontSize: 20,
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: 4,
   },
   subject: {
      fontSize: 14,
      color: '#888',
   },
   infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#2a2a2a',
   },
   infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
   },
   infoLabel: {
      fontSize: 14,
      color: '#888',
   },
   infoValue: {
      fontSize: 14,
      fontWeight: '600',
      color: '#ffffff',
   },
   statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
   },
   statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#ffffff',
      textTransform: 'capitalize',
   },
   statsCard: {
      backgroundColor: '#1a1a1a',
      marginHorizontal: 20,
      marginTop: 20,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: '#2a2a2a',
   },
   statsTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: 16,
   },
   statsGrid: {
      flexDirection: 'row',
      gap: 12,
   },
   statBox: {
      flex: 1,
      backgroundColor: '#0a0a0a',
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#2a2a2a',
   },
   statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: '#ffffff',
      marginTop: 8,
   },
   statLabel: {
      fontSize: 12,
      color: '#888',
      marginTop: 4,
   },
   percentageContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: '#2a2a2a',
   },
   percentageLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
   },
   percentageValue: {
      fontSize: 24,
      fontWeight: '700',
      color: '#4CAF50',
   },
   studentsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
   },
   studentsTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#ffffff',
   },
   studentsHint: {
      fontSize: 12,
      color: '#888',
   },
   studentItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#2a2a2a',
   },
   studentItemLast: {
      borderBottomWidth: 0,
   },
   studentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
   },
   studentAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
   },
   studentAvatarText: {
      fontSize: 18,
      fontWeight: '700',
   },
   studentDetails: {
      flex: 1,
   },
   studentName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 2,
   },
   studentMobile: {
      fontSize: 13,
      color: '#888',
   },
   studentStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
   },
   studentStatusText: {
      fontSize: 13,
      fontWeight: '600',
   },
   notesTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 12,
   },
   notesText: {
      fontSize: 14,
      color: '#888',
      lineHeight: 20,
   },
   completeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#4CAF50',
      marginHorizontal: 20,
      marginTop: 20,
      padding: 16,
      borderRadius: 12,
      gap: 8,
   },
   completeButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#ffffff',
   },
   modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
   },
   modalContainer: {
      backgroundColor: '#1a1a1a',
      borderRadius: 16,
      padding: 20,
      width: '100%',
      maxWidth: 400,
      borderWidth: 1,
      borderColor: '#2a2a2a',
   },
   modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
   },
   modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#ffffff',
   },
   statusOptions: {
      marginTop: 20,
      gap: 12,
   },
   statusOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      borderRadius: 12,
      backgroundColor: '#0a0a0a',
      borderWidth: 2,
      borderColor: '#2a2a2a',
   },
   statusOptionActive: {
      backgroundColor: '#2a2a2a',
   },
   statusOptionText: {
      fontSize: 16,
      fontWeight: '600',
   },
   updatingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
      gap: 8,
   },
   updatingText: {
      fontSize: 14,
      color: '#888',
   },
});
