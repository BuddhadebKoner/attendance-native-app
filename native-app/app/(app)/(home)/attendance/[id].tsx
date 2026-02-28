import React, { useEffect, useState, useCallback } from 'react';
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
   Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
   useAttendanceDetail,
   useMarkStudent,
   useCompleteAttendance,
   useDeleteAttendance,
} from '../../../../hooks/queries';
import type { Attendance, User, AttendanceRecord } from '../../../../types/api';
import { useRequireAuth } from '../../../../hooks/useRequireAuth';
import { QRScannerModal, ScanResultModal } from '../../../../components/features/attendance';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export default function AttendanceDetailsScreen() {
   const { id } = useLocalSearchParams<{ id: string }>();
   const { requireAuth, isAuthenticated } = useRequireAuth();

   const { data: attendance, isLoading, refetch } = useAttendanceDetail(id);
   const markStudentMutation = useMarkStudent();
   const completeAttendanceMutation = useCompleteAttendance();
   const deleteAttendanceMutation = useDeleteAttendance();
   const isUpdating = markStudentMutation.isPending || completeAttendanceMutation.isPending;

   const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
   const [showStatusModal, setShowStatusModal] = useState(false);

   // QR Scanner state
   const [showScanner, setShowScanner] = useState(false);
   const [scanPaused, setScanPaused] = useState(false);
   const [scannedStudent, setScannedStudent] = useState<User | null>(null);
   const [scannedStudentStatus, setScannedStudentStatus] = useState<string>('not-marked');
   const [showScanResult, setShowScanResult] = useState(false);
   const [scanSelectedStatus, setScanSelectedStatus] = useState<string>('present');
   const [scanIsUpdating, setScanIsUpdating] = useState(false);
   const [recentScans, setRecentScans] = useState<
      { student: User; status: string; time: string }[]
   >([]);

   useEffect(() => {
      if (!isAuthenticated) {
         requireAuth();
         return;
      }
   }, [isAuthenticated]);

   const handleMarkStudent = async (studentId: string, status: AttendanceStatus) => {
      if (!attendance || attendance.status !== 'in-progress') {
         Alert.alert('Error', 'Cannot mark attendance. Attendance is not in progress.');
         return;
      }

      markStudentMutation.mutate(
         { attendanceId: id, data: { studentId, status } },
         {
            onSuccess: () => {
               setShowStatusModal(false);
               setSelectedStudent(null);
            },
            onError: (error: any) => {
               console.error('Mark student error:', error);
               Alert.alert('Error', error?.response?.data?.message || 'Failed to mark student');
            },
         }
      );
   };

   // QR Scanner handlers
   const handleStudentScanned = useCallback(
      (studentId: string) => {
         if (!attendance) return;

         const record = attendance.studentRecords.find((r: AttendanceRecord) => {
            const student = typeof r.student === 'object' ? r.student : null;
            return student?._id === studentId;
         });

         if (!record || typeof record.student !== 'object') return;

         const student = record.student as User;
         setScannedStudent(student);
         setScannedStudentStatus(record.status);
         setScanSelectedStatus('present'); // Default to present
         setScanPaused(true);
         setShowScanResult(true);
      },
      [attendance]
   );

   const handleScanConfirm = async () => {
      if (!scannedStudent || !attendance) return;

      setScanIsUpdating(true);
      try {
         await markStudentMutation.mutateAsync({
            attendanceId: id,
            data: { studentId: scannedStudent._id, status: scanSelectedStatus as AttendanceStatus },
         });

         // Add to recent scans
         const now = new Date();
         const timeStr = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
         });
         setRecentScans((prev) => [
            { student: scannedStudent, status: scanSelectedStatus, time: timeStr },
            ...prev,
         ]);
      } catch (error: any) {
         Alert.alert('Error', error?.response?.data?.message || 'Failed to mark student');
      } finally {
         setScanIsUpdating(false);
         setShowScanResult(false);
         setScannedStudent(null);
         setScanPaused(false);
      }
   };

   const handleScanCancel = () => {
      setShowScanResult(false);
      setScannedStudent(null);
      setScanPaused(false);
   };

   const handleCloseScanner = () => {
      setShowScanner(false);
      setScanPaused(false);
      setShowScanResult(false);
      setScannedStudent(null);
      setRecentScans([]);
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
               onPress: () => {
                  completeAttendanceMutation.mutate(id, {
                     onSuccess: () => {
                        Alert.alert('Success', 'Attendance completed successfully');
                     },
                     onError: (error: any) => {
                        Alert.alert('Error', error?.response?.data?.message || 'Failed to complete attendance');
                     },
                  });
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
               onPress: () => {
                  deleteAttendanceMutation.mutate(id, {
                     onSuccess: () => {
                        Alert.alert('Success', 'Attendance deleted successfully', [
                           { text: 'OK', onPress: () => router.back() },
                        ]);
                     },
                     onError: (error: any) => {
                        Alert.alert('Error', error?.response?.data?.message || 'Failed to delete attendance');
                     },
                  });
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
   const isCreator = attendance.isCreator !== false;
   const pctColor = (attendance.attendancePercentage ?? 0) >= 75 ? '#10b981' : (attendance.attendancePercentage ?? 0) >= 50 ? '#f59e0b' : '#ef4444';

   return (
      <SafeAreaView style={styles.container}>
         <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
               <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Attendance Details</Text>
            <View style={styles.headerActions}>
               {isCreator && isInProgress && (
                  <TouchableOpacity onPress={() => setShowScanner(true)} style={styles.headerButton}>
                     <Ionicons name="qr-code-outline" size={24} color="#4CAF50" />
                  </TouchableOpacity>
               )}
               {isCreator && isInProgress && (
                  <TouchableOpacity onPress={handleDeleteAttendance} style={styles.headerButton}>
                     <Ionicons name="trash-outline" size={24} color="#F44336" />
                  </TouchableOpacity>
               )}
               {(!isCreator || !isInProgress) && <View style={styles.headerButton} />}
            </View>
         </View>

         <ScrollView
            style={styles.scrollView}
            refreshControl={<RefreshControl refreshing={false} onRefresh={() => refetch()} tintColor="#fff" />}
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

            {/* Statistics — Premium Design */}
            <View style={styles.statsCard}>
               {/* Attendance Rate Hero */}
               <View style={styles.statsHeroRow}>
                  <View style={[styles.statsRing, { borderColor: pctColor }]}>
                     <Text style={[styles.statsRingValue, { color: pctColor }]}>
                        {attendance.attendancePercentage ?? 0}
                     </Text>
                     <Text style={styles.statsRingUnit}>%</Text>
                  </View>
                  <View style={styles.statsHeroInfo}>
                     <Text style={styles.statsHeroLabel}>Attendance Rate</Text>
                     <Text style={styles.statsHeroSub}>
                        {attendance.totalPresent} of {attendance.totalStudents} present
                     </Text>
                     <View style={styles.statsHeroBarBg}>
                        <View
                           style={[
                              styles.statsHeroBarFill,
                              {
                                 width: `${Math.min(attendance.attendancePercentage ?? 0, 100)}%`,
                                 backgroundColor: pctColor,
                              },
                           ]}
                        />
                     </View>
                  </View>
               </View>

               {/* Status Breakdown Grid */}
               {isCreator && (
                  <View style={styles.statsBreakdown}>
                     {[
                        { label: 'Present', value: attendance.totalPresent, color: '#10b981', icon: 'checkmark-circle' as const },
                        { label: 'Absent', value: attendance.totalAbsent, color: '#ef4444', icon: 'close-circle' as const },
                        { label: 'Late', value: attendance.totalLate, color: '#f59e0b', icon: 'time' as const },
                        { label: 'Excused', value: attendance.totalExcused, color: '#8b5cf6', icon: 'information-circle' as const },
                     ].map((item) => {
                        const barPct = attendance.totalStudents > 0 ? (item.value / attendance.totalStudents) * 100 : 0;
                        return (
                           <View key={item.label} style={styles.statsBreakdownItem}>
                              <View style={styles.statsBreakdownTop}>
                                 <View style={[styles.statsBreakdownDot, { backgroundColor: item.color }]} />
                                 <Text style={styles.statsBreakdownLabel}>{item.label}</Text>
                                 <Text style={[styles.statsBreakdownValue, { color: item.color }]}>
                                    {item.value}
                                 </Text>
                              </View>
                              <View style={styles.statsBreakdownBarBg}>
                                 <View
                                    style={[
                                       styles.statsBreakdownBarFill,
                                       { width: `${barPct}%`, backgroundColor: item.color },
                                    ]}
                                 />
                              </View>
                           </View>
                        );
                     })}
                  </View>
               )}

               {/* Non-creator — compact summary row */}
               {!isCreator && (
                  <View style={styles.statsCompactRow}>
                     <View style={styles.statsCompactItem}>
                        <Text style={styles.statsCompactValue}>{attendance.totalStudents}</Text>
                        <Text style={styles.statsCompactLabel}>Students</Text>
                     </View>
                     <View style={[styles.statsCompactDivider]} />
                     <View style={styles.statsCompactItem}>
                        <Text style={[styles.statsCompactValue, { color: '#10b981' }]}>{attendance.totalPresent}</Text>
                        <Text style={styles.statsCompactLabel}>Present</Text>
                     </View>
                     <View style={[styles.statsCompactDivider]} />
                     <View style={styles.statsCompactItem}>
                        <Text style={[styles.statsCompactValue, { color: '#ef4444' }]}>{attendance.totalAbsent}</Text>
                        <Text style={styles.statsCompactLabel}>Absent</Text>
                     </View>
                     <View style={[styles.statsCompactDivider]} />
                     <View style={styles.statsCompactItem}>
                        <Text style={[styles.statsCompactValue, { color: '#f59e0b' }]}>{attendance.totalLate}</Text>
                        <Text style={styles.statsCompactLabel}>Late</Text>
                     </View>
                  </View>
               )}

               {/* Creator — total students footer */}
               {isCreator && (
                  <View style={styles.statsTotalRow}>
                     <Ionicons name="people" size={18} color="#888" />
                     <Text style={styles.statsTotalText}>
                        {attendance.totalStudents} Total Students
                     </Text>
                  </View>
               )}
            </View>

            {/* Student's Own Status — Non-creator only */}
            {!isCreator && attendance.myRecord && (
               <View style={styles.myRecordCard}>
                  <Text style={styles.myRecordTitle}>Your Attendance</Text>
                  <View style={styles.myRecordContent}>
                     <View
                        style={[
                           styles.myRecordBadge,
                           { backgroundColor: getStatusColor(attendance.myRecord.status) + '18' },
                        ]}
                     >
                        <Ionicons
                           name={getStatusIcon(attendance.myRecord.status) as any}
                           size={32}
                           color={getStatusColor(attendance.myRecord.status)}
                        />
                        <Text
                           style={[
                              styles.myRecordStatusText,
                              { color: getStatusColor(attendance.myRecord.status) },
                           ]}
                        >
                           {attendance.myRecord.status.charAt(0).toUpperCase() + attendance.myRecord.status.slice(1)}
                        </Text>
                     </View>
                     {attendance.myRecord.markedAt && (
                        <Text style={styles.myRecordTime}>
                           Marked at {formatTime(attendance.myRecord.markedAt)}
                        </Text>
                     )}
                     {attendance.myRecord.notes && (
                        <Text style={styles.myRecordNotes}>{attendance.myRecord.notes}</Text>
                     )}
                  </View>
               </View>
            )}

            {/* Taken By — Non-creator only */}
            {!isCreator && takenByInfo && (
               <View style={styles.card}>
                  <View style={styles.infoRow}>
                     <View style={styles.infoItem}>
                        <Ionicons name="person-outline" size={20} color="#888" />
                        <Text style={styles.infoLabel}>Taken By</Text>
                     </View>
                     <Text style={styles.infoValue}>{takenByInfo.name || 'Teacher'}</Text>
                  </View>
               </View>
            )}

            {/* Students List — Creator only */}
            {isCreator && (
               <View style={styles.card}>
                  <View style={styles.studentsHeader}>
                     <Text style={styles.studentsTitle}>Students ({attendance.studentRecords.length})</Text>
                     {isInProgress && (
                        <Text style={styles.studentsHint}>Tap to mark</Text>
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
                              {student.profilePicture ? (
                                 <Image
                                    source={{ uri: student.profilePicture }}
                                    style={[
                                       styles.studentAvatar,
                                       { backgroundColor: getStatusColor(record.status) + '20' },
                                    ]}
                                 />
                              ) : (
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
                              )}
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
            )}

            {attendance.notes && (
               <View style={styles.card}>
                  <Text style={styles.notesTitle}>Notes</Text>
                  <Text style={styles.notesText}>{attendance.notes}</Text>
               </View>
            )}

            {isCreator && isInProgress && (
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

         {isCreator && renderStatusModal()}

         {/* QR Scanner Modal — Creator only */}
         {isCreator && (
            <QRScannerModal
               visible={showScanner}
               onClose={handleCloseScanner}
               studentRecords={attendance?.studentRecords || []}
               onStudentScanned={handleStudentScanned}
               scanPaused={scanPaused}
               recentScans={recentScans}
            />
         )}

         {/* Scan Result Modal — Creator only */}
         {isCreator && (
            <ScanResultModal
               visible={showScanResult}
               student={scannedStudent}
               currentStatus={scannedStudentStatus}
               selectedStatus={scanSelectedStatus}
               onStatusSelect={setScanSelectedStatus}
               onConfirm={handleScanConfirm}
               onCancel={handleScanCancel}
               isUpdating={scanIsUpdating}
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
   header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#1a1a1a',
   },
   headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
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
   /* -------- Premium Stats -------- */
   statsHeroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
   },
   statsRing: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 4,
      alignItems: 'center',
      justifyContent: 'center',
   },
   statsRingValue: {
      fontSize: 26,
      fontWeight: '800',
   },
   statsRingUnit: {
      fontSize: 12,
      fontWeight: '600',
      color: '#888',
      marginTop: -2,
   },
   statsHeroInfo: {
      flex: 1,
      gap: 4,
   },
   statsHeroLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: '#ffffff',
   },
   statsHeroSub: {
      fontSize: 13,
      color: '#888',
   },
   statsHeroBarBg: {
      height: 6,
      borderRadius: 3,
      backgroundColor: '#2a2a2a',
      marginTop: 6,
      overflow: 'hidden',
   },
   statsHeroBarFill: {
      height: '100%',
      borderRadius: 3,
   },
   /* Breakdown grid (creator) */
   statsBreakdown: {
      marginTop: 20,
      gap: 14,
   },
   statsBreakdownItem: {
      gap: 6,
   },
   statsBreakdownTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
   },
   statsBreakdownDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
   },
   statsBreakdownLabel: {
      flex: 1,
      fontSize: 14,
      color: '#ccc',
   },
   statsBreakdownValue: {
      fontSize: 16,
      fontWeight: '700',
   },
   statsBreakdownBarBg: {
      height: 4,
      borderRadius: 2,
      backgroundColor: '#2a2a2a',
      overflow: 'hidden',
   },
   statsBreakdownBarFill: {
      height: '100%',
      borderRadius: 2,
   },
   /* Compact row (non-creator) */
   statsCompactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 18,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: '#2a2a2a',
   },
   statsCompactItem: {
      flex: 1,
      alignItems: 'center',
   },
   statsCompactValue: {
      fontSize: 20,
      fontWeight: '700',
      color: '#ffffff',
   },
   statsCompactLabel: {
      fontSize: 11,
      color: '#888',
      marginTop: 2,
   },
   statsCompactDivider: {
      width: 1,
      height: 30,
      backgroundColor: '#2a2a2a',
   },
   /* Total students footer (creator) */
   statsTotalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 16,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: '#2a2a2a',
   },
   statsTotalText: {
      fontSize: 14,
      color: '#888',
   },
   /* -------- My Record Card (non-creator) -------- */
   myRecordCard: {
      backgroundColor: '#1a1a1a',
      marginHorizontal: 20,
      marginTop: 20,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: '#2a2a2a',
   },
   myRecordTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: 14,
   },
   myRecordContent: {
      alignItems: 'center',
      gap: 10,
   },
   myRecordBadge: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      paddingVertical: 18,
      borderRadius: 14,
      gap: 6,
   },
   myRecordStatusText: {
      fontSize: 18,
      fontWeight: '700',
   },
   myRecordTime: {
      fontSize: 13,
      color: '#888',
      marginTop: 4,
   },
   myRecordNotes: {
      fontSize: 13,
      color: '#aaa',
      fontStyle: 'italic',
      textAlign: 'center',
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
