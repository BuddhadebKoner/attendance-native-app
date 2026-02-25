import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { User } from '../../../types/api';

interface StudentListItemProps {
   student: User;
   onRemove: (studentId: string, studentName: string) => void;
}

export const StudentListItem: React.FC<StudentListItemProps> = ({ student, onRemove }) => {
   return (
      <View style={styles.studentCard}>
         <View style={styles.studentAvatar}>
            <Text style={styles.studentAvatarText}>
               {student.name?.charAt(0).toUpperCase() || student.mobile?.charAt(0) || 'S'}
            </Text>
         </View>
         <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{student.name || 'Unknown'}</Text>
            <Text style={styles.studentMobile}>{student.mobile}</Text>
         </View>
         <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(student._id, student.name || student.mobile)}
         >
            <Ionicons name="close-circle" size={24} color="#ff4444" />
         </TouchableOpacity>
      </View>
   );
};

const styles = StyleSheet.create({
   studentCard: {
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: '#333',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
   },
   studentAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#333',
      justifyContent: 'center',
      alignItems: 'center',
   },
   studentAvatarText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#ffffff',
   },
   studentInfo: {
      flex: 1,
   },
   studentName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 2,
   },
   studentMobile: {
      fontSize: 14,
      color: '#888',
   },
   removeButton: {
      padding: 4,
   },
});
