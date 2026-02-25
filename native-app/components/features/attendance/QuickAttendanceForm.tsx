import React, { useState } from 'react';
import {
   View,
   Text,
   TextInput,
   TouchableOpacity,
   StyleSheet,
   ScrollView,
   ActivityIndicator,
   Alert,
   KeyboardAvoidingView,
   Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CreateAttendanceRequest, Location } from '../../../types/api';

interface QuickAttendanceFormProps {
   classId: string;
   className: string;
   onSubmit: (data: CreateAttendanceRequest) => Promise<void>;
   onCancel: () => void;
}

export default function QuickAttendanceForm({
   classId,
   className,
   onSubmit,
   onCancel,
}: QuickAttendanceFormProps) {
   const [notes, setNotes] = useState('');
   const [location, setLocation] = useState<Location | undefined>();
   const [includeLocation, setIncludeLocation] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
   const [isGettingLocation, setIsGettingLocation] = useState(false);

   const handleGetLocation = async () => {
      setIsGettingLocation(true);
      try {
         // TODO: Implement actual location fetching with expo-location
         // For now, showing a placeholder
         Alert.alert(
            'Location Feature',
            'Location tracking will be implemented with expo-location. This will capture the GPS coordinates when taking attendance.',
            [{ text: 'OK' }]
         );

         // Mock location for development
         setLocation({
            latitude: 0,
            longitude: 0,
            address: 'Location not implemented yet',
            accuracy: 0,
         });
      } catch (error) {
         Alert.alert('Error', 'Failed to get location');
      } finally {
         setIsGettingLocation(false);
      }
   };

   const handleSubmit = async () => {
      setIsLoading(true);
      try {
         const attendanceData: CreateAttendanceRequest = {
            classId,
            attendanceType: 'quick',
            attendanceDate: new Date().toISOString(),
            notes: notes.trim() || undefined,
            location: includeLocation ? location : undefined,
         };

         await onSubmit(attendanceData);
      } catch (error: any) {
         Alert.alert('Error', error?.message || 'Failed to create attendance');
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <KeyboardAvoidingView
         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
         style={styles.container}
      >
         <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
               <View>
                  <Text style={styles.title}>Quick Attendance</Text>
                  <Text style={styles.subtitle}>Take attendance now</Text>
               </View>
               <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#ffffff" />
               </TouchableOpacity>
            </View>

            <View style={styles.classInfo}>
               <Ionicons name="school" size={20} color="#4CAF50" />
               <Text style={styles.classText}>{className}</Text>
            </View>

            <View style={styles.infoBox}>
               <Ionicons name="information-circle" size={20} color="#2196F3" />
               <Text style={styles.infoText}>
                  This will create an attendance session that starts immediately.
                  You can mark students as present, absent, late, or excused.
               </Text>
            </View>

            <View style={styles.formSection}>
               <Text style={styles.label}>Notes (Optional)</Text>
               <TextInput
                  style={styles.textArea}
                  placeholder="Add any notes about this attendance session..."
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={notes}
                  onChangeText={setNotes}
               />
            </View>

            <View style={styles.formSection}>
               <View style={styles.locationHeader}>
                  <Text style={styles.label}>Location</Text>
                  <TouchableOpacity
                     style={styles.toggleButton}
                     onPress={() => {
                        setIncludeLocation(!includeLocation);
                        if (!includeLocation && !location) {
                           handleGetLocation();
                        }
                     }}
                  >
                     <Ionicons
                        name={includeLocation ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={includeLocation ? '#4CAF50' : '#666'}
                     />
                     <Text style={styles.toggleText}>Include location</Text>
                  </TouchableOpacity>
               </View>

               {includeLocation && (
                  <View style={styles.locationBox}>
                     {isGettingLocation ? (
                        <View style={styles.locationLoading}>
                           <ActivityIndicator size="small" color="#4CAF50" />
                           <Text style={styles.locationLoadingText}>Getting location...</Text>
                        </View>
                     ) : location ? (
                        <View>
                           <View style={styles.locationItem}>
                              <Ionicons name="location" size={16} color="#4CAF50" />
                              <Text style={styles.locationText}>
                                 {location.address || 'Location captured'}
                              </Text>
                           </View>
                           <TouchableOpacity
                              style={styles.refreshButton}
                              onPress={handleGetLocation}
                           >
                              <Ionicons name="refresh" size={16} color="#2196F3" />
                              <Text style={styles.refreshText}>Refresh location</Text>
                           </TouchableOpacity>
                        </View>
                     ) : (
                        <TouchableOpacity
                           style={styles.getLocationButton}
                           onPress={handleGetLocation}
                        >
                           <Ionicons name="locate" size={20} color="#ffffff" />
                           <Text style={styles.getLocationText}>Get Current Location</Text>
                        </TouchableOpacity>
                     )}
                  </View>
               )}
            </View>

            <View style={styles.summaryBox}>
               <Text style={styles.summaryTitle}>Summary</Text>
               <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Type:</Text>
                  <Text style={styles.summaryValue}>Quick Attendance</Text>
               </View>
               <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Start Time:</Text>
                  <Text style={styles.summaryValue}>Immediately</Text>
               </View>
               <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Class:</Text>
                  <Text style={styles.summaryValue}>{className}</Text>
               </View>
            </View>
         </ScrollView>

         <View style={styles.footer}>
            <TouchableOpacity
               style={[styles.button, styles.cancelButton]}
               onPress={onCancel}
               disabled={isLoading}
            >
               <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
               style={[styles.button, styles.submitButton]}
               onPress={handleSubmit}
               disabled={isLoading}
            >
               {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
               ) : (
                  <>
                     <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                     <Text style={styles.submitButtonText}>Start Attendance</Text>
                  </>
               )}
            </TouchableOpacity>
         </View>
      </KeyboardAvoidingView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: '#000000',
   },
   scrollView: {
      flex: 1,
   },
   header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: 20,
      paddingBottom: 16,
   },
   title: {
      fontSize: 28,
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: 4,
   },
   subtitle: {
      fontSize: 14,
      color: '#888',
   },
   closeButton: {
      padding: 4,
   },
   classInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1a1a1a',
      marginHorizontal: 20,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#2a2a2a',
   },
   classText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginLeft: 12,
   },
   infoBox: {
      flexDirection: 'row',
      backgroundColor: '#0d1f2d',
      marginHorizontal: 20,
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#1a3a52',
   },
   infoText: {
      flex: 1,
      fontSize: 14,
      color: '#93c5fd',
      marginLeft: 12,
      lineHeight: 20,
   },
   formSection: {
      paddingHorizontal: 20,
      marginBottom: 24,
   },
   label: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 12,
   },
   textArea: {
      backgroundColor: '#1a1a1a',
      borderWidth: 1,
      borderColor: '#2a2a2a',
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: '#ffffff',
      minHeight: 100,
   },
   locationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
   },
   toggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
   },
   toggleText: {
      fontSize: 14,
      color: '#888',
      marginLeft: 8,
   },
   locationBox: {
      backgroundColor: '#1a1a1a',
      borderWidth: 1,
      borderColor: '#2a2a2a',
      borderRadius: 12,
      padding: 16,
   },
   locationLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
   },
   locationLoadingText: {
      fontSize: 14,
      color: '#888',
      marginLeft: 12,
   },
   locationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
   },
   locationText: {
      fontSize: 14,
      color: '#ffffff',
      marginLeft: 8,
   },
   refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
   },
   refreshText: {
      fontSize: 14,
      color: '#2196F3',
      marginLeft: 6,
   },
   getLocationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#2a2a2a',
      padding: 12,
      borderRadius: 8,
      gap: 8,
   },
   getLocationText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#ffffff',
      marginLeft: 8,
   },
   summaryBox: {
      backgroundColor: '#1a1a1a',
      marginHorizontal: 20,
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: '#2a2a2a',
   },
   summaryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 12,
   },
   summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
   },
   summaryLabel: {
      fontSize: 14,
      color: '#888',
   },
   summaryValue: {
      fontSize: 14,
      fontWeight: '600',
      color: '#ffffff',
   },
   footer: {
      flexDirection: 'row',
      padding: 20,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: '#2a2a2a',
      backgroundColor: '#000000',
   },
   button: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      gap: 8,
   },
   cancelButton: {
      backgroundColor: '#2a2a2a',
      borderWidth: 1,
      borderColor: '#3a3a3a',
   },
   cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
   },
   submitButton: {
      backgroundColor: '#4CAF50',
   },
   submitButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginLeft: 8,
   },
});
