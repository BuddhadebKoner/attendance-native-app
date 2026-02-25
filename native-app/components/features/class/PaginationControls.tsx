import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PaginationInfo } from '../../../types/api';

interface PaginationControlsProps {
   pagination: PaginationInfo;
   onPrevPage: () => void;
   onNextPage: () => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
   pagination,
   onPrevPage,
   onNextPage,
}) => {
   if (pagination.totalPages <= 1) {
      return null;
   }

   return (
      <View style={styles.paginationContainer}>
         <TouchableOpacity
            style={[styles.paginationButton, !pagination.hasPrevPage && styles.paginationButtonDisabled]}
            onPress={onPrevPage}
            disabled={!pagination.hasPrevPage}
         >
            <Ionicons name="chevron-back" size={20} color={pagination.hasPrevPage ? "#ffffff" : "#666"} />
         </TouchableOpacity>

         <Text style={styles.paginationText}>
            Page {pagination.currentPage} of {pagination.totalPages}
         </Text>

         <TouchableOpacity
            style={[styles.paginationButton, !pagination.hasNextPage && styles.paginationButtonDisabled]}
            onPress={onNextPage}
            disabled={!pagination.hasNextPage}
         >
            <Ionicons name="chevron-forward" size={20} color={pagination.hasNextPage ? "#ffffff" : "#666"} />
         </TouchableOpacity>
      </View>
   );
};

const styles = StyleSheet.create({
   paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 16,
      gap: 16,
   },
   paginationButton: {
      backgroundColor: '#1a1a1a',
      borderRadius: 8,
      padding: 8,
      borderWidth: 1,
      borderColor: '#333',
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
   },
   paginationButtonDisabled: {
      opacity: 0.4,
   },
   paginationText: {
      fontSize: 14,
      color: '#888',
      fontWeight: '500',
   },
});
