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
import DateTimePicker from '@react-native-community/datetimepicker';
import type { CreateAttendanceRequest, Location } from '../../../types/api';

interface ScheduledAttendanceFormProps {
   classId: string;
   className: string;
   onSubmit: (data: CreateAttendanceRequest) => Promise<void>;
   onCancel: () => void;
}

export default function ScheduledAttendanceForm({
   classId,
   className,
   onSubmit,
   onCancel,
}: ScheduledAttendanceFormProps) {
   const [scheduledDate, setScheduledDate] = useState(new Date());
   const [showDatePicker, setShowDatePicker] = useState(false);
   const [showTimePicker, setShowTimePicker] = useState(false);
   const [notes, setNotes] = useState('');
   const [location, setLocation] = useState<Location | undefined>();
   const [includeLocation, setIncludeLocation] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
   const [isGettingLocation, setIsGettingLocation] = useState(false);

   const handleDateChange = (event: any, selectedDate?: Date) => {
      setShowDatePicker(false);
      if (selectedDate) {
         const newDate = new Date(scheduledDate);
         newDate.setFullYear(selectedDate.getFullYear());
         newDate.setMonth(selectedDate.getMonth());
         newDate.setDate(selectedDate.getDate());
         setScheduledDate(newDate);
      }
   };

   const handleTimeChange = (event: any, selectedTime?: Date) => {
      setShowTimePicker(false);
      if (selectedTime) {
         const newDate = new Date(scheduledDate);
         newDate.setHours(selectedTime.getHours());
         newDate.setMinutes(selectedTime.getMinutes());
         setScheduledDate(newDate);
      }
   };

   const handleGetLocation = async () => {
      setIsGettingLocation(true);
      try {
         // TODO: Implement actual location fetching with expo-location
         Alert.alert(
            'Location Feature',
            'Location tracking will be implemented with expo-location. This will capture the GPS coordinates when scheduling attendance.',
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
      // Validation
      const now = new Date();
      if (scheduledDate <= now) {
         Alert.alert('Invalid Date', 'Please select a future date and time');
         return;
      }

      setIsLoading(true);
      try {
         const attendanceData: CreateAttendanceRequest = {
            classId,
            attendanceType: 'scheduled',
            scheduledFor: scheduledDate.toISOString(),
            notes: notes.trim() || undefined,
            location: includeLocation ? location : undefined,
         };

         await onSubmit(attendanceData);
      } catch (error: any) {
         Alert.alert('Error', error?.message || 'Failed to schedule attendance');
      } finally {
         setIsLoading(false);
      }
   };

   const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
         weekday: 'short',
         year: 'numeric',
         month: 'short',
         day: 'numeric',
      });
   };

   const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
         hour: '2-digit',
         minute: '2-digit',
      });
   };

   const isValidSchedule = scheduledDate > new Date();

   return (
      <KeyboardAvoidingView
         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
         style={styles.container}
      >
         <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
               <View>
                  <Text style={styles.title}>Schedule Attendance</Text>
                  <Text style={styles.subtitle}>Set a future date and time</Text>
               </View>
               <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#ffffff" />
               </TouchableOpacity>
            </View>

            <View style={styles.classInfo}>
               <Ionicons name="school" size={20} color="#2196F3" />
               <Text style={styles.classText}>{className}</Text>
            </View>

            <View style={styles.infoBox}>
               <Ionicons name="information-circle" size={20} color="#2196F3" />
               <Text style={styles.infoText}>
                  Schedule an attendance session for a future date. You'll receive a
                  reminder when it's time to take attendance.
               </Text>
            </View>

            <View style={styles.formSection}>
               <Text style={styles.label}>Scheduled Date & Time *</Text>

               <View style={styles.dateTimeRow}>
                  <TouchableOpacity
                     style={styles.dateTimeButton}
                     onPress={() => setShowDatePicker(true)}
                  >
                     <Ionicons name="calendar-outline" size={20} color="#2196F3" />
                     <Text style={styles.dateTimeText}>{formatDate(scheduledDate)}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                     style={styles.dateTimeButton}
                     onPress={() => setShowTimePicker(true)}
                  >
                     <Ionicons name="time-outline" size={20} color="#2196F3" />
                     <Text style={styles.dateTimeText}>{formatTime(scheduledDate)}</Text>
                  </TouchableOpacity>
               </View>

               {!isValidSchedule && (
                  <View style={styles.warningBox}>
                     <Ionicons name="warning" size={16} color="#FF9800" />
                     <Text style={styles.warningText}>
                        Please select a future date and time
                     </Text>
                  </View>
               )}

               {showDatePicker && (
                  <DateTimePicker
                     value={scheduledDate}
                     mode="date"
                     display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                     onChange={handleDateChange}
                     minimumDate={new Date()}
                     themeVariant="dark"
                  />
               )}

               {showTimePicker && (
                  <DateTimePicker
                     value={scheduledDate}
                     mode="time"
                     display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                     onChange={handleTimeChange}
                     themeVariant="dark"
                  />
               )}
            </View>

            <View style={styles.formSection}>
               <Text style={styles.label}>Notes (Optional)</Text>
               <TextInput
                  style={styles.textArea}
                  placeholder="Add any notes about this scheduled attendance..."
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
                        color={includeLocation ? '#2196F3' : '#666'}
                     />
                     <Text style={styles.toggleText}>Include location</Text>
                  </TouchableOpacity>
               </View>

               {includeLocation && (
                  <View style={styles.locationBox}>
                     {isGettingLocation ? (
                        <View style={styles.locationLoading}>
                           <ActivityIndicator size="small" color="#2196F3" />
                           <Text style={styles.locationLoadingText}>Getting location...</Text>
                        </View>
                     ) : location ? (
                        <View>
                           <View style={styles.locationItem}>
                              <Ionicons name="location" size={16} color="#2196F3" />
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
                  <Text style={styles.summaryValue}>Scheduled Attendance</Text>
               </View>
               <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Date:</Text>
                  <Text style={styles.summaryValue}>{formatDate(scheduledDate)}</Text>
               </View>
               <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Time:</Text>
                  <Text style={styles.summaryValue}>{formatTime(scheduledDate)}</Text>
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
               style={[
                  styles.button,
                  styles.submitButton,
                  !isValidSchedule && styles.submitButtonDisabled,
               ]}
               onPress={handleSubmit}
               disabled={isLoading || !isValidSchedule}
            >
               {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
               ) : (
                  <>
                     <Ionicons name="calendar-sharp" size={20} color="#ffffff" />
                     <Text style={styles.submitButtonText}>Schedule</Text>
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
   dateTimeRow: {
      flexDirection: 'row',
      gap: 12,
   },
   dateTimeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1a1a1a',
      borderWidth: 1,
      borderColor: '#2a2a2a',
      borderRadius: 12,
      padding: 16,
      gap: 12,
   },
   dateTimeText: {
      fontSize: 15,
      color: '#ffffff',
      fontWeight: '500',
   },
   warningBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#2d1f0d',
      padding: 12,
      borderRadius: 8,
      marginTop: 12,
      borderWidth: 1,
      borderColor: '#4a3319',
   },
   warningText: {
      fontSize: 13,
      color: '#FFB74D',
      marginLeft: 8,
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
      backgroundColor: '#2196F3',
   },
   submitButtonDisabled: {
      backgroundColor: '#1a1a1a',
      opacity: 0.5,
   },
   submitButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginLeft: 8,
   },
});
