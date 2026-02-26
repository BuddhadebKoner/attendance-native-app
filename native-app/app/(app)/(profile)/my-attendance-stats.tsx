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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { attendanceApi } from '@/services/attendance.api';
import { theme } from '@/styles/theme';
import type { StudentStats, Class } from '@/types/api';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function MyAttendanceStatsScreen() {
   const { requireAuth, isAuthenticated } = useRequireAuth();
   const [loading, setLoading] = useState(true);
   const [refreshing, setRefreshing] = useState(false);
   const [stats, setStats] = useState<StudentStats | null>(null);
   const [classes, setClasses] = useState<Class[]>([]);

   const fetchStats = async () => {
      try {
         const response = await attendanceApi.getMyStats();
         if (response.success && response.data) {
            setStats(response.data.statistics);
            setClasses(response.data.classesEnrolled);
         }
      } catch (error: any) {
         console.error('Failed to fetch stats:', error);
         Alert.alert('Error', error.response?.data?.message || 'Failed to load statistics');
      } finally {
         setLoading(false);
         setRefreshing(false);
      }
   };

   const onRefresh = () => {
      setRefreshing(true);
      fetchStats();
   };

   useEffect(() => {
      if (!isAuthenticated) {
         requireAuth();
         return;
      }
      fetchStats();
   }, [isAuthenticated]);

   if (loading) {
      return (
         <SafeAreaView style={styles.container}>
            <View style={styles.loadingContainer}>
               <ActivityIndicator size="large" color={theme.colors.primary} />
               <Text style={styles.loadingText}>Loading statistics...</Text>
            </View>
         </SafeAreaView>
      );
   }

   const getStatusColor = (percentage: number) => {
      if (percentage >= 75) return '#10b981';
      if (percentage >= 50) return '#f59e0b';
      return '#ef4444';
   };

   return (
      <SafeAreaView style={styles.container}>
         <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
         >
            {/* Header */}
            <View style={styles.header}>
               <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="#ffffff" />
               </TouchableOpacity>
               <Text style={styles.title}>My Attendance Statistics</Text>
               <View style={styles.backButton} />
            </View>

            {stats && (
               <>
                  {/* Overall Stats Card */}
                  <View style={styles.card}>
                     <View style={styles.cardHeader}>
                        <Ionicons name="stats-chart" size={24} color="#10b981" />
                        <Text style={styles.cardTitle}>Overall Statistics</Text>
                     </View>

                     <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                           <Text style={styles.statValue}>{stats.totalClassesEnrolled}</Text>
                           <Text style={styles.statLabel}>Classes Enrolled</Text>
                        </View>
                        <View style={styles.statItem}>
                           <Text style={styles.statValue}>{stats.totalAttendanceSessions}</Text>
                           <Text style={styles.statLabel}>Total Sessions</Text>
                        </View>
                     </View>

                     {/* Attendance Percentage */}
                     <View style={styles.percentageContainer}>
                        <Text style={styles.percentageLabel}>Attendance Rate</Text>
                        <View style={styles.percentageCircle}>
                           <Text
                              style={[
                                 styles.percentageValue,
                                 { color: getStatusColor(stats.attendancePercentage) },
                              ]}
                           >
                              {stats.attendancePercentage}%
                           </Text>
                        </View>
                     </View>
                  </View>

                  {/* Detailed Breakdown */}
                  <View style={styles.card}>
                     <View style={styles.cardHeader}>
                        <Ionicons name="list" size={24} color="#10b981" />
                        <Text style={styles.cardTitle}>Detailed Breakdown</Text>
                     </View>

                     <View style={styles.breakdownItem}>
                        <View style={styles.breakdownLeft}>
                           <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
                           <Text style={styles.breakdownLabel}>Present</Text>
                        </View>
                        <Text style={styles.breakdownValue}>{stats.totalPresent}</Text>
                     </View>

                     <View style={styles.breakdownItem}>
                        <View style={styles.breakdownLeft}>
                           <View style={[styles.statusDot, { backgroundColor: '#ef4444' }]} />
                           <Text style={styles.breakdownLabel}>Absent</Text>
                        </View>
                        <Text style={styles.breakdownValue}>{stats.totalAbsent}</Text>
                     </View>

                     <View style={styles.breakdownItem}>
                        <View style={styles.breakdownLeft}>
                           <View style={[styles.statusDot, { backgroundColor: '#f59e0b' }]} />
                           <Text style={styles.breakdownLabel}>Late</Text>
                        </View>
                        <Text style={styles.breakdownValue}>{stats.totalLate}</Text>
                     </View>

                     <View style={styles.breakdownItem}>
                        <View style={styles.breakdownLeft}>
                           <View style={[styles.statusDot, { backgroundColor: '#8b5cf6' }]} />
                           <Text style={styles.breakdownLabel}>Excused</Text>
                        </View>
                        <Text style={styles.breakdownValue}>{stats.totalExcused}</Text>
                     </View>
                  </View>

                  {/* Enrolled Classes */}
                  {classes.length > 0 && (
                     <View style={styles.card}>
                        <View style={styles.cardHeader}>
                           <Ionicons name="school" size={24} color="#10b981" />
                           <Text style={styles.cardTitle}>Enrolled Classes</Text>
                        </View>

                        {classes.map((cls, index) => (
                           <View key={cls._id} style={styles.classItem}>
                              <View style={styles.classInfo}>
                                 <Text style={styles.className}>{cls.className}</Text>
                                 <Text style={styles.classSubject}>{cls.subject}</Text>
                              </View>
                              <TouchableOpacity
                                 style={styles.viewButton}
                                 onPress={() => router.push(`/(app)/(home)/class/${cls._id}`)}
                              >
                                 <Text style={styles.viewButtonText}>View</Text>
                              </TouchableOpacity>
                           </View>
                        ))}
                     </View>
                  )}

                  {/* View History Button */}
                  <TouchableOpacity
                     style={styles.historyButton}
                     onPress={() => router.push('/(app)/(profile)/my-attendance-history')}
                  >
                     <Ionicons name="time" size={20} color="#fff" />
                     <Text style={styles.historyButtonText}>View Attendance History</Text>
                  </TouchableOpacity>
               </>
            )}
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
   card: {
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      padding: 16,
      margin: 16,
      marginBottom: 0,
      borderWidth: 1,
      borderColor: '#333',
   },
   cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
   },
   cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#ffffff',
      marginLeft: 8,
   },
   statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 20,
   },
   statItem: {
      alignItems: 'center',
   },
   statValue: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#10b981',
      marginBottom: 4,
   },
   statLabel: {
      fontSize: 14,
      color: '#888',
   },
   percentageContainer: {
      alignItems: 'center',
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: '#333',
   },
   percentageLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 12,
   },
   percentageCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: '#222',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#333',
   },
   percentageValue: {
      fontSize: 36,
      fontWeight: 'bold',
   },
   breakdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#333',
   },
   breakdownLeft: {
      flexDirection: 'row',
      alignItems: 'center',
   },
   statusDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 12,
   },
   breakdownLabel: {
      fontSize: 16,
      color: '#ffffff',
   },
   breakdownValue: {
      fontSize: 18,
      fontWeight: '600',
      color: '#ffffff',
   },
   classItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#333',
   },
   classInfo: {
      flex: 1,
   },
   className: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 4,
   },
   classSubject: {
      fontSize: 14,
      color: '#888',
   },
   viewButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: '#10b981',
   },
   viewButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
   },
   historyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#10b981',
      padding: 16,
      borderRadius: 12,
      margin: 16,
      gap: 8,
   },
   historyButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
   },
});
