import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StudentListItem } from './StudentListItem';
import { PaginationControls } from './PaginationControls';
import { EmptyStudentState } from './EmptyStudentState';
import type { User, PaginationInfo } from '../../../types/api';

interface ClassStudentsSectionProps {
   students: User[];
   totalCount: number;
   pagination: PaginationInfo | null;
   onAddStudent: () => void;
   onRemoveStudent: (studentId: string, studentName: string) => void;
   onNextPage: () => void;
   onPrevPage: () => void;
}

export const ClassStudentsSection: React.FC<ClassStudentsSectionProps> = ({
   students,
   totalCount,
   pagination,
   onAddStudent,
   onRemoveStudent,
   onNextPage,
   onPrevPage,
}) => {
   return (
      <View style={styles.section}>
         <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Students ({totalCount})</Text>
            <TouchableOpacity style={styles.addButton} onPress={onAddStudent}>
               <Ionicons name="person-add" size={20} color="#ffffff" />
               <Text style={styles.addButtonText}>Add Student</Text>
            </TouchableOpacity>
         </View>

         {students.length > 0 ? (
            <>
               <View style={styles.studentsContainer}>
                  {students.map((student) => (
                     <StudentListItem
                        key={student._id}
                        student={student}
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
      marginBottom: 16,
   },
   sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#ffffff',
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
   studentsContainer: {
      gap: 12,
   },
});
