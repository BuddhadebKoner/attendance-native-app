import React, { useEffect, useState, useCallback } from 'react';
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   TouchableOpacity,
   ActivityIndicator,
   RefreshControl,
   Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEnrolledClasses, useAcceptEnrollment, useRejectEnrollment } from '@/hooks/queries';
import { useAuth } from '@/contexts/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { ClassJoinScannerModal } from '@/components/features/class';

export default function EnrolledClassesScreen() {
   const { requireAuth, isAuthenticated } = useRequireAuth();
   const { user } = useAuth();
   const { data: enrolledData, isLoading: loading, refetch } = useEnrolledClasses();
   const classes = enrolledData?.enrolledClasses ?? [];
   const totalClasses = enrolledData?.totalClasses ?? 0;
   const acceptMutation = useAcceptEnrollment();
   const rejectMutation = useRejectEnrollment();
   const [refreshing, setRefreshing] = useState(false);
   const [showScanner, setShowScanner] = useState(false);

   const pendingClasses = classes.filter((c) => c.enrollmentStatus === 'pending');
   const requestedClasses = classes.filter((c) => c.enrollmentStatus === 'requested');
   const acceptedClasses = classes.filter((c) => c.enrollmentStatus === 'accepted');

   const onRefresh = useCallback(async () => {
      setRefreshing(true);
      try {
         await refetch();
      } finally {
         setRefreshing(false);
      }
   }, [refetch]);

   useEffect(() => {
      if (!isAuthenticated) {
         requireAuth();
         return;
      }
   }, [isAuthenticated]);

   const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
         month: 'short',
         day: 'numeric',
         year: 'numeric',
      });
   };

   const handleAccept = (classId: string, className: string) => {
      if (!user?._id) return;
      Alert.alert(
         'Accept Invitation',
         `Join "${className}"?`,
         [
            { text: 'Cancel', style: 'cancel' },
            {
               text: 'Accept',
               onPress: () => {
                  acceptMutation.mutate(
                     { classId, studentId: user._id },
                     {
                        onSuccess: () => {
                           Alert.alert('Success', 'You have joined the class!');
                        },
                        onError: (error: any) => {
                           Alert.alert('Error', error?.response?.data?.message || 'Failed to accept');
                        },
                     }
                  );
               },
            },
         ]
      );
   };

   const handleReject = (classId: string, className: string) => {
      if (!user?._id) return;
      Alert.alert(
         'Reject Invitation',
         `Decline invitation to "${className}"? You will be removed from the class.`,
         [
            { text: 'Cancel', style: 'cancel' },
            {
               text: 'Reject',
               style: 'destructive',
               onPress: () => {
                  rejectMutation.mutate(
                     { classId, studentId: user._id },
                     {
                        onSuccess: () => {
                           Alert.alert('Done', 'Invitation declined.');
                        },
                        onError: (error: any) => {
                           Alert.alert('Error', error?.response?.data?.message || 'Failed to reject');
                        },
                     }
                  );
               },
            },
         ]
      );
   };

   if (loading) {
      return (
         <SafeAreaView style={styles.container}>
            <View style={styles.loadingContainer}>
               <ActivityIndicator size="large" color="#10b981" />
               <Text style={styles.loadingText}>Loading classes...</Text>
            </View>
         </SafeAreaView>
      );
   }

   return (
      <SafeAreaView style={styles.container}>
         <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
               <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#10b981"
               />
            }
         >
            {/* Header */}
            <View style={styles.header}>
               <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="#ffffff" />
               </TouchableOpacity>
               <Text style={styles.title}>Enrolled Classes</Text>
               <TouchableOpacity
                  onPress={() => setShowScanner(true)}
                  style={styles.scanButton}
               >
                  <Ionicons name="qr-code-outline" size={22} color="#10b981" />
               </TouchableOpacity>
            </View>

            {/* Summary */}
            <View style={styles.summaryRow}>
               <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{totalClasses}</Text>
                  <Text style={styles.summaryLabel}>Total</Text>
               </View>
               <View style={styles.summaryItem}>
                  <Text style={[styles.summaryNumber, { color: '#4CAF50' }]}>{acceptedClasses.length}</Text>
                  <Text style={styles.summaryLabel}>Accepted</Text>
               </View>
               {pendingClasses.length > 0 && (
                  <View style={styles.summaryItem}>
                     <Text style={[styles.summaryNumber, { color: '#FFC107' }]}>{pendingClasses.length}</Text>
                     <Text style={styles.summaryLabel}>Pending</Text>
                  </View>
               )}
               {requestedClasses.length > 0 && (
                  <View style={styles.summaryItem}>
                     <Text style={[styles.summaryNumber, { color: '#FF9500' }]}>{requestedClasses.length}</Text>
                     <Text style={styles.summaryLabel}>Requested</Text>
                  </View>
               )}
            </View>

            {/* Classes List */}
            {classes.length > 0 ? (
               <View style={styles.classesContainer}>
                  {classes.map((classItem) => (
                     <TouchableOpacity
                        key={classItem._id}
                        style={[
                           styles.classCard,
                           classItem.enrollmentStatus === 'pending' && styles.classCardPending,
                           classItem.enrollmentStatus === 'requested' && styles.classCardRequested,
                        ]}
                        onPress={() => {
                           if (classItem.enrollmentStatus === 'accepted') {
                              router.push(`/(app)/(home)/class/${classItem._id}`);
                           }
                        }}
                        activeOpacity={classItem.enrollmentStatus === 'accepted' ? 0.7 : 1}
                     >
                        <View style={styles.classHeader}>
                           <View style={styles.classIconContainer}>
                              <Ionicons name="book" size={24} color="#10b981" />
                           </View>
                           <View style={styles.classInfo}>
                              <Text style={styles.className}>{classItem.className}</Text>
                              <Text style={styles.classSubject}>{classItem.subject}</Text>
                           </View>

                           {/* Enrollment status badge */}
                           <View style={[
                              styles.enrollmentBadge,
                              classItem.enrollmentStatus === 'accepted'
                                 ? styles.enrollmentAccepted
                                 : classItem.enrollmentStatus === 'requested'
                                    ? styles.enrollmentRequested
                                    : styles.enrollmentPending,
                           ]}>
                              <Text style={[
                                 styles.enrollmentBadgeText,
                                 classItem.enrollmentStatus === 'accepted'
                                    ? styles.enrollmentAcceptedText
                                    : classItem.enrollmentStatus === 'requested'
                                       ? styles.enrollmentRequestedText
                                       : styles.enrollmentPendingText,
                              ]}>
                                 {classItem.enrollmentStatus === 'accepted'
                                    ? 'Accepted'
                                    : classItem.enrollmentStatus === 'requested'
                                       ? 'Requested'
                                       : 'Pending'}
                              </Text>
                           </View>
                        </View>

                        <View style={styles.classFooter}>
                           <View style={styles.footerItem}>
                              <Ionicons name="person-outline" size={16} color="#888" />
                              <Text style={styles.footerText}>
                                 Teacher: {typeof classItem.createdBy === 'object'
                                    ? classItem.createdBy.name || classItem.createdBy.mobile
                                    : 'Unknown'}
                              </Text>
                           </View>
                           <View style={styles.footerItem}>
                              <Ionicons name="calendar-outline" size={16} color="#888" />
                              <Text style={styles.footerText}>
                                 Since {formatDate(classItem.createdAt)}
                              </Text>
                           </View>
                        </View>

                        {/* Accept/Reject buttons for pending classes */}
                        {classItem.enrollmentStatus === 'pending' ? (
                           <View style={styles.actionRow}>
                              <TouchableOpacity
                                 style={styles.acceptButton}
                                 onPress={() => handleAccept(classItem._id, classItem.className)}
                                 disabled={acceptMutation.isPending || rejectMutation.isPending}
                              >
                                 {acceptMutation.isPending ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                 ) : (
                                    <>
                                       <Ionicons name="checkmark-circle" size={18} color="#fff" />
                                       <Text style={styles.acceptButtonText}>Accept</Text>
                                    </>
                                 )}
                              </TouchableOpacity>
                              <TouchableOpacity
                                 style={styles.rejectButton}
                                 onPress={() => handleReject(classItem._id, classItem.className)}
                                 disabled={acceptMutation.isPending || rejectMutation.isPending}
                              >
                                 {rejectMutation.isPending ? (
                                    <ActivityIndicator size="small" color="#ff4444" />
                                 ) : (
                                    <>
                                       <Ionicons name="close-circle" size={18} color="#ff4444" />
                                       <Text style={styles.rejectButtonText}>Reject</Text>
                                    </>
                                 )}
                              </TouchableOpacity>
                           </View>
                        ) : classItem.enrollmentStatus === 'requested' ? (
                           /* Awaiting approval message for requested classes */
                           <View style={styles.awaitingRow}>
                              <Ionicons name="time-outline" size={16} color="#FF9500" />
                              <Text style={styles.awaitingText}>Awaiting teacher approval</Text>
                           </View>
                        ) : (
                           /* View Attendance Button for accepted classes */
                           <TouchableOpacity
                              style={styles.attendanceButton}
                              onPress={() => {
                                 router.push({
                                    pathname: '/(app)/(profile)/class-attendance',
                                    params: { classId: classItem._id },
                                 } as any);
                              }}
                           >
                              <Ionicons name="stats-chart" size={16} color="#ffffff" />
                              <Text style={styles.attendanceButtonText}>View My Attendance</Text>
                           </TouchableOpacity>
                        )}
                     </TouchableOpacity>
                  ))}
               </View>
            ) : (
               <View style={styles.emptyContainer}>
                  <Ionicons name="school-outline" size={64} color="#888" />
                  <Text style={styles.emptyText}>No Enrolled Classes</Text>
                  <Text style={styles.emptySubtext}>
                     Scan a class QR code or contact your teacher to get enrolled.
                  </Text>
                  <TouchableOpacity
                     style={styles.scanEmptyButton}
                     onPress={() => setShowScanner(true)}
                  >
                     <Ionicons name="qr-code-outline" size={20} color="#ffffff" />
                     <Text style={styles.scanEmptyButtonText}>Scan QR to Join</Text>
                  </TouchableOpacity>
               </View>
            )}
         </ScrollView>

         {/* QR Scanner Modal */}
         <ClassJoinScannerModal
            visible={showScanner}
            onClose={() => setShowScanner(false)}
         />
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
      marginTop: 12,
      fontSize: 16,
      color: '#888',
   },
   header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#333',
   },
   backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
   },
   title: {
      fontSize: 18,
      fontWeight: '600',
      color: '#ffffff',
   },
   scanButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.3)',
   },
   summaryCard: {
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      padding: 24,
      margin: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#333',
   },
   summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: '#1a1a1a',
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#333',
   },
   summaryItem: {
      alignItems: 'center',
      gap: 4,
   },
   summaryNumber: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#ffffff',
   },
   summaryLabel: {
      fontSize: 13,
      color: '#888',
   },
   classesContainer: {
      padding: 16,
      paddingTop: 0,
      gap: 12,
   },
   classCard: {
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: '#333',
   },
   classCardPending: {
      borderColor: 'rgba(255, 193, 7, 0.3)',
   },
   classCardRequested: {
      borderColor: 'rgba(255, 149, 0, 0.3)',
   },
   classHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
   },
   classIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#222',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
   },
   classInfo: {
      flex: 1,
   },
   className: {
      fontSize: 18,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 4,
   },
   classSubject: {
      fontSize: 14,
      color: '#888',
   },
   classFooter: {
      gap: 8,
      marginBottom: 12,
   },
   footerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
   },
   footerText: {
      fontSize: 14,
      color: '#888',
   },
   attendanceButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#10b981',
      padding: 12,
      borderRadius: 8,
      gap: 8,
      marginTop: 4,
   },
   attendanceButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
   },
   enrollmentBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
   },
   enrollmentAccepted: {
      backgroundColor: 'rgba(76, 175, 80, 0.15)',
   },
   enrollmentPending: {
      backgroundColor: 'rgba(255, 193, 7, 0.15)',
   },
   enrollmentRequested: {
      backgroundColor: 'rgba(255, 149, 0, 0.15)',
   },
   enrollmentBadgeText: {
      fontSize: 12,
      fontWeight: '600',
   },
   enrollmentAcceptedText: {
      color: '#4CAF50',
   },
   enrollmentPendingText: {
      color: '#FFC107',
   },
   enrollmentRequestedText: {
      color: '#FF9500',
   },
   actionRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
   },
   acceptButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#4CAF50',
      padding: 12,
      borderRadius: 8,
      gap: 6,
   },
   acceptButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
   },
   rejectButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 68, 68, 0.1)',
      padding: 12,
      borderRadius: 8,
      gap: 6,
      borderWidth: 1,
      borderColor: 'rgba(255, 68, 68, 0.3)',
   },
   rejectButtonText: {
      color: '#ff4444',
      fontSize: 14,
      fontWeight: '600',
   },
   awaitingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 149, 0, 0.08)',
      padding: 12,
      borderRadius: 8,
      gap: 8,
      marginTop: 4,
      borderWidth: 1,
      borderColor: 'rgba(255, 149, 0, 0.2)',
   },
   awaitingText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#FF9500',
   },
   emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 64,
      paddingHorizontal: 32,
   },
   emptyText: {
      fontSize: 20,
      fontWeight: '600',
      color: '#ffffff',
      marginTop: 16,
      textAlign: 'center',
   },
   emptySubtext: {
      fontSize: 14,
      color: '#888',
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 20,
   },
   scanEmptyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#10b981',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 10,
      gap: 8,
      marginTop: 20,
   },
   scanEmptyButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#ffffff',
   },
});
