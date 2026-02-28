import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface ClassActionButtonsProps {
   isCreator?: boolean;
   onEdit: () => void;
   onTakeAttendance: () => void;
   onViewAttendanceStats?: () => void;
   onShowQR?: () => void;
}

export const ClassActionButtons: React.FC<ClassActionButtonsProps> = ({
   isCreator = false,
   onEdit,
   onTakeAttendance,
   onViewAttendanceStats,
   onShowQR,
}) => {
   if (isCreator) {
      return (
         <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
               <Ionicons name="create-outline" size={20} color="#ffffff" />
               <Text style={styles.actionButtonText}>Edit Class</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.qrButton} onPress={onShowQR}>
               <Ionicons name="qr-code-outline" size={20} color="#ffffff" />
               <Text style={styles.actionButtonText}>Class QR</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryButton} onPress={onTakeAttendance}>
               <MaterialCommunityIcons name="clipboard-check-outline" size={20} color="#ffffff" />
               <Text style={styles.actionButtonText}>Attendance</Text>
            </TouchableOpacity>
         </View>
      );
   }

   return (
      <View style={styles.actionButtonsContainer}>
         <TouchableOpacity style={styles.primaryButton} onPress={onViewAttendanceStats}>
            <Ionicons name="stats-chart-outline" size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>Attendance Stats</Text>
         </TouchableOpacity>
      </View>
   );
};

const styles = StyleSheet.create({
   actionButtonsContainer: {
      flexDirection: 'row',
      padding: 20,
      paddingTop: 0,
      gap: 12,
   },
   actionButton: {
      flex: 1,
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: '#333',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
   },
   qrButton: {
      flex: 1,
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: '#10b981',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
   },
   primaryButton: {
      flex: 1,
      backgroundColor: '#007AFF',
      borderRadius: 12,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
   },
   actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#ffffff',
   },
});
