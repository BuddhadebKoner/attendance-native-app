import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ClassDetailsHeaderProps {
   title: string;
   onBack: () => void;
   onDelete: () => void;
}

export const ClassDetailsHeader: React.FC<ClassDetailsHeaderProps> = ({
   title,
   onBack,
   onDelete,
}) => {
   return (
      <View style={styles.header}>
         <TouchableOpacity onPress={onBack} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
         </TouchableOpacity>
         <Text style={styles.headerTitle}>{title}</Text>
         <TouchableOpacity onPress={onDelete} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={24} color="#ff4444" />
         </TouchableOpacity>
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
