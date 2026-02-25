import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface ClassActionButtonsProps {
   onEdit: () => void;
   onTakeAttendance: () => void;
}

export const ClassActionButtons: React.FC<ClassActionButtonsProps> = ({
   onEdit,
   onTakeAttendance,
}) => {
   return (
      <View style={styles.actionButtonsContainer}>
         <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
            <Ionicons name="create-outline" size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>Edit Class</Text>
         </TouchableOpacity>

         <TouchableOpacity style={styles.actionButton} onPress={onTakeAttendance}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>Take Attendance</Text>
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
   actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#ffffff',
   },
});
