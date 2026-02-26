import React, { useEffect, useState } from 'react';
import {
   View,
   Text,
   StyleSheet,
   FlatList,
   TouchableOpacity,
   ActivityIndicator,
   RefreshControl,
   Alert,
   ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { attendanceApi } from '../../../services/attendance.api';
import type { Attendance, PaginationInfo } from '../../../types/api';
import { useRequireAuth } from '../../../hooks/useRequireAuth';

export default function AttendancesListScreen() {
   const { requireAuth, isAuthenticated } = useRequireAuth();
   const [attendances, setAttendances] = useState<Attendance[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [refreshing, setRefreshing] = useState(false);
   const [pagination, setPagination] = useState<PaginationInfo | null>(null);
   const [currentPage, setCurrentPage] = useState(1);
   const [selectedFilter, setSelectedFilter] = useState<'all' | 'quick' | 'scheduled'>('all');
   const [selectedStatus, setSelectedStatus] = useState<'all' | 'in-progress' | 'completed' | 'cancelled'>('all');

   useEffect(() => {
      if (!isAuthenticated) {
         requireAuth();
         return;
      }
   }, [isAuthenticated]);

   useEffect(() => {
      fetchAttendances();
   }, [currentPage, selectedFilter, selectedStatus]);

   const fetchAttendances = async () => {
      try {
         setIsLoading(true);
         const query: any = {
            page: currentPage,
            limit: 10,
         };

         if (selectedFilter !== 'all') {
            query.attendanceType = selectedFilter;
         }

         if (selectedStatus !== 'all') {
            query.status = selectedStatus;
         }

         const response = await attendanceApi.getAttendances(query);

         if (response.success && response.data) {
            setAttendances(response.data.attendances);
            setPagination(response.data.pagination);
         } else {
            Alert.alert('Error', response.message || 'Failed to fetch attendances');
         }
      } catch (error: any) {
         console.error('Fetch attendances error:', error);
         Alert.alert('Error', error?.response?.data?.message || 'Failed to fetch attendances');
      } finally {
         setIsLoading(false);
      }
   };

   const onRefresh = async () => {
      setRefreshing(true);
      setCurrentPage(1);
      await fetchAttendances();
      setRefreshing(false);
   };

   const handleNextPage = () => {
      if (pagination?.hasNextPage) {
         setCurrentPage(currentPage + 1);
      }
   };

   const handlePrevPage = () => {
      if (pagination?.hasPrevPage) {
         setCurrentPage(currentPage - 1);
      }
   };

   const getStatusColor = (status: string) => {
      switch (status) {
         case 'completed':
            return '#4CAF50';
         case 'in-progress':
            return '#2196F3';
         case 'cancelled':
            return '#F44336';
         default:
            return '#888';
      }
   };

   const getTypeIcon = (type: string) => {
      return type === 'quick' ? 'flash' : 'calendar';
   };

   const getTypeColor = (type: string) => {
      return type === 'quick' ? '#4CAF50' : '#2196F3';
   };

   const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
         month: 'short',
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

   const renderAttendanceItem = ({ item }: { item: Attendance }) => {
      const classInfo = typeof item.class === 'object' ? item.class : null;

      return (
         <TouchableOpacity
            style={styles.attendanceCard}
            onPress={() => router.push(`/(app)/(home)/attendance/${item._id}`)}
         >
            <View style={styles.cardHeader}>
               <View style={styles.typeContainer}>
                  <Ionicons
                     name={getTypeIcon(item.attendanceType)}
                     size={20}
                     color={getTypeColor(item.attendanceType)}
                  />
                  <Text style={[styles.typeText, { color: getTypeColor(item.attendanceType) }]}>
                     {item.attendanceType === 'quick' ? 'Quick' : 'Scheduled'}
                  </Text>
               </View>
               <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                     {item.status}
                  </Text>
               </View>
            </View>

            <Text style={styles.className} numberOfLines={1}>
               {classInfo?.className || 'Class'}
            </Text>
            {classInfo?.subject && (
               <Text style={styles.subject} numberOfLines={1}>
                  {classInfo.subject}
               </Text>
            )}

            <View style={styles.statsContainer}>
               <View style={styles.statItem}>
                  <Ionicons name="people" size={16} color="#888" />
                  <Text style={styles.statText}>{item.totalStudents} students</Text>
               </View>
               <View style={styles.statItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.statText}>{item.totalPresent} present</Text>
               </View>
               <View style={styles.statItem}>
                  <Ionicons name="close-circle" size={16} color="#F44336" />
                  <Text style={styles.statText}>{item.totalAbsent} absent</Text>
               </View>
            </View>

            <View style={styles.cardFooter}>
               <View style={styles.dateInfo}>
                  <Ionicons name="calendar-outline" size={14} color="#888" />
                  <Text style={styles.dateText}>{formatDate(item.attendanceDate)}</Text>
               </View>
               <View style={styles.dateInfo}>
                  <Ionicons name="time-outline" size={14} color="#888" />
                  <Text style={styles.dateText}>{formatTime(item.startedAt)}</Text>
               </View>
               {item.attendancePercentage !== undefined && (
                  <Text style={styles.percentageText}>{item.attendancePercentage}%</Text>
               )}
            </View>
         </TouchableOpacity>
      );
   };

   const renderFilters = () => (
      <View style={styles.filtersContainer}>
         <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
               style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipActive]}
               onPress={() => {
                  setSelectedFilter('all');
                  setCurrentPage(1);
               }}
            >
               <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
                  All
               </Text>
            </TouchableOpacity>

            <TouchableOpacity
               style={[styles.filterChip, selectedFilter === 'quick' && styles.filterChipActive]}
               onPress={() => {
                  setSelectedFilter('quick');
                  setCurrentPage(1);
               }}
            >
               <Ionicons name="flash" size={16} color={selectedFilter === 'quick' ? '#ffffff' : '#888'} />
               <Text style={[styles.filterText, selectedFilter === 'quick' && styles.filterTextActive]}>
                  Quick
               </Text>
            </TouchableOpacity>

            <TouchableOpacity
               style={[styles.filterChip, selectedFilter === 'scheduled' && styles.filterChipActive]}
               onPress={() => {
                  setSelectedFilter('scheduled');
                  setCurrentPage(1);
               }}
            >
               <Ionicons name="calendar" size={16} color={selectedFilter === 'scheduled' ? '#ffffff' : '#888'} />
               <Text style={[styles.filterText, selectedFilter === 'scheduled' && styles.filterTextActive]}>
                  Scheduled
               </Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
               style={[styles.filterChip, selectedStatus === 'all' && styles.filterChipActive]}
               onPress={() => {
                  setSelectedStatus('all');
                  setCurrentPage(1);
               }}
            >
               <Text style={[styles.filterText, selectedStatus === 'all' && styles.filterTextActive]}>
                  All Status
               </Text>
            </TouchableOpacity>

            <TouchableOpacity
               style={[styles.filterChip, selectedStatus === 'in-progress' && styles.filterChipActive]}
               onPress={() => {
                  setSelectedStatus('in-progress');
                  setCurrentPage(1);
               }}
            >
               <Text style={[styles.filterText, selectedStatus === 'in-progress' && styles.filterTextActive]}>
                  In Progress
               </Text>
            </TouchableOpacity>

            <TouchableOpacity
               style={[styles.filterChip, selectedStatus === 'completed' && styles.filterChipActive]}
               onPress={() => {
                  setSelectedStatus('completed');
                  setCurrentPage(1);
               }}
            >
               <Text style={[styles.filterText, selectedStatus === 'completed' && styles.filterTextActive]}>
                  Completed
               </Text>
            </TouchableOpacity>
         </ScrollView>
      </View>
   );

   const renderEmptyState = () => (
      <View style={styles.emptyContainer}>
         <Ionicons name="calendar-outline" size={80} color="#333" />
         <Text style={styles.emptyTitle}>No Attendances Found</Text>
         <Text style={styles.emptyText}>
            {selectedFilter !== 'all' || selectedStatus !== 'all'
               ? 'Try adjusting your filters'
               : 'Start taking attendance for your classes'}
         </Text>
      </View>
   );

   return (
      <SafeAreaView style={styles.container}>
         <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
               <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Attendances</Text>
            <View style={styles.placeholder} />
         </View>

         {renderFilters()}

         {isLoading ? (
            <View style={styles.loadingContainer}>
               <ActivityIndicator size="large" color="#ffffff" />
               <Text style={styles.loadingText}>Loading attendances...</Text>
            </View>
         ) : (
            <>
               <FlatList
                  data={attendances}
                  keyExtractor={(item) => item._id}
                  renderItem={renderAttendanceItem}
                  contentContainerStyle={[
                     styles.listContainer,
                     attendances.length === 0 && styles.emptyListContainer,
                  ]}
                  ListEmptyComponent={renderEmptyState}
                  refreshControl={
                     <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                  }
               />

               {pagination && attendances.length > 0 && (
                  <View style={styles.paginationContainer}>
                     <TouchableOpacity
                        style={[styles.pageButton, !pagination.hasPrevPage && styles.pageButtonDisabled]}
                        onPress={handlePrevPage}
                        disabled={!pagination.hasPrevPage}
                     >
                        <Ionicons
                           name="chevron-back"
                           size={20}
                           color={pagination.hasPrevPage ? '#ffffff' : '#555'}
                        />
                        <Text
                           style={[styles.pageButtonText, !pagination.hasPrevPage && styles.pageButtonTextDisabled]}
                        >
                           Previous
                        </Text>
                     </TouchableOpacity>

                     <Text style={styles.pageInfo}>
                        Page {pagination.currentPage} of {pagination.totalPages}
                     </Text>

                     <TouchableOpacity
                        style={[styles.pageButton, !pagination.hasNextPage && styles.pageButtonDisabled]}
                        onPress={handleNextPage}
                        disabled={!pagination.hasNextPage}
                     >
                        <Text
                           style={[styles.pageButtonText, !pagination.hasNextPage && styles.pageButtonTextDisabled]}
                        >
                           Next
                        </Text>
                        <Ionicons
                           name="chevron-forward"
                           size={20}
                           color={pagination.hasNextPage ? '#ffffff' : '#555'}
                        />
                     </TouchableOpacity>
                  </View>
               )}
            </>
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
   backButton: {
      padding: 4,
   },
   headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#ffffff',
   },
   placeholder: {
      width: 32,
   },
   filtersContainer: {
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#1a1a1a',
   },
   filterScroll: {
      paddingHorizontal: 20,
   },
   filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: '#1a1a1a',
      marginRight: 8,
      gap: 6,
   },
   filterChipActive: {
      backgroundColor: '#ffffff',
   },
   filterText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#888',
   },
   filterTextActive: {
      color: '#000000',
   },
   divider: {
      width: 1,
      height: 24,
      backgroundColor: '#333',
      marginHorizontal: 8,
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
   listContainer: {
      padding: 20,
   },
   emptyListContainer: {
      flex: 1,
      justifyContent: 'center',
   },
   attendanceCard: {
      backgroundColor: '#1a1a1a',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#2a2a2a',
   },
   cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
   },
   typeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
   },
   typeText: {
      fontSize: 14,
      fontWeight: '600',
   },
   statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
   },
   statusText: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'capitalize',
   },
   className: {
      fontSize: 18,
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: 4,
   },
   subject: {
      fontSize: 14,
      color: '#888',
      marginBottom: 12,
   },
   statsContainer: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 12,
   },
   statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
   },
   statText: {
      fontSize: 13,
      color: '#888',
   },
   cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#2a2a2a',
   },
   dateInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
   },
   dateText: {
      fontSize: 12,
      color: '#888',
   },
   percentageText: {
      marginLeft: 'auto',
      fontSize: 16,
      fontWeight: '700',
      color: '#4CAF50',
   },
   emptyContainer: {
      alignItems: 'center',
      paddingVertical: 60,
   },
   emptyTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#ffffff',
      marginTop: 16,
      marginBottom: 8,
   },
   emptyText: {
      fontSize: 14,
      color: '#888',
      textAlign: 'center',
   },
   paginationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: '#1a1a1a',
   },
   pageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: '#1a1a1a',
      gap: 4,
   },
   pageButtonDisabled: {
      opacity: 0.3,
   },
   pageButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#ffffff',
   },
   pageButtonTextDisabled: {
      color: '#555',
   },
   pageInfo: {
      fontSize: 14,
      color: '#888',
   },
});
