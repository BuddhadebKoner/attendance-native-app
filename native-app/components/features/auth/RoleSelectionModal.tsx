import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface RoleSelectionModalProps {
   visible: boolean;
   onSelect: (role: 'teacher' | 'student') => void;
   isLoading: boolean;
}

export default function RoleSelectionModal({ visible, onSelect, isLoading }: RoleSelectionModalProps) {
   const [selectedRole, setSelectedRole] = useState<'teacher' | 'student' | null>(null);

   const handleConfirm = () => {
      if (selectedRole) {
         onSelect(selectedRole);
      }
   };

   return (
      <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
         <View style={styles.overlay}>
            <View style={styles.container}>
               <View style={styles.handle} />

               <Text style={styles.title}>Welcome! 👋</Text>
               <Text style={styles.subtitle}>What best describes your account?</Text>

               <View style={styles.cardsContainer}>
                  <TouchableOpacity
                     style={[
                        styles.roleCard,
                        selectedRole === 'teacher' && styles.roleCardSelected,
                     ]}
                     onPress={() => setSelectedRole('teacher')}
                     disabled={isLoading}
                     activeOpacity={0.7}
                  >
                     <View style={[styles.iconCircle, selectedRole === 'teacher' && styles.iconCircleSelected]}>
                        <MaterialCommunityIcons
                           name="school-outline"
                           size={32}
                           color={selectedRole === 'teacher' ? '#007AFF' : '#888'}
                        />
                     </View>
                     <Text style={[styles.roleTitle, selectedRole === 'teacher' && styles.roleTitleSelected]}>
                        Teacher
                     </Text>
                     <Text style={styles.roleDescription}>
                        I create classes and take attendance
                     </Text>
                     {selectedRole === 'teacher' && (
                        <View style={styles.checkmark}>
                           <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                        </View>
                     )}
                  </TouchableOpacity>

                  <TouchableOpacity
                     style={[
                        styles.roleCard,
                        selectedRole === 'student' && styles.roleCardSelected,
                     ]}
                     onPress={() => setSelectedRole('student')}
                     disabled={isLoading}
                     activeOpacity={0.7}
                  >
                     <View style={[styles.iconCircle, selectedRole === 'student' && styles.iconCircleSelected]}>
                        <Ionicons
                           name="person-outline"
                           size={32}
                           color={selectedRole === 'student' ? '#007AFF' : '#888'}
                        />
                     </View>
                     <Text style={[styles.roleTitle, selectedRole === 'student' && styles.roleTitleSelected]}>
                        Student
                     </Text>
                     <Text style={styles.roleDescription}>
                        I attend classes and mark my attendance
                     </Text>
                     {selectedRole === 'student' && (
                        <View style={styles.checkmark}>
                           <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                        </View>
                     )}
                  </TouchableOpacity>
               </View>

               <Text style={styles.note}>You can change this later in your profile settings</Text>

               <TouchableOpacity
                  style={[styles.confirmButton, !selectedRole && styles.confirmButtonDisabled]}
                  onPress={handleConfirm}
                  disabled={!selectedRole || isLoading}
               >
                  {isLoading ? (
                     <ActivityIndicator color="#ffffff" />
                  ) : (
                     <Text style={styles.confirmButtonText}>Continue</Text>
                  )}
               </TouchableOpacity>
            </View>
         </View>
      </Modal>
   );
}

const styles = StyleSheet.create({
   overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'flex-end',
   },
   container: {
      backgroundColor: '#1a1a1a',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
   },
   handle: {
      width: 40,
      height: 4,
      backgroundColor: '#444',
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 24,
   },
   title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#ffffff',
      textAlign: 'center',
      marginBottom: 8,
   },
   subtitle: {
      fontSize: 15,
      color: '#888',
      textAlign: 'center',
      marginBottom: 24,
   },
   cardsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
   },
   roleCard: {
      flex: 1,
      backgroundColor: '#222',
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#333',
      position: 'relative',
   },
   roleCardSelected: {
      borderColor: '#007AFF',
      backgroundColor: '#0a1a2f',
   },
   iconCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#333',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
   },
   iconCircleSelected: {
      backgroundColor: '#1a2a4a',
   },
   roleTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: 6,
   },
   roleTitleSelected: {
      color: '#007AFF',
   },
   roleDescription: {
      fontSize: 12,
      color: '#888',
      textAlign: 'center',
      lineHeight: 16,
   },
   checkmark: {
      position: 'absolute',
      top: 10,
      right: 10,
   },
   note: {
      fontSize: 12,
      color: '#666',
      textAlign: 'center',
      marginBottom: 20,
   },
   confirmButton: {
      backgroundColor: '#007AFF',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
   },
   confirmButtonDisabled: {
      backgroundColor: '#333',
   },
   confirmButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
   },
});
