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
import { studentApi } from '@/services/student.api';
import type { Class } from '@/types/api';

export default function EnrolledClassesScreen() {
   const [loading, setLoading] = useState(true);
   const [refreshing, setRefreshing] = useState(false);
   const [classes, setClasses] = useState<Class[]>([]);
   const [totalClasses, setTotalClasses] = useState(0);

   const fetchEnrolledClasses = async () => {
      try {
         const response = await studentApi.getMyEnrolledClasses();
         if (response.success && response.data) {
            setClasses(response.data.enrolledClasses);
            setTotalClasses(response.data.totalClasses);
         }
      } catch (error: any) {
         console.error('Failed to fetch enrolled classes:', error);
         Alert.alert('Error', error.response?.data?.message || 'Failed to load enrolled classes');
      } finally {
         setLoading(false);
         setRefreshing(false);
      }
   };

   const onRefresh = () => {
      setRefreshing(true);
      fetchEnrolledClasses();
   };

   useEffect(() => {
      fetchEnrolledClasses();
   }, []);

   const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
         month: 'short',
         day: 'numeric',
         year: 'numeric',
      });
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
               <View style={styles.backButton} />
            </View>

            {/* Summary Card */}
            <View style={styles.summaryCard}>
               <Ionicons name="school" size={40} color="#10b981" />
               <Text style={styles.summaryNumber}>{totalClasses}</Text>
               <Text style={styles.summaryLabel}>Total Enrolled Classes</Text>
            </View>

            {/* Classes List */}
            {classes.length > 0 ? (
               <View style={styles.classesContainer}>
                  {classes.map((classItem) => (
                     <TouchableOpacity
                        key={classItem._id}
                        style={styles.classCard}
                        onPress={() => router.push(`/(app)/(home)/class/${classItem._id}`)}
                     >
                        <View style={styles.classHeader}>
                           <View style={styles.classIconContainer}>
                              <Ionicons name="book" size={24} color="#10b981" />
                           </View>
                           <View style={styles.classInfo}>
                              <Text style={styles.className}>{classItem.className}</Text>
                              <Text style={styles.classSubject}>{classItem.subject}</Text>
                           </View>
                           <Ionicons name="chevron-forward" size={24} color="#888" />
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

                        {/* View Attendance Button */}
                        <TouchableOpacity
                           style={styles.attendanceButton}
                           onPress={(e) => {
                              e.stopPropagation();
                              router.push({
                                 pathname: '/(app)/(profile)/class-attendance',
                                 params: { classId: classItem._id }
                              });
                           }}
                        >
                           <Ionicons name="stats-chart" size={16} color="#ffffff" />
                           <Text style={styles.attendanceButtonText}>View My Attendance</Text>
                        </TouchableOpacity>
                     </TouchableOpacity>
                  ))}
               </View>
            ) : (
               <View style={styles.emptyContainer}>
                  <Ionicons name="school-outline" size={64} color="#888" />
                  <Text style={styles.emptyText}>No Enrolled Classes</Text>
                  <Text style={styles.emptySubtext}>
                     You haven't been added to any classes yet. Contact your teacher to get enrolled.
                  </Text>
               </View>
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
   summaryCard: {
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      padding: 24,
      margin: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#333',
   },
   summaryNumber: {
      fontSize: 48,
      fontWeight: 'bold',
      color: '#ffffff',
      marginTop: 12,
   },
   summaryLabel: {
      fontSize: 16,
      color: '#888',
      marginTop: 4,
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
});
