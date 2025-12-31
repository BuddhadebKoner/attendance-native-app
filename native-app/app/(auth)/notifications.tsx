import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function NotificationsScreen() {
   const router = useRouter();

   return (
      <SafeAreaView style={styles.container}>
         <View style={styles.content}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
               <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>This feature is coming soon</Text>
         </View>
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: '#000000',
   },
   content: {
      flex: 1,
      padding: 24,
      paddingTop: 10,
   },
   backButton: {
      marginBottom: 10,
   },
   backButtonText: {
      fontSize: 16,
      color: '#ffffff',
   },
   title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 8,
   },
   subtitle: {
      fontSize: 16,
      color: '#888',
   },
});
