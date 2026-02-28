import React, { useState, useCallback } from 'react';
import {
   View,
   Text,
   StyleSheet,
   FlatList,
   TouchableOpacity,
   ActivityIndicator,
   RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMyClassAttendance } from '@/hooks/queries';
import type { MyAttendanceRecord } from '@/types/api';

export default function ClassAttendanceScreen() {
   const { classId } = useLocalSearchParams<{ classId: string }>();
   const [currentPage, setCurrentPage] = useState(1);
   const [refreshing, setRefreshing] = useState(false);

   const { data, isLoading, refetch } = useMyClassAttendance(
      classId ?? '',
      { page: currentPage, limit: 15 },
      !!classId
   );

   const classInfo = data?.class ?? null;
   const records = data?.attendanceRecords ?? [];
   const stats = data?.statistics ?? null;
   const pagination = data?.pagination ?? null;

   const onRefresh = useCallback(async () => {
      setRefreshing(true);
      try {
         await refetch();
      } finally {
         setRefreshing(false);
      }
   }, [refetch]);

   const getStatusColor = (status: string) => {
      switch (status) {
         case 'present': return '#10b981';
         case 'absent': return '#ef4444';
         case 'late': return '#f59e0b';
         case 'excused': return '#8b5cf6';
         default: return '#888';
      }
   };

   const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
      switch (status) {
         case 'present': return 'checkmark-circle';
         case 'absent': return 'close-circle';
         case 'late': return 'time';
         case 'excused': return 'information-circle';
         default: return 'help-circle';
      }
   };

   const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
         month: 'short',
         day: 'numeric',
         year: 'numeric',
      });
   };

   const formatTime = (dateString: string) => {
      return new Date(dateString).toLocaleTimeString('en-US', {
         hour: '2-digit',
         minute: '2-digit',
      });
   };

   // --- Stats Card ---
   const renderStatsCard = () => {
      if (!stats) return null;

      const statItems = [
         { label: 'Present', value: stats.present, color: '#10b981', icon: 'checkmark-circle' as const },
         { label: 'Absent', value: stats.absent, color: '#ef4444', icon: 'close-circle' as const },
         { label: 'Late', value: stats.late, color: '#f59e0b', icon: 'time' as const },
         { label: 'Excused', value: stats.excused, color: '#8b5cf6', icon: 'information-circle' as const },
      ];

      return (
         <View style={styles.statsCard}>
            {/* Percentage ring */}
            <View style={styles.percentageContainer}>
               <View style={[
                  styles.percentageRing,
                  { borderColor: getStatusColor(stats.attendancePercentage >= 75 ? 'present' : stats.attendancePercentage >= 50 ? 'late' : 'absent') },
               ]}>
                  <Text style={styles.percentageValue}>{stats.attendancePercentage}%</Text>
                  <Text style={styles.percentageLabel}>Attendance</Text>
               </View>
               <Text style={styles.totalSessions}>
                  {stats.totalSessions} Total Session{stats.totalSessions !== 1 ? 's' : ''}
               </Text>
            </View>

            {/* Stat breakdown */}
            <View style={styles.statsGrid}>
               {statItems.map((item) => (
                  <View key={item.label} style={styles.statItem}>
                     <View style={styles.statIconRow}>
                        <Ionicons name={item.icon} size={18} color={item.color} />
                        <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
                     </View>
                     <Text style={styles.statLabel}>{item.label}</Text>
                  </View>
               ))}
            </View>
         </View>
      );
   };

   // --- Record Item ---
   const renderRecordItem = ({ item }: { item: MyAttendanceRecord }) => {
      const attendanceObj = typeof item.attendance === 'object' ? item.attendance : null;

      return (
         <View style={styles.recordCard}>
            <View style={styles.recordHeader}>
               <View style={styles.recordLeft}>
                  <Ionicons
                     name={attendanceObj?.attendanceType === 'quick' ? 'flash' : 'calendar'}
                     size={18}
                     color="#10b981"
                  />
                  <Text style={styles.recordDate}>
                     {attendanceObj?.attendanceDate
                        ? formatDate(attendanceObj.attendanceDate)
                        : formatDate(item.createdAt)}
                  </Text>
               </View>
               <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
                  <Ionicons name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
                  <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
                     {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
               </View>
            </View>

            <View style={styles.recordDetails}>
               {attendanceObj?.attendanceType && (
                  <View style={styles.detailItem}>
                     <Text style={styles.detailLabel}>Type</Text>
                     <Text style={styles.detailValue}>
                        {attendanceObj.attendanceType === 'quick' ? 'Quick' : 'Scheduled'}
                     </Text>
                  </View>
               )}
               {item.markedAt && (
                  <View style={styles.detailItem}>
                     <Text style={styles.detailLabel}>Marked at</Text>
                     <Text style={styles.detailValue}>{formatTime(item.markedAt)}</Text>
                  </View>
               )}
               {attendanceObj?.status && (
                  <View style={styles.detailItem}>
                     <Text style={styles.detailLabel}>Session</Text>
                     <Text style={styles.detailValue}>
                        {attendanceObj.status === 'completed' ? 'Completed' : 'In Progress'}
                     </Text>
                  </View>
               )}
            </View>

            {item.notes ? (
               <View style={styles.notesRow}>
                  <Ionicons name="document-text-outline" size={14} color="#888" />
                  <Text style={styles.notesText} numberOfLines={2}>{item.notes}</Text>
               </View>
            ) : null}
         </View>
      );
   };

   // --- Pagination ---
   const renderPagination = () => {
      if (!pagination || pagination.totalPages <= 1) return null;

      return (
         <View style={styles.pagination}>
            <TouchableOpacity
               style={[styles.paginationButton, !pagination.hasPrevPage && styles.paginationButtonDisabled]}
               disabled={!pagination.hasPrevPage}
               onPress={() => setCurrentPage((p) => p - 1)}
            >
               <Ionicons name="chevron-back" size={20} color={pagination.hasPrevPage ? '#10b981' : '#555'} />
               <Text style={[styles.paginationText, !pagination.hasPrevPage && styles.paginationTextDisabled]}>
                  Prev
               </Text>
            </TouchableOpacity>

            <Text style={styles.pageInfo}>
               Page {pagination.currentPage} of {pagination.totalPages}
            </Text>

            <TouchableOpacity
               style={[styles.paginationButton, !pagination.hasNextPage && styles.paginationButtonDisabled]}
               disabled={!pagination.hasNextPage}
               onPress={() => setCurrentPage((p) => p + 1)}
            >
               <Text style={[styles.paginationText, !pagination.hasNextPage && styles.paginationTextDisabled]}>
                  Next
               </Text>
               <Ionicons name="chevron-forward" size={20} color={pagination.hasNextPage ? '#10b981' : '#555'} />
            </TouchableOpacity>
         </View>
      );
   };

   // --- Loading ---
   if (isLoading && records.length === 0) {
      return (
         <SafeAreaView style={styles.container}>
            <View style={styles.loadingContainer}>
               <ActivityIndicator size="large" color="#10b981" />
               <Text style={styles.loadingText}>Loading attendance...</Text>
            </View>
         </SafeAreaView>
      );
   }

   return (
      <SafeAreaView style={styles.container}>
         {/* Header */}
         <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
               <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
               <Text style={styles.headerTitle} numberOfLines={1}>
                  {classInfo?.className ?? 'Class Attendance'}
               </Text>
               {classInfo?.subject ? (
                  <Text style={styles.headerSubtitle}>{classInfo.subject}</Text>
               ) : null}
            </View>
            <View style={styles.headerButton} />
         </View>

         <FlatList
            data={records}
            renderItem={renderRecordItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            refreshControl={
               <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
            }
            ListHeaderComponent={renderStatsCard}
            ListFooterComponent={renderPagination}
            ListEmptyComponent={
               <View style={styles.emptyContainer}>
                  <Ionicons name="calendar-outline" size={64} color="#555" />
                  <Text style={styles.emptyText}>No Attendance Records</Text>
                  <Text style={styles.emptySubtext}>
                     Your attendance records for this class will appear here once your teacher takes attendance.
                  </Text>
               </View>
            }
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

   // Header
   header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#222',
   },
   headerButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
   },
   headerCenter: {
      flex: 1,
      alignItems: 'center',
   },
   headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#ffffff',
   },
   headerSubtitle: {
      fontSize: 13,
      color: '#888',
      marginTop: 2,
   },

   listContent: {
      paddingBottom: 32,
   },

   // Stats card
   statsCard: {
      backgroundColor: '#1a1a1a',
      margin: 16,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: '#333',
   },
   percentageContainer: {
      alignItems: 'center',
      marginBottom: 20,
   },
   percentageRing: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 4,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
   },
   percentageValue: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#ffffff',
   },
   percentageLabel: {
      fontSize: 11,
      color: '#888',
      marginTop: -2,
   },
   totalSessions: {
      fontSize: 14,
      color: '#aaa',
   },
   statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
   },
   statItem: {
      alignItems: 'center',
      gap: 4,
   },
   statIconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
   },
   statValue: {
      fontSize: 18,
      fontWeight: '700',
   },
   statLabel: {
      fontSize: 12,
      color: '#888',
   },

   // Record card
   recordCard: {
      backgroundColor: '#1a1a1a',
      marginHorizontal: 16,
      marginBottom: 10,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: '#282828',
   },
   recordHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
   },
   recordLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
   },
   recordDate: {
      fontSize: 15,
      fontWeight: '600',
      color: '#ffffff',
   },
   statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
   },
   statusBadgeText: {
      fontSize: 12,
      fontWeight: '600',
   },
   recordDetails: {
      flexDirection: 'row',
      gap: 16,
   },
   detailItem: {
      gap: 2,
   },
   detailLabel: {
      fontSize: 11,
      color: '#666',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
   },
   detailValue: {
      fontSize: 13,
      color: '#ccc',
   },
   notesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#282828',
   },
   notesText: {
      flex: 1,
      fontSize: 13,
      color: '#888',
   },

   // Pagination
   pagination: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
   },
   paginationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: '#1a1a1a',
      borderWidth: 1,
      borderColor: '#333',
   },
   paginationButtonDisabled: {
      opacity: 0.4,
   },
   paginationText: {
      fontSize: 14,
      color: '#10b981',
   },
   paginationTextDisabled: {
      color: '#555',
   },
   pageInfo: {
      fontSize: 14,
      color: '#888',
   },

   // Empty
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
   },
   emptySubtext: {
      fontSize: 14,
      color: '#888',
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 20,
   },
});
