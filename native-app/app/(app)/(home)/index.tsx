import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { useRequireAuth } from '../../../hooks/useRequireAuth';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function DashboardScreen() {
   const { user, refreshUser } = useAuth();
   const { requireAuth, isAuthenticated } = useRequireAuth();
   const [refreshing, setRefreshing] = useState(false);
   const [currentTime, setCurrentTime] = useState(new Date());

   useEffect(() => {
      // Only fetch user data if authenticated
      if (isAuthenticated) {
         refreshUser().catch(console.error);
      }
   }, [isAuthenticated]);

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
         await refreshUser();
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
                  {isAuthenticated ? (
                     <Text style={styles.avatarText}>
                        {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                     </Text>
                  ) : (
                     <Ionicons name="person-outline" size={24} color="#ffffff" />
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
                     onPress={() => requireAuth(() => router.push('/(app)/(profile)/my-attendance-history'))}
                  >
                     <Ionicons name="time-outline" size={32} color="#ffffff" style={styles.actionIcon} />
                     <Text style={styles.actionText}>Attendance History</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                     style={styles.actionCard}
                     onPress={() => requireAuth(() => router.push('/(app)/(profile)/enrolled-classes'))}
                  >
                     <MaterialCommunityIcons name="school-outline" size={32} color="#ffffff" style={styles.actionIcon} />
                     <Text style={styles.actionText}>Enrolled Classes</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                     style={styles.actionCard}
                     onPress={() => requireAuth()}
                  >
                     <MaterialCommunityIcons name="chart-line" size={32} color="#ffffff" style={styles.actionIcon} />
                     <Text style={styles.actionText}>Reports</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                     style={styles.actionCard}
                     onPress={() => requireAuth()}
                  >
                     <Ionicons name="stats-chart" size={32} color="#ffffff" style={styles.actionIcon} />
                     <Text style={styles.actionText}>Analytics</Text>
                  </TouchableOpacity>
               </View>
            </View>

            <View style={styles.section}>
               <Text style={styles.sectionTitle}>Recent Classes</Text>
               {user?.classes && user.classes.length > 0 ? (
                  <View style={styles.classesContainer}>
                     {user.classes.map((classItem: any, index: number) => (
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
});
