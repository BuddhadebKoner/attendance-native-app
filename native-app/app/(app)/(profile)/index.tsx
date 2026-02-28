import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useEnrolledClasses } from '../../../hooks/queries';
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';

export default function ProfileScreen() {
   const { user, logout, isAuthenticated } = useAuth();
   const router = useRouter();
   const [showQRModal, setShowQRModal] = useState(false);
   const viewShotRef = useRef<any>(null);
   const isStudent = user?.role === 'student';
   const { data: enrolledData } = useEnrolledClasses(undefined, isAuthenticated && isStudent);
   const pendingCount = enrolledData?.enrolledClasses?.filter((c: any) => c.enrollmentStatus === 'pending')?.length || 0;

   // Show login-required screen for unauthenticated users
   if (!isAuthenticated) {
      return (
         <SafeAreaView style={styles.container}>
            <View style={styles.loginRequiredContainer}>
               <View style={styles.loginRequiredIconCircle}>
                  <Ionicons name="lock-closed-outline" size={48} color="#007AFF" />
               </View>
               <Text style={styles.loginRequiredTitle}>Login Required</Text>
               <Text style={styles.loginRequiredSubtitle}>
                  You need to log in to view your profile, QR code, and settings
               </Text>
               <TouchableOpacity
                  style={styles.loginRequiredButton}
                  onPress={() => router.push('/(public)/login')}
               >
                  <Text style={styles.loginRequiredButtonText}>Sign in with Google</Text>
               </TouchableOpacity>
            </View>
         </SafeAreaView>
      );
   }

   const handleLogout = () => {
      Alert.alert(
         'Logout',
         'Are you sure you want to logout?',
         [
            { text: 'Cancel', style: 'cancel' },
            {
               text: 'Logout',
               style: 'destructive',
               onPress: async () => {
                  await logout();
               },
            },
         ]
      );
   };

   const handleDownloadQR = async () => {
      try {
         // Check if sharing is available
         const isAvailable = await Sharing.isAvailableAsync();
         if (!isAvailable) {
            Alert.alert('Error', 'Sharing is not available on this device.');
            return;
         }

         // Capture the entire card
         if (viewShotRef.current) {
            const uri = await viewShotRef.current.capture();

            // Share the captured image
            await Sharing.shareAsync(uri, {
               mimeType: 'image/png',
               dialogTitle: 'Save QR Code Card',
               UTI: 'public.png'
            });
         }
      } catch (error) {
         console.error('Error downloading QR code:', error);
         Alert.alert('Error', 'Failed to download QR code. Please try again.');
      }
   };

   const ProfileItem = ({ label, value }: { label: string; value: string }) => (
      <View style={styles.profileItem}>
         <Text style={styles.profileLabel}>{label}</Text>
         <Text style={styles.profileValue}>{value}</Text>
      </View>
   );

   return (
      <SafeAreaView style={styles.container}>
         <ScrollView style={styles.scrollView}>
            <View style={styles.header}>
               {user?.profilePicture ? (
                  <Image
                     source={{ uri: user.profilePicture }}
                     style={styles.avatarImage}
                  />
               ) : (
                  <View style={styles.avatarLarge}>
                     <Text style={styles.avatarTextLarge}>
                        {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                     </Text>
                  </View>
               )}
               <Text style={styles.userName}>{user?.name || 'User'}</Text>
               <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
            </View>

            <View style={styles.section}>
               <Text style={styles.sectionTitle}>Personal Information</Text>
               <View style={styles.card}>
                  <ProfileItem label="User ID" value={user?._id || 'N/A'} />
                  <ProfileItem label="Mobile" value={user?.mobile || 'N/A'} />
                  <ProfileItem label="Name" value={user?.name || 'Not provided'} />
                  <ProfileItem label="Email" value={user?.email || 'Not provided'} />
                  <ProfileItem
                     label="Role"
                     value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Not set'}
                  />
                  <ProfileItem
                     label="Member Since"
                     value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                  />
               </View>
            </View>

            <View style={styles.section}>
               <Text style={styles.sectionTitle}>Settings</Text>
               {isStudent && (
                  <TouchableOpacity
                     style={styles.settingItem}
                     onPress={() => router.push('/(app)/(profile)/enrolled-classes')}
                  >
                     <View style={styles.settingRow}>
                        <Text style={styles.settingText}>Enrolled Classes</Text>
                        {pendingCount > 0 && (
                           <View style={styles.settingPendingBadge}>
                              <Text style={styles.settingPendingBadgeText}>{pendingCount} pending</Text>
                           </View>
                        )}
                     </View>
                     <Text style={styles.settingArrow}>›</Text>
                  </TouchableOpacity>
               )}
               <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() => setShowQRModal(true)}
               >
                  <Text style={styles.settingText}>My QR Code</Text>
                  <Text style={styles.settingArrow}>›</Text>
               </TouchableOpacity>
               <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() => router.push('/(app)/(profile)/my-attendance-stats')}
               >
                  <Text style={styles.settingText}>My Attendance Stats</Text>
                  <Text style={styles.settingArrow}>›</Text>
               </TouchableOpacity>
               <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() => router.push('/(app)/(profile)/edit')}
               >
                  <Text style={styles.settingText}>Edit Profile</Text>
                  <Text style={styles.settingArrow}>›</Text>
               </TouchableOpacity>
               <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() => router.push('/(app)/(profile)/notifications')}
               >
                  <Text style={styles.settingText}>Notifications</Text>
                  <Text style={styles.settingArrow}>›</Text>
               </TouchableOpacity>
               <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() => router.push('/(app)/(profile)/privacy')}
               >
                  <Text style={styles.settingText}>Privacy</Text>
                  <Text style={styles.settingArrow}>›</Text>
               </TouchableOpacity>
            </View>

            <View style={styles.section}>
               <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                  <Text style={styles.logoutText}>Logout</Text>
               </TouchableOpacity>
            </View>

            <Modal
               visible={showQRModal}
               transparent={true}
               animationType="fade"
               onRequestClose={() => setShowQRModal(false)}
            >
               <View style={styles.modalOverlay}>
                  <TouchableOpacity
                     style={styles.closeIconButton}
                     onPress={() => setShowQRModal(false)}
                  >
                     <Ionicons name="close-circle" size={32} color="#ffffff" />
                  </TouchableOpacity>
                  <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
                     <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>My QR Code</Text>
                        <Text style={styles.modalSubtitle}>User ID: {user?._id || 'N/A'}</Text>

                        <View style={styles.qrContainer}>
                           {user?._id ? (
                              <QRCode
                                 value={user._id}
                                 size={200}
                                 color="#000000"
                                 backgroundColor="#ffffff"
                              />
                           ) : (
                              <Text style={styles.noDataText}>No user ID available</Text>
                           )}
                        </View>

                        <Text style={styles.qrDescription}>
                           Share this QR code to share your profile
                        </Text>

                        <TouchableOpacity
                           style={styles.downloadButton}
                           onPress={handleDownloadQR}
                        >
                           <Text style={styles.downloadButtonText}>Download QR Code</Text>
                        </TouchableOpacity>
                     </View>
                  </ViewShot>
               </View>
            </Modal>
         </ScrollView>
      </SafeAreaView>
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
      alignItems: 'center',
      padding: 20,
      paddingTop: 10,
   },
   avatarLarge: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: '#333',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
   },
   avatarTextLarge: {
      fontSize: 40,
      fontWeight: 'bold',
      color: '#ffffff',
   },
   avatarImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginBottom: 16,
   },
   userName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 4,
   },
   userEmail: {
      fontSize: 14,
      color: '#888',
   },
   section: {
      padding: 20,
      paddingTop: 10,
   },
   sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 12,
   },
   card: {
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: '#333',
      gap: 16,
   },
   profileItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
   },
   profileLabel: {
      fontSize: 14,
      color: '#888',
   },
   profileValue: {
      fontSize: 14,
      fontWeight: '600',
      color: '#ffffff',
   },
   settingItem: {
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
      borderWidth: 1,
      borderColor: '#333',
   },
   settingText: {
      fontSize: 16,
      color: '#ffffff',
   },
   settingArrow: {
      fontSize: 24,
      color: '#888',
   },
   settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
   },
   settingPendingBadge: {
      backgroundColor: 'rgba(255, 193, 7, 0.15)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
   },
   settingPendingBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FFC107',
   },
   logoutButton: {
      backgroundColor: '#dc2626',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
   },
   logoutText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
   },
   modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
   },
   closeIconButton: {
      position: 'absolute',
      top: 50,
      right: 20,
      zIndex: 10,
      padding: 5,
   },
   modalContent: {
      backgroundColor: '#1a1a1a',
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      width: '85%',
      maxWidth: 350,
      borderWidth: 1,
      borderColor: '#333',
   },
   modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 8,
   },
   modalSubtitle: {
      fontSize: 12,
      color: '#888',
      marginBottom: 24,
   },
   qrContainer: {
      backgroundColor: '#ffffff',
      padding: 20,
      borderRadius: 12,
      marginBottom: 16,
   },
   noDataText: {
      fontSize: 14,
      color: '#666',
      padding: 20,
   },
   qrDescription: {
      fontSize: 14,
      color: '#888',
      textAlign: 'center',
      marginBottom: 20,
   },
   downloadButton: {
      backgroundColor: '#10b981',
      borderRadius: 12,
      padding: 14,
      width: '100%',
      alignItems: 'center',
   },
   downloadButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
   },
   loginRequiredContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
   },
   loginRequiredIconCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: '#1a1a1a',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#333',
   },
   loginRequiredTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 12,
   },
   loginRequiredSubtitle: {
      fontSize: 15,
      color: '#888',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 32,
   },
   loginRequiredButton: {
      backgroundColor: '#007AFF',
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 48,
      width: '100%',
      alignItems: 'center',
      marginBottom: 12,
   },
   loginRequiredButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
   },
});
