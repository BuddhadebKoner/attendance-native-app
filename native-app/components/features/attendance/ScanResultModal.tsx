import React from 'react';
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   Modal,
   ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { User } from '../../../types/api';

interface ScanResultModalProps {
   visible: boolean;
   student: User | null;
   currentStatus: string;
   selectedStatus: string;
   onStatusSelect: (status: string) => void;
   onConfirm: () => void;
   onCancel: () => void;
   isUpdating: boolean;
}

const STATUS_OPTIONS: { value: string; label: string; color: string; icon: string }[] = [
   { value: 'present', label: 'Present', color: '#4CAF50', icon: 'checkmark-circle' },
   { value: 'absent', label: 'Absent', color: '#F44336', icon: 'close-circle' },
   { value: 'late', label: 'Late', color: '#FF9800', icon: 'time' },
   { value: 'excused', label: 'Excused', color: '#2196F3', icon: 'information-circle' },
];

export default function ScanResultModal({
   visible,
   student,
   currentStatus,
   selectedStatus,
   onStatusSelect,
   onConfirm,
   onCancel,
   isUpdating,
}: ScanResultModalProps) {
   if (!student) return null;

   const initials = (student.name || 'S')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

   return (
      <Modal
         visible={visible}
         transparent
         animationType="fade"
         onRequestClose={onCancel}
      >
         <View style={styles.backdrop}>
            <View style={styles.card}>
               {/* Student Info */}
               <View style={styles.studentSection}>
                  <View style={styles.avatar}>
                     <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <View style={styles.studentInfo}>
                     <Text style={styles.studentName} numberOfLines={1}>
                        {student.name || 'Student'}
                     </Text>
                     <Text style={styles.studentEmail} numberOfLines={1}>
                        {student.email}
                     </Text>
                  </View>
               </View>

               {/* Current status indicator */}
               {currentStatus && currentStatus !== 'not-marked' && (
                  <View style={styles.currentStatusRow}>
                     <Text style={styles.currentStatusLabel}>Current status:</Text>
                     <View
                        style={[
                           styles.currentStatusBadge,
                           {
                              backgroundColor:
                                 STATUS_OPTIONS.find((s) => s.value === currentStatus)?.color + '20' ||
                                 '#88888820',
                           },
                        ]}
                     >
                        <Text
                           style={[
                              styles.currentStatusText,
                              {
                                 color:
                                    STATUS_OPTIONS.find((s) => s.value === currentStatus)?.color ||
                                    '#888',
                              },
                           ]}
                        >
                           {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                        </Text>
                     </View>
                  </View>
               )}

               {/* Status selection */}
               <Text style={styles.sectionTitle}>Mark as:</Text>
               <View style={styles.statusGrid}>
                  {STATUS_OPTIONS.map((option) => {
                     const isSelected = selectedStatus === option.value;
                     return (
                        <TouchableOpacity
                           key={option.value}
                           style={[
                              styles.statusButton,
                              {
                                 borderColor: isSelected ? option.color : '#333',
                                 backgroundColor: isSelected ? option.color + '18' : '#1a1a1a',
                              },
                           ]}
                           onPress={() => onStatusSelect(option.value)}
                           disabled={isUpdating}
                        >
                           <Ionicons
                              name={option.icon as any}
                              size={24}
                              color={isSelected ? option.color : '#666'}
                           />
                           <Text
                              style={[
                                 styles.statusButtonText,
                                 { color: isSelected ? option.color : '#999' },
                              ]}
                           >
                              {option.label}
                           </Text>
                           {isSelected && (
                              <View
                                 style={[
                                    styles.selectedIndicator,
                                    { backgroundColor: option.color },
                                 ]}
                              />
                           )}
                        </TouchableOpacity>
                     );
                  })}
               </View>

               {/* Action buttons */}
               <View style={styles.actionRow}>
                  <TouchableOpacity
                     style={styles.cancelButton}
                     onPress={onCancel}
                     disabled={isUpdating}
                  >
                     <Text style={styles.cancelButtonText}>Skip</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                     style={[
                        styles.confirmButton,
                        isUpdating && styles.confirmButtonDisabled,
                     ]}
                     onPress={onConfirm}
                     disabled={isUpdating}
                  >
                     {isUpdating ? (
                        <ActivityIndicator color="#000" size="small" />
                     ) : (
                        <>
                           <Ionicons name="checkmark" size={20} color="#000" />
                           <Text style={styles.confirmButtonText}>Confirm</Text>
                        </>
                     )}
                  </TouchableOpacity>
               </View>
            </View>
         </View>
      </Modal>
   );
}

const styles = StyleSheet.create({
   backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
   },
   card: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: '#111',
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: '#222',
   },
   studentSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 14,
   },
   avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: '#2a2a2a',
      alignItems: 'center',
      justifyContent: 'center',
   },
   avatarText: {
      color: '#ffffff',
      fontSize: 18,
      fontWeight: '700',
   },
   studentInfo: {
      flex: 1,
   },
   studentName: {
      color: '#ffffff',
      fontSize: 18,
      fontWeight: '700',
   },
   studentEmail: {
      color: '#888',
      fontSize: 13,
      marginTop: 2,
   },
   currentStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: '#1a1a1a',
      borderRadius: 10,
   },
   currentStatusLabel: {
      color: '#888',
      fontSize: 13,
   },
   currentStatusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 8,
   },
   currentStatusText: {
      fontSize: 12,
      fontWeight: '600',
   },
   sectionTitle: {
      color: '#888',
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
   },
   statusGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 20,
   },
   statusButton: {
      width: '47%',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      gap: 8,
      position: 'relative',
      overflow: 'hidden',
   },
   statusButtonText: {
      fontSize: 14,
      fontWeight: '600',
   },
   selectedIndicator: {
      position: 'absolute',
      bottom: 0,
      left: 14,
      right: 14,
      height: 2,
      borderRadius: 1,
   },
   actionRow: {
      flexDirection: 'row',
      gap: 12,
   },
   cancelButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: '#1a1a1a',
      borderWidth: 1,
      borderColor: '#333',
   },
   cancelButtonText: {
      color: '#999',
      fontSize: 15,
      fontWeight: '600',
   },
   confirmButton: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: '#ffffff',
      gap: 6,
   },
   confirmButtonDisabled: {
      opacity: 0.6,
   },
   confirmButtonText: {
      color: '#000000',
      fontSize: 15,
      fontWeight: '700',
   },
});
