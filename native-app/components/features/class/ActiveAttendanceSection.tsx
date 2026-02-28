import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ActiveAttendance, PaginationInfo } from '../../../types/api';
import { PaginationControls } from './PaginationControls';

interface ActiveAttendanceSectionProps {
   attendances: ActiveAttendance[];
   pagination?: PaginationInfo;
   onNextPage: () => void;
   onPrevPage: () => void;
}

function formatDate(dateStr: string): string {
   const date = new Date(dateStr);
   return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
   });
}

function formatTime(dateStr: string): string {
   const date = new Date(dateStr);
   return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
   });
}

function getStatusBadge(myStatus: ActiveAttendance['myStatus']) {
   if (!myStatus) {
      return { label: 'Not Marked', color: '#666', bg: '#1a1a1a' };
   }
   switch (myStatus) {
      case 'present':
         return { label: 'Present', color: '#4ade80', bg: '#052e16' };
      case 'absent':
         return { label: 'Absent', color: '#f87171', bg: '#2a0a0a' };
      case 'late':
         return { label: 'Late', color: '#fbbf24', bg: '#2a1f04' };
      case 'excused':
         return { label: 'Excused', color: '#60a5fa', bg: '#0a1a2a' };
      default:
         return { label: myStatus, color: '#888', bg: '#1a1a1a' };
   }
}

function getTypeChip(type: 'quick' | 'scheduled') {
   if (type === 'scheduled') {
      return { label: 'Scheduled', icon: 'calendar-outline' as const, color: '#a78bfa' };
   }
   return { label: 'Quick', icon: 'flash-outline' as const, color: '#fbbf24' };
}

export const ActiveAttendanceSection: React.FC<ActiveAttendanceSectionProps> = ({
   attendances,
   pagination,
   onNextPage,
   onPrevPage,
}) => {
   if (!attendances || attendances.length === 0) {
      return (
         <View style={styles.container}>
            <View style={styles.headerRow}>
               <Ionicons name="pulse-outline" size={20} color="#60a5fa" />
               <Text style={styles.headerText}>Active Sessions</Text>
            </View>
            <View style={styles.emptyContainer}>
               <Ionicons name="checkmark-circle-outline" size={40} color="#333" />
               <Text style={styles.emptyText}>No active attendance sessions</Text>
            </View>
         </View>
      );
   }

   return (
      <View style={styles.container}>
         <View style={styles.headerRow}>
            <Ionicons name="pulse-outline" size={20} color="#60a5fa" />
            <Text style={styles.headerText}>Active Sessions</Text>
            <View style={styles.countBadge}>
               <Text style={styles.countText}>{pagination?.totalAttendances ?? attendances.length}</Text>
            </View>
         </View>

         {attendances.map((attendance) => {
            const typeChip = getTypeChip(attendance.attendanceType);
            const statusBadge = getStatusBadge(attendance.myStatus);
            const teacherName =
               typeof attendance.takenBy === 'object' ? attendance.takenBy.name : 'Teacher';

            return (
               <View key={attendance._id} style={styles.card}>
                  {/* Top row: type chip + status badge */}
                  <View style={styles.cardTopRow}>
                     <View style={[styles.typeChip, { borderColor: typeChip.color }]}>
                        <Ionicons name={typeChip.icon} size={14} color={typeChip.color} />
                        <Text style={[styles.typeChipText, { color: typeChip.color }]}>
                           {typeChip.label}
                        </Text>
                     </View>
                     <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>
                           {statusBadge.label}
                        </Text>
                     </View>
                  </View>

                  {/* Date & time */}
                  <View style={styles.infoRow}>
                     <Ionicons name="calendar-outline" size={14} color="#888" />
                     <Text style={styles.infoText}>
                        {formatDate(attendance.attendanceDate)}
                     </Text>
                     <Ionicons name="time-outline" size={14} color="#888" style={{ marginLeft: 12 }} />
                     <Text style={styles.infoText}>
                        {formatTime(attendance.attendanceDate)}
                     </Text>
                  </View>

                  {/* Scheduled for (if applicable) */}
                  {attendance.scheduledFor && (
                     <View style={styles.infoRow}>
                        <Ionicons name="alarm-outline" size={14} color="#a78bfa" />
                        <Text style={[styles.infoText, { color: '#a78bfa' }]}>
                           Scheduled for {formatDate(attendance.scheduledFor)} at {formatTime(attendance.scheduledFor)}
                        </Text>
                     </View>
                  )}

                  {/* Teacher */}
                  <View style={styles.infoRow}>
                     <Ionicons name="person-outline" size={14} color="#888" />
                     <Text style={styles.infoText}>By {teacherName}</Text>
                  </View>

                  {/* Marked at (if marked) */}
                  {attendance.markedAt && (
                     <View style={styles.infoRow}>
                        <Ionicons name="checkmark-done-outline" size={14} color="#4ade80" />
                        <Text style={[styles.infoText, { color: '#4ade80' }]}>
                           Marked at {formatTime(attendance.markedAt)}
                        </Text>
                     </View>
                  )}

                  {/* Notes */}
                  {attendance.notes && (
                     <View style={styles.notesRow}>
                        <Ionicons name="document-text-outline" size={14} color="#666" />
                        <Text style={styles.notesText} numberOfLines={2}>
                           {attendance.notes}
                        </Text>
                     </View>
                  )}
               </View>
            );
         })}

         {pagination && pagination.totalPages > 1 && (
            <PaginationControls
               pagination={pagination}
               onPrevPage={onPrevPage}
               onNextPage={onNextPage}
            />
         )}
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      marginHorizontal: 16,
      marginBottom: 16,
   },
   headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
   },
   headerText: {
      fontSize: 18,
      fontWeight: '700',
      color: '#ffffff',
   },
   countBadge: {
      backgroundColor: '#1e3a5f',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 2,
   },
   countText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#60a5fa',
   },
   emptyContainer: {
      backgroundColor: '#111',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#222',
      padding: 24,
      alignItems: 'center',
      gap: 8,
   },
   emptyText: {
      fontSize: 14,
      color: '#555',
   },
   card: {
      backgroundColor: '#111',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#222',
      padding: 14,
      marginBottom: 10,
   },
   cardTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
   },
   typeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
      gap: 4,
   },
   typeChipText: {
      fontSize: 12,
      fontWeight: '600',
   },
   statusBadge: {
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
   },
   statusBadgeText: {
      fontSize: 12,
      fontWeight: '600',
   },
   infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
   },
   infoText: {
      fontSize: 13,
      color: '#aaa',
   },
   notesRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      marginTop: 6,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: '#1a1a1a',
   },
   notesText: {
      fontSize: 12,
      color: '#666',
      flex: 1,
   },
});
