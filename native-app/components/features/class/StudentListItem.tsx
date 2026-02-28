import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { User, EnrollmentStatus } from '../../../types/api';

interface StudentListItemProps {
   student: User;
   enrollmentStatus?: EnrollmentStatus;
   selectionMode?: boolean;
   isSelected?: boolean;
   isCreator?: boolean;
   onToggleSelect?: (studentId: string) => void;
   onRemove: (studentId: string, studentName: string) => void;
}

export const StudentListItem: React.FC<StudentListItemProps> = ({
   student,
   enrollmentStatus,
   selectionMode = false,
   isSelected = false,
   isCreator = false,
   onToggleSelect,
   onRemove,
}) => {
   const handlePress = () => {
      if (selectionMode && onToggleSelect) {
         onToggleSelect(student._id);
      }
   };

   return (
      <TouchableOpacity
         style={[styles.studentCard, isSelected && styles.studentCardSelected]}
         onPress={handlePress}
         onLongPress={() => isCreator && onToggleSelect?.(student._id)}
         activeOpacity={selectionMode ? 0.7 : 1}
         disabled={!selectionMode}
      >
         {/* Selection checkbox */}
         {selectionMode && (
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
               {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
         )}

         {/* Profile image or avatar */}
         {student.profilePicture ? (
            <Image source={{ uri: student.profilePicture }} style={styles.profileImage} />
         ) : (
            <View style={styles.studentAvatar}>
               <Text style={styles.studentAvatarText}>
                  {student.name?.charAt(0).toUpperCase() || student.email?.charAt(0)?.toUpperCase() || 'S'}
               </Text>
            </View>
         )}

         <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{student.name || 'Unknown'}</Text>
            <Text style={styles.studentEmail} numberOfLines={1}>{student.email || student.mobile || ''}</Text>
         </View>

         {/* Enrollment status badge */}
         {enrollmentStatus && (
            <View style={[
               styles.statusBadge,
               enrollmentStatus === 'accepted'
                  ? styles.statusAccepted
                  : enrollmentStatus === 'requested'
                     ? styles.statusRequested
                     : styles.statusPending,
            ]}>
               <Text style={[
                  styles.statusBadgeText,
                  enrollmentStatus === 'accepted'
                     ? styles.statusAcceptedText
                     : enrollmentStatus === 'requested'
                        ? styles.statusRequestedText
                        : styles.statusPendingText,
               ]}>
                  {enrollmentStatus === 'accepted'
                     ? 'Accepted'
                     : enrollmentStatus === 'requested'
                        ? 'Requested'
                        : 'Pending'}
               </Text>
            </View>
         )}

         {/* Remove button only visible for creator when not in selection mode */}
         {isCreator && !selectionMode && (
            <TouchableOpacity
               style={styles.removeButton}
               onPress={() => onRemove(student._id, student.name || student.email || student.mobile || 'Unknown')}
            >
               <Ionicons name="close-circle" size={24} color="#ff4444" />
            </TouchableOpacity>
         )}
      </TouchableOpacity>
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
   studentCardSelected: {
      borderColor: '#ff4444',
      backgroundColor: 'rgba(255, 68, 68, 0.08)',
   },
   checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: '#555',
      justifyContent: 'center',
      alignItems: 'center',
   },
   checkboxSelected: {
      backgroundColor: '#ff4444',
      borderColor: '#ff4444',
   },
   profileImage: {
      width: 42,
      height: 42,
      borderRadius: 21,
   },
   studentAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
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
   studentEmail: {
      fontSize: 13,
      color: '#888',
   },
   removeButton: {
      padding: 4,
   },
   statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
   },
   statusAccepted: {
      backgroundColor: 'rgba(76, 175, 80, 0.15)',
   },
   statusPending: {
      backgroundColor: 'rgba(255, 193, 7, 0.15)',
   },
   statusRequested: {
      backgroundColor: 'rgba(255, 149, 0, 0.15)',
   },
   statusBadgeText: {
      fontSize: 11,
      fontWeight: '600',
   },
   statusAcceptedText: {
      color: '#4CAF50',
   },
   statusPendingText: {
      color: '#FFC107',
   },
   statusRequestedText: {
      color: '#FF9500',
   },
});
