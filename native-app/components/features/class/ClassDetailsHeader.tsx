import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ClassDetailsHeaderProps {
   title: string;
   onBack: () => void;
   onDelete: () => void;
   isCreator?: boolean;
   isDeleting?: boolean;
}

export const ClassDetailsHeader: React.FC<ClassDetailsHeaderProps> = ({
   title,
   onBack,
   onDelete,
   isCreator = false,
   isDeleting = false,
}) => {
   return (
      <View style={styles.header}>
         <TouchableOpacity onPress={onBack} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
         </TouchableOpacity>
         <Text style={styles.headerTitle}>{title}</Text>
         {isCreator ? (
            <TouchableOpacity onPress={onDelete} style={styles.headerButton} disabled={isDeleting}>
               {isDeleting ? (
                  <ActivityIndicator size="small" color="#ff4444" />
               ) : (
                  <Ionicons name="trash-outline" size={24} color="#ff4444" />
               )}
            </TouchableOpacity>
         ) : (
            <View style={styles.headerButton} />
         )}
      </View>
   );
};

const styles = StyleSheet.create({
   header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: 10,
   },
   headerButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
   },
   headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#ffffff',
   },
});
