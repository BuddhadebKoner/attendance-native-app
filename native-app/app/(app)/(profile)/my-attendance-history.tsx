import React, { useEffect, useState } from 'react';
import {
   View,
   Text,
   StyleSheet,
   FlatList,
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
import type { MyAttendance } from '@/types/api';

export default function MyAttendanceHistoryScreen() {
   const [loading, setLoading] = useState(true);
   const [refreshing, setRefreshing] = useState(false);
   const [attendances, setAttendances] = useState<MyAttendance[]>([]);
   const [currentPage, setCurrentPage] = useState(1);
   const [totalPages, setTotalPages] = useState(1);
   const [hasNextPage, setHasNextPage] = useState(false);
   const [hasPrevPage, setHasPrevPage] = useState(false);

   const fetchAttendances = async (page: number) => {
      try {
         const response = await attendanceApi.getMyAttendances({ page, limit: 10 });
         if (response.success && response.data) {
            setAttendances(response.data.attendances);
            setCurrentPage(response.data.pagination.currentPage);
            setTotalPages(response.data.pagination.totalPages);
            setHasNextPage(response.data.pagination.hasNextPage);
            setHasPrevPage(response.data.pagination.hasPrevPage);
         }
      } catch (error: any) {
         console.error('Failed to fetch attendances:', error);
         Alert.alert('Error', error.response?.data?.message || 'Failed to load attendance history');
      } finally {
         setLoading(false);
         setRefreshing(false);
      }
   };

   const onRefresh = () => {
      setRefreshing(true);
      fetchAttendances(currentPage);
   };

   useEffect(() => {
      fetchAttendances(1);
   }, []);

   const getStatusColor = (status: string) => {
      switch (status) {
         case 'present':
            return '#10b981';
         case 'absent':
            return '#ef4444';
         case 'late':
            return '#f59e0b';
         case 'excused':
            return '#8b5cf6';
         default:
            return theme.colors.textSecondary;
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
         month: 'short',
         day: 'numeric',
         year: 'numeric',
      });
   };

   const renderAttendanceItem = ({ item }: { item: MyAttendance }) => (
      <TouchableOpacity
         style={styles.attendanceCard}
         onPress={() => router.push(`/(app)/(home)/attendance/${item._id}`)}
      >
         <View style={styles.cardHeader}>
            <View style={styles.cardLeft}>
               <Ionicons
                  name={item.attendanceType === 'quick' ? 'flash' : 'calendar'}
                  size={20}
                  color="#10b981"
               />
               <View style={styles.cardInfo}>
                  <Text style={styles.className}>{item.class.className}</Text>
                  <Text style={styles.subject}>{item.class.subject}</Text>
               </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.myStatus) }]}>
               <Ionicons name={getStatusIcon(item.myStatus)} size={16} color="#fff" />
               <Text style={styles.statusText}>{item.myStatus}</Text>
            </View>
         </View>

         <View style={styles.cardFooter}>
            <View style={styles.footerItem}>
               <Ionicons name="calendar-outline" size={14} color="#888" />
               <Text style={styles.footerText}>{formatDate(item.attendanceDate)}</Text>
            </View>
            {item.markedAt && (
               <View style={styles.footerItem}>
                  <Ionicons name="time-outline" size={14} color="#888" />
                  <Text style={styles.footerText}>
                     Marked at {new Date(item.markedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
               </View>
            )}
         </View>

         {item.notes && (
            <View style={styles.notesContainer}>
               <Ionicons name="document-text-outline" size={14} color="#888" />
               <Text style={styles.notesText} numberOfLines={2}>
                  {item.notes}
               </Text>
            </View>
         )}
      </TouchableOpacity>
   );

   const renderPagination = () => {
      if (totalPages <= 1) return null;

      return (
         <View style={styles.pagination}>
            <TouchableOpacity
               style={[styles.paginationButton, !hasPrevPage && styles.paginationButtonDisabled]}
               disabled={!hasPrevPage}
               onPress={() => {
                  setLoading(true);
                  fetchAttendances(currentPage - 1);
               }}
            >
               <Ionicons
                  name="chevron-back"
                  size={20}
                  color={hasPrevPage ? '#10b981' : '#888'}
               />
               <Text style={[styles.paginationText, !hasPrevPage && styles.paginationTextDisabled]}>
                  Previous
               </Text>
            </TouchableOpacity>

            <Text style={styles.pageInfo}>
               Page {currentPage} of {totalPages}
            </Text>

            <TouchableOpacity
               style={[styles.paginationButton, !hasNextPage && styles.paginationButtonDisabled]}
               disabled={!hasNextPage}
               onPress={() => {
                  setLoading(true);
                  fetchAttendances(currentPage + 1);
               }}
            >
               <Text style={[styles.paginationText, !hasNextPage && styles.paginationTextDisabled]}>Next</Text>
               <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={hasNextPage ? '#10b981' : '#888'}
               />
            </TouchableOpacity>
         </View>
      );
   };

   if (loading && !refreshing) {
      return (
         <SafeAreaView style={styles.container}>
            <View style={styles.loadingContainer}>
               <ActivityIndicator size="large" color={theme.colors.primary} />
               <Text style={styles.loadingText}>Loading history...</Text>
            </View>
         </SafeAreaView>
      );
   }

   return (
      <SafeAreaView style={styles.container}>
         <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
               <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.title}>My Attendance History</Text>
            <View style={styles.backButton} />
         </View>

         <FlatList
            data={attendances}
            renderItem={renderAttendanceItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
               <View style={styles.emptyContainer}>
                  <Ionicons name="calendar-outline" size={64} color="#888" />
                  <Text style={styles.emptyText}>No attendance records yet</Text>
                  <Text style={styles.emptySubtext}>
                     Your attendance records will appear here once your teacher marks you
                  </Text>
               </View>
            }
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListFooterComponent={renderPagination}
         />
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: '#000000',
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
   listContent: {
      padding: 16,
   },
   attendanceCard: {
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#333',
   },
   cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
   },
   cardLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
   },
   cardInfo: {
      marginLeft: 12,
      flex: 1,
   },
   className: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 4,
   },
   subject: {
      fontSize: 14,
      color: '#888',
   },
   statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      gap: 4,
   },
   statusText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'capitalize',
   },
   cardFooter: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 8,
   },
   footerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
   },
   footerText: {
      fontSize: 12,
      color: '#888',
   },
   notesContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      marginTop: 8,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#333',
   },
   notesText: {
      flex: 1,
      fontSize: 12,
      color: '#888',
      fontStyle: 'italic',
   },
   emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 64,
   },
   emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#ffffff',
      marginTop: 16,
   },
   emptySubtext: {
      fontSize: 14,
      color: '#888',
      textAlign: 'center',
      marginTop: 8,
      paddingHorizontal: 32,
   },
   pagination: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      marginTop: 8,
   },
   paginationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: '#1a1a1a',
      borderWidth: 1,
      borderColor: '#333',
      gap: 4,
   },
   paginationButtonDisabled: {
      opacity: 0.5,
   },
   paginationText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#10b981',
   },
   paginationTextDisabled: {
      color: '#888',
   },
   pageInfo: {
      fontSize: 14,
      color: '#ffffff',
      fontWeight: '600',
   },
});
