import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { User } from '../../../types/api';

interface ClassCreatorCardProps {
   creator: User;
}

export const ClassCreatorCard: React.FC<ClassCreatorCardProps> = ({ creator }) => {
   return (
      <View style={styles.section}>
         <Text style={styles.sectionTitle}>Created By</Text>
         <View style={styles.creatorCard}>
            <View style={styles.creatorAvatar}>
               <Text style={styles.creatorAvatarText}>
                  {creator.name?.charAt(0).toUpperCase() || 'U'}
               </Text>
            </View>
            <View style={styles.creatorInfo}>
               <Text style={styles.creatorName}>{creator.name || 'Unknown'}</Text>
               <Text style={styles.creatorContact}>{creator.mobile}</Text>
               {creator.email && (
                  <Text style={styles.creatorContact}>{creator.email}</Text>
               )}
            </View>
         </View>
      </View>
   );
};

const styles = StyleSheet.create({
   section: {
      padding: 20,
      paddingTop: 10,
   },
   sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 16,
   },
   creatorCard: {
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: '#333',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
   },
   creatorAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#333',
      justifyContent: 'center',
      alignItems: 'center',
   },
   creatorAvatarText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#ffffff',
   },
   creatorInfo: {
      flex: 1,
   },
   creatorName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 4,
   },
   creatorContact: {
      fontSize: 14,
      color: '#888',
      marginBottom: 2,
   },
});
