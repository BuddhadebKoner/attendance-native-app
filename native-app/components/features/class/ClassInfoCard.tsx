import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ClassInfoCardProps {
   className: string;
   subject: string;
   studentCount: number;
   createdAt: string;
}

export const ClassInfoCard: React.FC<ClassInfoCardProps> = ({
   className,
   subject,
   studentCount,
   createdAt,
}) => {
   return (
      <View style={styles.classInfoCard}>
         <View style={styles.iconWrapper}>
            <Ionicons name="school" size={48} color="#ffffff" />
         </View>
         <Text style={styles.className}>{className}</Text>
         <Text style={styles.subject}>{subject}</Text>

         <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
               <Ionicons name="people" size={20} color="#888" />
               <Text style={styles.metaText}>{studentCount} Students</Text>
            </View>
            <View style={styles.metaItem}>
               <Ionicons name="calendar" size={20} color="#888" />
               <Text style={styles.metaText}>
                  {new Date(createdAt).toLocaleDateString('en-US', {
                     month: 'short',
                     day: 'numeric',
                     year: 'numeric',
                  })}
               </Text>
            </View>
         </View>
      </View>
   );
};

const styles = StyleSheet.create({
   classInfoCard: {
      backgroundColor: '#1a1a1a',
      margin: 20,
      marginTop: 10,
      padding: 24,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#333',
      alignItems: 'center',
   },
   iconWrapper: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#333',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
   },
   className: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#ffffff',
      textAlign: 'center',
      marginBottom: 8,
   },
   subject: {
      fontSize: 16,
      color: '#888',
      marginBottom: 20,
   },
   metaInfo: {
      flexDirection: 'row',
      gap: 24,
   },
   metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
   },
   metaText: {
      fontSize: 14,
      color: '#888',
   },
});
