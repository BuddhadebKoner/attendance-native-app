import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { useRequireAuth } from '../../../hooks/useRequireAuth';
import { useClasses, useEnrolledClasses, useUpdateProfile, useAcceptEnrollment, useRejectEnrollment } from '../../../hooks/queries';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import RoleSelectionModal from '../../../components/features/auth/RoleSelectionModal';
import { ClassJoinScannerModal } from '../../../components/features/class';

export default function DashboardScreen() {
   const { user, refreshUser } = useAuth();
   const { requireAuth, isAuthenticated } = useRequireAuth();
   const isTeacher = user?.role === 'teacher';
   const isStudent = user?.role === 'student';
   const needsRoleSelection = isAuthenticated && !user?.role;
   const { data: classesData, refetch: refetchClasses } = useClasses(undefined, isAuthenticated && isTeacher);
   const { data: enrolledData, refetch: refetchEnrolled } = useEnrolledClasses(undefined, isAuthenticated && isStudent);
   const updateProfileMutation = useUpdateProfile();
   const acceptMutation = useAcceptEnrollment();
   const rejectMutation = useRejectEnrollment();
   const [refreshing, setRefreshing] = useState(false);
   const [currentTime, setCurrentTime] = useState(new Date());
   const [showScanner, setShowScanner] = useState(false);

   // Compute pending / requested / accepted classes
   const pendingClasses = enrolledData?.enrolledClasses?.filter((c: any) => c.enrollmentStatus === 'pending') || [];
   const requestedClasses = enrolledData?.enrolledClasses?.filter((c: any) => c.enrollmentStatus === 'requested') || [];
   const acceptedClasses = enrolledData?.enrolledClasses?.filter((c: any) => c.enrollmentStatus === 'accepted') || [];
   const pendingCount = pendingClasses.length;
   const requestedCount = requestedClasses.length;
   const joinRequestCount = user?.totalJoinRequests || 0;

   const handleAcceptInvite = (classId: string, className: string) => {
      if (!user?._id) return;
      Alert.alert('Accept Invitation', `Join "${className}"?`, [
         { text: 'Cancel', style: 'cancel' },
         {
            text: 'Accept',
            onPress: () => {
               acceptMutation.mutate(
                  { classId, studentId: user._id },
                  {
                     onSuccess: () => Alert.alert('Success', 'You have joined the class!'),
                     onError: (error: any) => Alert.alert('Error', error?.response?.data?.message || 'Failed to accept'),
                  }
               );
            },
         },
      ]);
   };

   const handleRejectInvite = (classId: string, className: string) => {
      if (!user?._id) return;
      Alert.alert('Reject Invitation', `Decline invitation to "${className}"?`, [
         { text: 'Cancel', style: 'cancel' },
         {
            text: 'Reject',
            style: 'destructive',
            onPress: () => {
               rejectMutation.mutate(
                  { classId, studentId: user._id },
                  {
                     onSuccess: () => Alert.alert('Done', 'Invitation declined.'),
                     onError: (error: any) => Alert.alert('Error', error?.response?.data?.message || 'Failed to reject'),
                  }
               );
            },
         },
      ]);
   };

   useEffect(() => {
      // Update time every minute
      const timer = setInterval(() => {
         setCurrentTime(new Date());
      }, 60000);

      return () => clearInterval(timer);
   }, []);

   const onRefresh = async () => {
      if (!isAuthenticated) {
         router.push('/(public)/login');
         return;
      }
      setRefreshing(true);
      try {
         const refreshPromises: Promise<any>[] = [refreshUser()];
         if (isTeacher) refreshPromises.push(refetchClasses());
         if (isStudent) refreshPromises.push(refetchEnrolled());
         await Promise.all(refreshPromises);
      } catch (error) {
         console.error('Error refreshing:', error);
      } finally {
         setRefreshing(false);
      }
   };

   const getGreeting = () => {
      const hour = currentTime.getHours();
      if (hour < 12) return 'Good Morning';
      if (hour < 18) return 'Good Afternoon';
      return 'Good Evening';
   };

   const formatDate = () => {
      return currentTime.toLocaleDateString('en-US', {
         weekday: 'long',
         year: 'numeric',
         month: 'long',
         day: 'numeric',
      });
   };

   const handleRoleSelect = async (role: 'teacher' | 'student') => {
      updateProfileMutation.mutate(
         { role },
         {
            onSuccess: () => {
               refreshUser();
            },
         }
      );
   };

   return (
      <SafeAreaView style={styles.container}>
         <ScrollView
            style={styles.scrollView}
            refreshControl={
               <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
            }
         >
            <View style={styles.header}>
               <View>
                  <Text style={styles.greeting}>{getGreeting()}</Text>
                  <Text style={styles.userName}>
                     {isAuthenticated ? (user?.name || user?.email || 'User') : 'Guest'}
                  </Text>
               </View>
               <TouchableOpacity
                  style={styles.avatar}
                  onPress={() => {
                     if (isAuthenticated) {
                        router.push('/(app)/(profile)');
                     } else {
                        router.push('/(public)/login');
                     }
                  }}
               >
                  {user?.profilePicture ? (
                     <Image
                        source={{ uri: user.profilePicture }}
                        style={styles.avatar}
                     />
                  ) : (
                     <View style={styles.avatarLarge}>
                        {/* login user icon */}
                        <Ionicons name="person-circle" size={50} />
                     </View>
                  )}
               </TouchableOpacity>
            </View>

            {!isAuthenticated && (
               <View style={styles.loginBanner}>
                  <View style={styles.loginBannerContent}>
                     <Ionicons name="lock-closed-outline" size={28} color="#007AFF" />
                     <View style={styles.loginBannerTextContainer}>
                        <Text style={styles.loginBannerTitle}>Welcome to Attendance App</Text>
                        <Text style={styles.loginBannerSubtitle}>
                           Log in to create classes, track attendance, and view your stats
                        </Text>
                     </View>
                  </View>
                  <View style={styles.loginBannerButtons}>
                     <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => router.push('/(public)/login')}
                     >
                        <Text style={styles.loginButtonText}>Sign in with Google</Text>
                     </TouchableOpacity>
                  </View>
               </View>
            )}

            <View style={styles.section}>
               <Text style={styles.sectionTitle}>Quick Actions</Text>
               <View style={styles.actionGrid}>
                  {/* Teacher-only actions */}
                  {(!isStudent) && (
                     <>
                        <TouchableOpacity
                           style={styles.actionCard}
                           onPress={() => requireAuth(() => router.push('/(app)/(home)/create-class'))}
                        >
                           <Ionicons name="add-circle" size={32} color="#ffffff" style={styles.actionIcon} />
                           <Text style={styles.actionText}>Create Class</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                           style={styles.actionCard}
                           onPress={() => requireAuth(() => router.push('/(app)/(home)/attendances'))}
                        >
                           <Ionicons name="calendar-outline" size={32} color="#ffffff" style={styles.actionIcon} />
                           <Text style={styles.actionText}>My Attendances</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                           style={styles.actionCard}
                           onPress={() => requireAuth(() => router.push('/(app)/(home)/join-requests'))}
                        >
                           <View>
                              <Ionicons name="people-outline" size={32} color="#ffffff" style={styles.actionIcon} />
                              {joinRequestCount > 0 && (
                                 <View style={styles.joinRequestBadge}>
                                    <Text style={styles.joinRequestBadgeText}>{joinRequestCount}</Text>
                                 </View>
                              )}
                           </View>
                           <Text style={styles.actionText}>Join Requests</Text>
                        </TouchableOpacity>
                     </>
                  )}

                  {/* Student-only actions */}
                  {(!isTeacher) && (
                     <>
                        <TouchableOpacity
                           style={styles.actionCard}
                           onPress={() => requireAuth(() => router.push('/(app)/(profile)/enrolled-classes'))}
                        >
                           <View>
                              <MaterialCommunityIcons name="school-outline" size={32} color="#ffffff" style={styles.actionIcon} />
                              {pendingCount > 0 && (
                                 <View style={styles.pendingBadge}>
                                    <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
                                 </View>
                              )}
                           </View>
                           <Text style={styles.actionText}>Enrolled Classes</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                           style={styles.actionCard}
                           onPress={() => requireAuth(() => router.push('/(app)/(profile)/my-attendance-history'))}
                        >
                           <Ionicons name="time-outline" size={32} color="#ffffff" style={styles.actionIcon} />
                           <Text style={styles.actionText}>Attendance History</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                           style={styles.actionCard}
                           onPress={() => requireAuth(() => router.push('/(app)/(profile)/my-attendance-stats'))}
                        >
                           <Ionicons name="stats-chart" size={32} color="#ffffff" style={styles.actionIcon} />
                           <Text style={styles.actionText}>My Stats</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                           style={styles.actionCard}
                           onPress={() => requireAuth(() => setShowScanner(true))}
                        >
                           <Ionicons name="qr-code-outline" size={32} color="#ffffff" style={styles.actionIcon} />
                           <Text style={styles.actionText}>Scan to Join</Text>
                        </TouchableOpacity>
                     </>
                  )}

                  {/* Common actions */}
                  <TouchableOpacity
                     style={styles.actionCard}
                     onPress={() => requireAuth()}
                  >
                     <MaterialCommunityIcons name="chart-line" size={32} color="#ffffff" style={styles.actionIcon} />
                     <Text style={styles.actionText}>Reports</Text>
                  </TouchableOpacity>

                  {isTeacher && (
                     <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => requireAuth()}
                     >
                        <Ionicons name="stats-chart" size={32} color="#ffffff" style={styles.actionIcon} />
                        <Text style={styles.actionText}>Analytics</Text>
                     </TouchableOpacity>
                  )}
               </View>
            </View>

            {/* Recent section — role-based */}
            {isStudent ? (
               <View style={styles.section}>
                  {/* Pending invitations banner */}
                  {pendingCount > 0 && (
                     <TouchableOpacity
                        style={styles.pendingBanner}
                        onPress={() => router.push('/(app)/(profile)/enrolled-classes')}
                        activeOpacity={0.8}
                     >
                        <View style={styles.pendingBannerLeft}>
                           <View style={styles.pendingBannerIcon}>
                              <Ionicons name="mail-unread" size={22} color="#FFC107" />
                           </View>
                           <View>
                              <Text style={styles.pendingBannerTitle}>
                                 {pendingCount} pending invitation{pendingCount > 1 ? 's' : ''}
                              </Text>
                              <Text style={styles.pendingBannerSubtext}>Tap to view and respond</Text>
                           </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#FFC107" />
                     </TouchableOpacity>
                  )}

                  {/* Requested (awaiting approval) banner */}
                  {requestedCount > 0 && (
                     <TouchableOpacity
                        style={styles.requestedBanner}
                        onPress={() => router.push('/(app)/(profile)/enrolled-classes')}
                        activeOpacity={0.8}
                     >
                        <View style={styles.pendingBannerLeft}>
                           <View style={styles.requestedBannerIcon}>
                              <Ionicons name="time-outline" size={22} color="#FF9500" />
                           </View>
                           <View>
                              <Text style={styles.requestedBannerTitle}>
                                 {requestedCount} awaiting approval
                              </Text>
                              <Text style={styles.pendingBannerSubtext}>Teacher will review your request</Text>
                           </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#FF9500" />
                     </TouchableOpacity>
                  )}

                  <Text style={styles.sectionTitle}>My Enrolled Classes</Text>
                  {enrolledData?.enrolledClasses && enrolledData.enrolledClasses.length > 0 ? (
                     <View style={styles.classesContainer}>
                        {enrolledData.enrolledClasses.map((classItem: any, index: number) => {
                           const isPending = classItem.enrollmentStatus === 'pending';
                           const isRequested = classItem.enrollmentStatus === 'requested';
                           const isAccepted = classItem.enrollmentStatus === 'accepted';
                           return (
                              <TouchableOpacity
                                 key={classItem._id || index}
                                 style={[
                                    styles.classCard,
                                    isPending && styles.classCardPending,
                                    isRequested && styles.classCardRequested,
                                 ]}
                                 onPress={() => {
                                    if (isAccepted) {
                                       router.push(`/(app)/(home)/class/${classItem._id}`);
                                    }
                                 }}
                                 activeOpacity={isAccepted ? 0.7 : 1}
                              >
                                 <View style={styles.classHeader}>
                                    <Text style={styles.className}>{classItem.className}</Text>
                                    <View style={[
                                       styles.statusBadge,
                                       isPending && styles.statusBadgePending,
                                       isRequested && styles.statusBadgeRequested,
                                       isAccepted && styles.statusBadgeAccepted,
                                    ]}>
                                       <Text style={[
                                          styles.statusBadgeText,
                                          isPending && styles.statusBadgePendingText,
                                          isRequested && styles.statusBadgeRequestedText,
                                          isAccepted && styles.statusBadgeAcceptedText,
                                       ]}>
                                          {isPending ? 'Pending' : isRequested ? 'Requested' : 'Accepted'}
                                       </Text>
                                    </View>
                                 </View>
                                 <Text style={styles.classSubject}>{classItem.subject}</Text>
                                 {classItem.createdBy && (
                                    <Text style={styles.classTeacher}>
                                       Teacher: {typeof classItem.createdBy === 'object'
                                          ? classItem.createdBy.name || classItem.createdBy.email
                                          : 'Unknown'}
                                    </Text>
                                 )}

                                 {/* Inline Accept / Reject for pending (teacher invited) */}
                                 {isPending && (
                                    <View style={styles.inlineActionRow}>
                                       <TouchableOpacity
                                          style={styles.inlineAcceptBtn}
                                          onPress={() => handleAcceptInvite(classItem._id, classItem.className)}
                                          disabled={acceptMutation.isPending || rejectMutation.isPending}
                                       >
                                          {acceptMutation.isPending ? (
                                             <ActivityIndicator size="small" color="#fff" />
                                          ) : (
                                             <>
                                                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                                                <Text style={styles.inlineAcceptText}>Accept</Text>
                                             </>
                                          )}
                                       </TouchableOpacity>
                                       <TouchableOpacity
                                          style={styles.inlineRejectBtn}
                                          onPress={() => handleRejectInvite(classItem._id, classItem.className)}
                                          disabled={acceptMutation.isPending || rejectMutation.isPending}
                                       >
                                          {rejectMutation.isPending ? (
                                             <ActivityIndicator size="small" color="#ff4444" />
                                          ) : (
                                             <>
                                                <Ionicons name="close-circle" size={16} color="#ff4444" />
                                                <Text style={styles.inlineRejectText}>Reject</Text>
                                             </>
                                          )}
                                       </TouchableOpacity>
                                    </View>
                                 )}

                                 {/* Awaiting teacher approval for requested (student scanned QR) */}
                                 {isRequested && (
                                    <View style={styles.awaitingRow}>
                                       <Ionicons name="time-outline" size={14} color="#FF9500" />
                                       <Text style={styles.awaitingText}>Awaiting teacher approval</Text>
                                    </View>
                                 )}
                              </TouchableOpacity>
                           );
                        })}
                     </View>
                  ) : (
                     <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="school-outline" size={48} color="#333" />
                        <Text style={styles.emptyStateText}>
                           {isAuthenticated ? 'No enrolled classes yet' : 'Log in to see your classes'}
                        </Text>
                        <Text style={styles.emptyStateSubtext}>
                           {isAuthenticated
                              ? 'Ask your teacher to add you to a class'
                              : 'Enroll in classes and track your attendance'}
                        </Text>
                     </View>
                  )}
               </View>
            ) : (
               <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Recent Classes</Text>
                  {classesData?.classes && classesData.classes.length > 0 ? (
                     <View style={styles.classesContainer}>
                        {classesData.classes.map((classItem: any, index: number) => (
                           <TouchableOpacity
                              key={classItem._id || index}
                              style={styles.classCard}
                              onPress={() => router.push(`/(app)/(home)/class/${classItem._id}`)}
                           >
                              <View style={styles.classHeader}>
                                 <Text style={styles.className}>{classItem.className}</Text>
                                 <View style={styles.studentBadge}>
                                    <Ionicons name="people" size={14} color="#888" />
                                    <Text style={styles.studentCount}>{classItem.studentCount || 0}</Text>
                                 </View>
                              </View>
                              <Text style={styles.classSubject}>{classItem.subject}</Text>
                              <Text style={styles.classDate}>
                                 Created {new Date(classItem.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                 })}
                              </Text>
                           </TouchableOpacity>
                        ))}
                     </View>
                  ) : (
                     <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="school-outline" size={48} color="#333" />
                        <Text style={styles.emptyStateText}>
                           {isAuthenticated ? 'No classes yet' : 'Log in to see your classes'}
                        </Text>
                        <Text style={styles.emptyStateSubtext}>
                           {isAuthenticated
                              ? 'Create your first class to get started'
                              : 'Create classes, track attendance, and view recent activity'}
                        </Text>
                     </View>
                  )}
               </View>
            )}
         </ScrollView>

         {/* Role selection modal for first-time users */}
         <RoleSelectionModal
            visible={needsRoleSelection}
            onSelect={handleRoleSelect}
            isLoading={updateProfileMutation.isPending}
         />

         {/* QR Scanner for students to join classes */}
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
   header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: 10,
   },
   greeting: {
      fontSize: 16,
      color: '#888',
   },
   userName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#ffffff',
      marginTop: 4,
   },
   avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#333',
      justifyContent: 'center',
      alignItems: 'center',
   },
   avatarText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#ffffff',
   },
   avatarLarge: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#333',
      justifyContent: 'center',
      alignItems: 'center',
   },
   avatarTextLarge: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#ffffff',
   },
   dateCard: {
      backgroundColor: '#1a1a1a',
      margin: 20,
      marginTop: 10,
      padding: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#333',
   },
   dateText: {
      fontSize: 16,
      color: '#ffffff',
      fontWeight: '600',
   },
   timeText: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#ffffff',
      marginTop: 8,
   },
   section: {
      padding: 20,
      paddingTop: 10,
   },
   sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 16,
   },
   actionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
   },
   actionCard: {
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      padding: 20,
      width: '48%',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#333',
   },
   actionIcon: {
      marginBottom: 8,
   },
   actionText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#ffffff',
   },
   classesContainer: {
      gap: 12,
   },
   classCard: {
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: '#333',
   },
   classHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
   },
   className: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      flex: 1,
   },
   studentBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#222',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
   },
   studentCount: {
      fontSize: 12,
      color: '#888',
      fontWeight: '600',
   },
   classSubject: {
      fontSize: 14,
      color: '#888',
      marginBottom: 8,
   },
   classDate: {
      fontSize: 12,
      color: '#666',
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
      textAlign: 'center',
   },
   loginBanner: {
      backgroundColor: '#1a1a1a',
      marginHorizontal: 20,
      marginBottom: 10,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: '#007AFF',
   },
   loginBannerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 12,
   },
   loginBannerTextContainer: {
      flex: 1,
   },
   loginBannerTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 4,
   },
   loginBannerSubtitle: {
      fontSize: 13,
      color: '#888',
      lineHeight: 18,
   },
   loginBannerButtons: {
      flexDirection: 'row',
      gap: 12,
   },
   loginButton: {
      flex: 1,
      backgroundColor: '#007AFF',
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
   },
   loginButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#ffffff',
   },
   // Pending badge on quick action
   pendingBadge: {
      position: 'absolute',
      top: -6,
      right: -10,
      backgroundColor: '#FFC107',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 5,
   },
   pendingBadgeText: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#000',
   },
   // Pending banner
   pendingBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(255, 193, 7, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255, 193, 7, 0.3)',
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
   },
   pendingBannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
   },
   pendingBannerIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 193, 7, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
   },
   pendingBannerTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FFC107',
   },
   pendingBannerSubtext: {
      fontSize: 12,
      color: '#888',
      marginTop: 2,
   },
   // Class card variants
   classCardPending: {
      borderColor: 'rgba(255, 193, 7, 0.3)',
   },
   classTeacher: {
      fontSize: 12,
      color: '#666',
      marginTop: 2,
   },
   // Status badges
   statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 12,
   },
   statusBadgePending: {
      backgroundColor: 'rgba(255, 193, 7, 0.15)',
   },
   statusBadgeAccepted: {
      backgroundColor: 'rgba(76, 175, 80, 0.15)',
   },
   statusBadgeText: {
      fontSize: 11,
      fontWeight: '600',
   },
   statusBadgePendingText: {
      color: '#FFC107',
   },
   statusBadgeAcceptedText: {
      color: '#4CAF50',
   },
   // Inline accept/reject buttons
   inlineActionRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 12,
   },
   inlineAcceptBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#4CAF50',
      paddingVertical: 10,
      borderRadius: 8,
      gap: 6,
   },
   inlineAcceptText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '600',
   },
   inlineRejectBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 68, 68, 0.1)',
      paddingVertical: 10,
      borderRadius: 8,
      gap: 6,
      borderWidth: 1,
      borderColor: 'rgba(255, 68, 68, 0.3)',
   },
   inlineRejectText: {
      color: '#ff4444',
      fontSize: 13,
      fontWeight: '600',
   },
   // Join request badge on teacher quick action
   joinRequestBadge: {
      position: 'absolute',
      top: -6,
      right: -10,
      backgroundColor: '#FF9500',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 5,
   },
   joinRequestBadgeText: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#000',
   },
   // Requested status styles
   classCardRequested: {
      borderColor: 'rgba(255, 149, 0, 0.3)',
   },
   statusBadgeRequested: {
      backgroundColor: 'rgba(255, 149, 0, 0.15)',
   },
   statusBadgeRequestedText: {
      color: '#FF9500',
   },
   requestedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(255, 149, 0, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255, 149, 0, 0.3)',
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
   },
   requestedBannerIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 149, 0, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
   },
   requestedBannerTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FF9500',
   },
   awaitingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
   },
   awaitingText: {
      fontSize: 12,
      color: '#FF9500',
   },
});
