import React from 'react';
import {
   Modal,
   View,
   Text,
   TouchableOpacity,
   StyleSheet,
   Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AttendanceTypeModalProps {
   visible: boolean;
   onClose: () => void;
   onSelectQuick: () => void;
   onSelectScheduled: () => void;
}

export default function AttendanceTypeModal({
   visible,
   onClose,
   onSelectQuick,
   onSelectScheduled,
}: AttendanceTypeModalProps) {
   return (
      <Modal
         visible={visible}
         transparent
         animationType="fade"
         onRequestClose={onClose}
      >
         <Pressable style={styles.overlay} onPress={onClose}>
            <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
               <View style={styles.header}>
                  <Text style={styles.title}>Take Attendance</Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                     <Ionicons name="close" size={24} color="#ffffff" />
                  </TouchableOpacity>
               </View>

               <Text style={styles.subtitle}>Choose attendance type</Text>

               <TouchableOpacity
                  style={styles.optionButton}
                  onPress={onSelectQuick}
                  activeOpacity={0.7}
               >
                  <View style={styles.iconContainer}>
                     <Ionicons name="flash" size={32} color="#4CAF50" />
                  </View>
                  <View style={styles.optionContent}>
                     <Text style={styles.optionTitle}>Quick Attendance</Text>
                     <Text style={styles.optionDescription}>
                        Take attendance right now for immediate marking
                     </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#666" />
               </TouchableOpacity>

               <TouchableOpacity
                  style={styles.optionButton}
                  onPress={onSelectScheduled}
                  activeOpacity={0.7}
               >
                  <View style={styles.iconContainer}>
                     <Ionicons name="calendar" size={32} color="#2196F3" />
                  </View>
                  <View style={styles.optionContent}>
                     <Text style={styles.optionTitle}>Schedule Attendance</Text>
                     <Text style={styles.optionDescription}>
                        Schedule attendance for a future date and time
                     </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#666" />
               </TouchableOpacity>
            </Pressable>
         </Pressable>
      </Modal>
   );
}

const styles = StyleSheet.create({
   overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
   },
   modalContainer: {
      backgroundColor: '#1a1a1a',
      borderRadius: 16,
      width: '100%',
      maxWidth: 500,
      padding: 20,
      borderWidth: 1,
      borderColor: '#333',
   },
   header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
   },
   title: {
      fontSize: 24,
      fontWeight: '700',
      color: '#ffffff',
   },
   closeButton: {
      padding: 4,
   },
   subtitle: {
      fontSize: 14,
      color: '#888',
      marginBottom: 24,
   },
   optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#2a2a2a',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#333',
   },
   iconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#1a1a1a',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
   },
   optionContent: {
      flex: 1,
   },
   optionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 4,
   },
   optionDescription: {
      fontSize: 14,
      color: '#888',
      lineHeight: 20,
   },
});
