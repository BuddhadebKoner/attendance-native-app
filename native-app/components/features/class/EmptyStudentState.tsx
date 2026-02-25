import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface EmptyStudentStateProps {
   message?: string;
   subMessage?: string;
}

export const EmptyStudentState: React.FC<EmptyStudentStateProps> = ({
   message = 'No students enrolled yet',
   subMessage = 'Add students to get started',
}) => {
   return (
      <View style={styles.emptyState}>
         <MaterialCommunityIcons name="account-group-outline" size={48} color="#333" />
         <Text style={styles.emptyStateText}>{message}</Text>
         <Text style={styles.emptyStateSubtext}>{subMessage}</Text>
      </View>
   );
};

const styles = StyleSheet.create({
   emptyState: {
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      padding: 40,
      borderWidth: 1,
      borderColor: '#333',
      alignItems: 'center',
   },
   emptyStateText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#888',
      marginTop: 12,
   },
   emptyStateSubtext: {
      fontSize: 14,
      color: '#666',
      marginTop: 4,
   },
});
