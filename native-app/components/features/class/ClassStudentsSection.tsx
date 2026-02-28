import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StudentListItem } from './StudentListItem';
import { PaginationControls } from './PaginationControls';
import { EmptyStudentState } from './EmptyStudentState';
import type { User, EnrollmentStatus, PaginationInfo } from '../../../types/api';

interface StudentWithEnrollment extends User {
   enrollmentStatus?: EnrollmentStatus;
   enrolledAt?: string;
}

interface ClassStudentsSectionProps {
   students: StudentWithEnrollment[];
   totalCount: number;
   acceptedCount?: number;
   pendingCount?: number;
   requestedCount?: number;
   pagination: PaginationInfo | null;
   isCreator?: boolean;
   onAddStudent: () => void;
   onRemoveStudent: (studentId: string, studentName: string) => void;
   onBulkRemove: (studentIds: string[]) => void;
   onNextPage: () => void;
   onPrevPage: () => void;
   selectionMode: boolean;
   selectedStudents: Set<string>;
   onToggleSelectionMode: () => void;
   onToggleSelect: (studentId: string) => void;
   onSelectAll: () => void;
   isBulkRemoving?: boolean;
}

export const ClassStudentsSection: React.FC<ClassStudentsSectionProps> = ({
   students,
   totalCount,
   acceptedCount = 0,
   pendingCount = 0,
   requestedCount = 0,
   pagination,
   isCreator = false,
   onAddStudent,
   onRemoveStudent,
   onBulkRemove,
   onNextPage,
   onPrevPage,
   selectionMode,
   selectedStudents,
   onToggleSelectionMode,
   onToggleSelect,
   onSelectAll,
   isBulkRemoving = false,
}) => {
   const selectedCount = selectedStudents.size;
   const allSelected = students.length > 0 && students.every(s => selectedStudents.has(s._id));

   return (
      <View style={styles.section}>
         {/* Header row */}
         <View style={styles.sectionHeader}>
            <View>
               <Text style={styles.sectionTitle}>Students ({totalCount})</Text>
               {(acceptedCount > 0 || pendingCount > 0 || requestedCount > 0) && (
                  <Text style={styles.statusSummary}>
                     <Text style={styles.acceptedCountText}>{acceptedCount} accepted</Text>
                     {pendingCount > 0 && (
                        <Text style={styles.pendingCountText}>  ·  {pendingCount} pending</Text>
                     )}
                     {requestedCount > 0 && (
                        <Text style={styles.requestedCountText}>  ·  {requestedCount} requested</Text>
                     )}
                  </Text>
               )}
            </View>
            <View style={styles.headerActions}>
               {isCreator && students.length > 0 && (
                  <TouchableOpacity
                     style={[styles.headerBtn, selectionMode && styles.headerBtnActive]}
                     onPress={onToggleSelectionMode}
                  >
                     <Ionicons
                        name={selectionMode ? 'close' : 'checkbox-outline'}
                        size={18}
                        color={selectionMode ? '#ff4444' : '#fff'}
                     />
                  </TouchableOpacity>
               )}
               {isCreator && (
                  <TouchableOpacity style={styles.addButton} onPress={onAddStudent}>
                     <Ionicons name="person-add" size={18} color="#ffffff" />
                     <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
               )}
            </View>
         </View>

         {/* Bulk action bar (visible during selection mode — creator only) */}
         {isCreator && selectionMode && (
            <View style={styles.bulkBar}>
               <TouchableOpacity style={styles.selectAllBtn} onPress={onSelectAll}>
                  <Ionicons
                     name={allSelected ? 'checkbox' : 'square-outline'}
                     size={20}
                     color={allSelected ? '#007AFF' : '#888'}
                  />
                  <Text style={styles.selectAllText}>
                     {allSelected ? 'Deselect All' : 'Select All'}
                  </Text>
               </TouchableOpacity>

               <Text style={styles.selectedCount}>
                  {selectedCount} selected
               </Text>

               <TouchableOpacity
                  style={[styles.bulkDeleteBtn, selectedCount === 0 && styles.bulkDeleteBtnDisabled]}
                  disabled={selectedCount === 0 || isBulkRemoving}
                  onPress={() => onBulkRemove(Array.from(selectedStudents))}
               >
                  {isBulkRemoving ? (
                     <ActivityIndicator size="small" color="#fff" />
                  ) : (
                     <>
                        <Ionicons name="trash" size={16} color="#fff" />
                        <Text style={styles.bulkDeleteText}>Remove</Text>
                     </>
                  )}
               </TouchableOpacity>
            </View>
         )}

         {students.length > 0 ? (
            <>
               <View style={styles.studentsContainer}>
                  {students.map((student) => (
                     <StudentListItem
                        key={student._id}
                        student={student}
                        enrollmentStatus={student.enrollmentStatus}
                        selectionMode={selectionMode}
                        isSelected={selectedStudents.has(student._id)}
                        isCreator={isCreator}
                        onToggleSelect={onToggleSelect}
                        onRemove={onRemoveStudent}
                     />
                  ))}
               </View>

               {pagination && (
                  <PaginationControls
                     pagination={pagination}
                     onPrevPage={onPrevPage}
                     onNextPage={onNextPage}
                  />
               )}
            </>
         ) : (
            <EmptyStudentState />
         )}
      </View>
   );
};

const styles = StyleSheet.create({
   section: {
      padding: 20,
      paddingTop: 10,
   },
   sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
   },
   sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#ffffff',
   },
   statusSummary: {
      fontSize: 12,
      marginTop: 2,
   },
   acceptedCountText: {
      color: '#4CAF50',
   },
   pendingCountText: {
      color: '#FFC107',
   },
   requestedCountText: {
      color: '#FF9500',
   },
   headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
   },
   headerBtn: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: '#333',
   },
   headerBtnActive: {
      backgroundColor: 'rgba(255, 68, 68, 0.15)',
   },
   addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#333',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 6,
   },
   addButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#ffffff',
   },
   bulkBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#1a1a1a',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#333',
   },
   selectAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
   },
   selectAllText: {
      color: '#ccc',
      fontSize: 13,
      fontWeight: '500',
   },
   selectedCount: {
      color: '#888',
      fontSize: 13,
   },
   bulkDeleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#ff4444',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      minWidth: 80,
      justifyContent: 'center',
   },
   bulkDeleteBtnDisabled: {
      opacity: 0.4,
   },
   bulkDeleteText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '600',
   },
   studentsContainer: {
      gap: 10,
   },
});
