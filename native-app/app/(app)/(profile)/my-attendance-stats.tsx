import React, { useState, useCallback, useEffect } from 'react';
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   TouchableOpacity,
   ActivityIndicator,
   RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStudentSummary } from '@/hooks/queries';
import type { ClassSummary } from '@/types/api';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function MyAttendanceStatsScreen() {
   const { requireAuth, isAuthenticated } = useRequireAuth();
   const [classPage, setClassPage] = useState(1);
   const classLimit = 10;
   const { data: summaryData, isLoading: loading, refetch } = useStudentSummary({ page: classPage, limit: classLimit });
   const overallStats = summaryData?.overallStats ?? null;
   const classSummaries = summaryData?.classSummaries ?? [];
   const totalClasses = summaryData?.totalClasses ?? 0;
   const pagination = summaryData?.pagination ?? null;

   const [refreshing, setRefreshing] = useState(false);

   useEffect(() => {
      if (!isAuthenticated) {
         requireAuth();
         return;
      }
   }, [isAuthenticated]);

   const onRefresh = useCallback(async () => {
      setRefreshing(true);
      try {
         await refetch();
      } finally {
         setRefreshing(false);
      }
   }, [refetch]);

   const getPercentageColor = (pct: number) => {
      if (pct >= 75) return '#10b981';
      if (pct >= 50) return '#f59e0b';
      return '#ef4444';
   };

   // --- Stat breakdown config ---
   const breakdownItems = overallStats
      ? [
         { label: 'Present', value: overallStats.totalPresent, color: '#10b981', icon: 'checkmark-circle' as const },
         { label: 'Absent', value: overallStats.totalAbsent, color: '#ef4444', icon: 'close-circle' as const },
         { label: 'Late', value: overallStats.totalLate, color: '#f59e0b', icon: 'time' as const },
         { label: 'Excused', value: overallStats.totalExcused, color: '#8b5cf6', icon: 'information-circle' as const },
      ]
      : [];

   const totalSessions = overallStats?.totalAttendanceSessions ?? 0;

   // --- Loading ---
   if (loading) {
      return (
         <SafeAreaView style={styles.container}>
            <View style={styles.loadingContainer}>
               <ActivityIndicator size="large" color="#10b981" />
               <Text style={styles.loadingText}>Loading statistics...</Text>
            </View>
         </SafeAreaView>
      );
   }

   // --- Class card renderer ---
   const renderClassCard = (cls: ClassSummary) => {
      const pctColor = getPercentageColor(cls.attendancePercentage);
      const barWidth = cls.totalSessions > 0 ? (cls.present / cls.totalSessions) * 100 : 0;

      return (
         <TouchableOpacity
            key={cls.classId}
            style={styles.classCard}
            activeOpacity={0.7}
            onPress={() =>
               router.push({
                  pathname: '/(app)/(profile)/class-attendance',
                  params: { classId: cls.classId },
               } as any)
            }
         >
            <View style={styles.classCardTop}>
               <View style={styles.classCardInfo}>
                  <Text style={styles.classCardName} numberOfLines={1}>{cls.className}</Text>
                  <Text style={styles.classCardSubject}>{cls.subject}</Text>
               </View>
               <View style={[styles.classPercentageBadge, { backgroundColor: `${pctColor}18` }]}>
                  <Text style={[styles.classPercentageText, { color: pctColor }]}>
                     {cls.attendancePercentage}%
                  </Text>
               </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBarBg}>
               <View style={[styles.progressBarFill, { width: `${barWidth}%`, backgroundColor: pctColor }]} />
            </View>

            {/* Mini stats row */}
            <View style={styles.classStatsRow}>
               <View style={styles.classMiniStat}>
                  <View style={[styles.miniDot, { backgroundColor: '#10b981' }]} />
                  <Text style={styles.miniStatText}>{cls.present}</Text>
               </View>
               <View style={styles.classMiniStat}>
                  <View style={[styles.miniDot, { backgroundColor: '#ef4444' }]} />
                  <Text style={styles.miniStatText}>{cls.absent}</Text>
               </View>
               <View style={styles.classMiniStat}>
                  <View style={[styles.miniDot, { backgroundColor: '#f59e0b' }]} />
                  <Text style={styles.miniStatText}>{cls.late}</Text>
               </View>
               <View style={styles.classMiniStat}>
                  <View style={[styles.miniDot, { backgroundColor: '#8b5cf6' }]} />
                  <Text style={styles.miniStatText}>{cls.excused}</Text>
               </View>
               <Text style={styles.sessionCountText}>{cls.totalSessions} sessions</Text>
            </View>

            {/* Chevron */}
            <View style={styles.classCardChevron}>
               <Ionicons name="chevron-forward" size={16} color="#555" />
            </View>
         </TouchableOpacity>
      );
   };

   return (
      <SafeAreaView style={styles.container}>
         <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
               <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
            }
         >
            {/* Header */}
            <View style={styles.header}>
               <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                  <Ionicons name="arrow-back" size={24} color="#ffffff" />
               </TouchableOpacity>
               <Text style={styles.headerTitle}>Attendance Statistics</Text>
               <View style={styles.headerButton} />
            </View>

            {overallStats && (
               <>
                  {/* ─── Hero Card: Percentage Ring + Top Stats ─── */}
                  <View style={styles.heroCard}>
                     {/* Percentage ring */}
                     <View style={[
                        styles.percentageRing,
                        { borderColor: getPercentageColor(overallStats.attendancePercentage) },
                     ]}>
                        <Text style={[
                           styles.percentageValue,
                           { color: getPercentageColor(overallStats.attendancePercentage) },
                        ]}>
                           {overallStats.attendancePercentage}%
                        </Text>
                        <Text style={styles.percentageLabel}>Attendance</Text>
                     </View>

                     {/* Summary pills */}
                     <View style={styles.heroPills}>
                        <View style={styles.heroPill}>
                           <Ionicons name="school-outline" size={16} color="#10b981" />
                           <Text style={styles.heroPillValue}>{totalClasses}</Text>
                           <Text style={styles.heroPillLabel}>Classes</Text>
                        </View>
                        <View style={styles.heroPillDivider} />
                        <View style={styles.heroPill}>
                           <Ionicons name="layers-outline" size={16} color="#10b981" />
                           <Text style={styles.heroPillValue}>{totalSessions}</Text>
                           <Text style={styles.heroPillLabel}>Sessions</Text>
                        </View>
                     </View>
                  </View>

                  {/* ─── Breakdown Card ─── */}
                  <View style={styles.card}>
                     <Text style={styles.sectionTitle}>Breakdown</Text>
                     {breakdownItems.map((item) => {
                        const pct = totalSessions > 0 ? (item.value / totalSessions) * 100 : 0;
                        return (
                           <View key={item.label} style={styles.breakdownRow}>
                              <View style={styles.breakdownLeft}>
                                 <Ionicons name={item.icon} size={20} color={item.color} />
                                 <Text style={styles.breakdownLabel}>{item.label}</Text>
                              </View>
                              <View style={styles.breakdownRight}>
                                 <View style={styles.breakdownBarBg}>
                                    <View
                                       style={[
                                          styles.breakdownBarFill,
                                          { width: `${pct}%`, backgroundColor: item.color },
                                       ]}
                                    />
                                 </View>
                                 <Text style={[styles.breakdownValue, { color: item.color }]}>
                                    {item.value}
                                 </Text>
                              </View>
                           </View>
                        );
                     })}
                  </View>

                  {/* ─── Per-Class Cards ─── */}
                  {classSummaries.length > 0 && (
                     <View style={styles.classSection}>
                        <Text style={styles.sectionTitle}>By Class</Text>
                        {classSummaries.map(renderClassCard)}

                        {/* Pagination Controls */}
                        {pagination && pagination.totalPages > 1 && (
                           <View style={styles.paginationRow}>
                              <TouchableOpacity
                                 style={[
                                    styles.paginationButton,
                                    !pagination.hasPrevPage && styles.paginationButtonDisabled,
                                 ]}
                                 onPress={() => setClassPage((p) => p - 1)}
                                 disabled={!pagination.hasPrevPage}
                              >
                                 <Ionicons
                                    name="chevron-back"
                                    size={18}
                                    color={pagination.hasPrevPage ? '#fff' : '#555'}
                                 />
                                 <Text
                                    style={[
                                       styles.paginationButtonText,
                                       !pagination.hasPrevPage && { color: '#555' },
                                    ]}
                                 >
                                    Previous
                                 </Text>
                              </TouchableOpacity>
                              <Text style={styles.paginationInfo}>
                                 {pagination.currentPage} / {pagination.totalPages}
                              </Text>
                              <TouchableOpacity
                                 style={[
                                    styles.paginationButton,
                                    !pagination.hasNextPage && styles.paginationButtonDisabled,
                                 ]}
                                 onPress={() => setClassPage((p) => p + 1)}
                                 disabled={!pagination.hasNextPage}
                              >
                                 <Text
                                    style={[
                                       styles.paginationButtonText,
                                       !pagination.hasNextPage && { color: '#555' },
                                    ]}
                                 >
                                    Next
                                 </Text>
                                 <Ionicons
                                    name="chevron-forward"
                                    size={18}
                                    color={pagination.hasNextPage ? '#fff' : '#555'}
                                 />
                              </TouchableOpacity>
                           </View>
                        )}
                     </View>
                  )}

                  {/* ─── View History CTA ─── */}
                  <TouchableOpacity
                     style={styles.historyButton}
                     onPress={() => router.push('/(app)/(profile)/my-attendance-history')}
                  >
                     <Ionicons name="time-outline" size={20} color="#fff" />
                     <Text style={styles.historyButtonText}>View Full History</Text>
                     <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
                  </TouchableOpacity>

                  <View style={{ height: 32 }} />
               </>
            )}

            {!overallStats && !loading && (
               <View style={styles.emptyContainer}>
                  <Ionicons name="stats-chart-outline" size={64} color="#555" />
                  <Text style={styles.emptyText}>No Statistics Yet</Text>
                  <Text style={styles.emptySubtext}>
                     Your attendance statistics will appear here once your teachers start taking attendance.
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

   // Header
   header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#1a1a1a',
   },
   headerButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
   },
   headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#ffffff',
   },

   // Hero card
   heroCard: {
      backgroundColor: '#1a1a1a',
      margin: 16,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#282828',
   },
   percentageRing: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 5,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
   },
   percentageValue: {
      fontSize: 34,
      fontWeight: 'bold',
   },
   percentageLabel: {
      fontSize: 12,
      color: '#888',
      marginTop: -2,
   },
   heroPills: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#111',
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 24,
   },
   heroPill: {
      alignItems: 'center',
      gap: 2,
      minWidth: 70,
   },
   heroPillValue: {
      fontSize: 22,
      fontWeight: '700',
      color: '#ffffff',
   },
   heroPillLabel: {
      fontSize: 12,
      color: '#777',
   },
   heroPillDivider: {
      width: 1,
      height: 36,
      backgroundColor: '#333',
      marginHorizontal: 20,
   },

   // Shared card
   card: {
      backgroundColor: '#1a1a1a',
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 16,
      padding: 18,
      borderWidth: 1,
      borderColor: '#282828',
   },
   sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: 14,
      marginHorizontal: 16,
   },

   // Breakdown
   breakdownRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
   },
   breakdownLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      width: 100,
   },
   breakdownLabel: {
      fontSize: 15,
      color: '#ddd',
   },
   breakdownRight: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
   },
   breakdownBarBg: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#282828',
      overflow: 'hidden',
   },
   breakdownBarFill: {
      height: 8,
      borderRadius: 4,
   },
   breakdownValue: {
      fontSize: 16,
      fontWeight: '700',
      width: 32,
      textAlign: 'right',
   },

   // Class section
   classSection: {
      marginBottom: 8,
   },
   classCard: {
      backgroundColor: '#1a1a1a',
      marginHorizontal: 16,
      marginBottom: 10,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: '#282828',
      position: 'relative',
   },
   classCardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
   },
   classCardInfo: {
      flex: 1,
      marginRight: 12,
   },
   classCardName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 2,
   },
   classCardSubject: {
      fontSize: 13,
      color: '#777',
   },
   classPercentageBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
   },
   classPercentageText: {
      fontSize: 16,
      fontWeight: '800',
   },

   // Progress bar
   progressBarBg: {
      height: 6,
      borderRadius: 3,
      backgroundColor: '#282828',
      overflow: 'hidden',
      marginBottom: 10,
   },
   progressBarFill: {
      height: 6,
      borderRadius: 3,
   },

   // Mini stats row
   classStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
   },
   classMiniStat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
   },
   miniDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
   },
   miniStatText: {
      fontSize: 13,
      color: '#aaa',
      fontWeight: '600',
   },
   sessionCountText: {
      fontSize: 12,
      color: '#555',
      marginLeft: 'auto',
   },
   classCardChevron: {
      position: 'absolute',
      right: 16,
      top: 20,
   },

   // Pagination
   paginationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#1a1a1a',
   },
   paginationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: '#1a1a1a',
   },
   paginationButtonDisabled: {
      opacity: 0.5,
   },
   paginationButtonText: {
      fontSize: 13,
      color: '#fff',
      fontWeight: '600',
   },
   paginationInfo: {
      fontSize: 13,
      color: '#888',
      fontWeight: '600',
   },

   // History button
   historyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#10b981',
      paddingVertical: 15,
      paddingHorizontal: 24,
      borderRadius: 14,
      marginHorizontal: 16,
      gap: 8,
   },
   historyButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
      textAlign: 'center',
   },

   // Empty state
   emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
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
