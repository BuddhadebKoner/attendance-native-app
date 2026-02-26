import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   Modal,
   Dimensions,
   Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import type { AttendanceRecord, User } from '../../../types/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.65;

interface ScannedEntry {
   student: User;
   status: string;
   time: string;
}

interface QRScannerModalProps {
   visible: boolean;
   onClose: () => void;
   studentRecords: AttendanceRecord[];
   onStudentScanned: (studentId: string) => void;
   scanPaused: boolean;
   recentScans: ScannedEntry[];
}

export default function QRScannerModal({
   visible,
   onClose,
   studentRecords,
   onStudentScanned,
   scanPaused,
   recentScans,
}: QRScannerModalProps) {
   const [permission, requestPermission] = useCameraPermissions();
   const [errorMessage, setErrorMessage] = useState<string | null>(null);
   const lastScannedIdRef = useRef<string | null>(null);
   const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
   const scanLineAnim = useRef(new Animated.Value(0)).current;

   // Scan line animation
   useEffect(() => {
      if (visible && !scanPaused) {
         const animation = Animated.loop(
            Animated.sequence([
               Animated.timing(scanLineAnim, {
                  toValue: 1,
                  duration: 2000,
                  useNativeDriver: true,
               }),
               Animated.timing(scanLineAnim, {
                  toValue: 0,
                  duration: 2000,
                  useNativeDriver: true,
               }),
            ])
         );
         animation.start();
         return () => animation.stop();
      }
   }, [visible, scanPaused]);

   // Clear cooldown on unmount
   useEffect(() => {
      return () => {
         if (cooldownTimerRef.current) {
            clearTimeout(cooldownTimerRef.current);
         }
      };
   }, []);

   // Reset state when modal opens
   useEffect(() => {
      if (visible) {
         lastScannedIdRef.current = null;
         setErrorMessage(null);
      }
   }, [visible]);

   const getStatusColor = (status: string) => {
      switch (status) {
         case 'present': return '#4CAF50';
         case 'absent': return '#F44336';
         case 'late': return '#FF9800';
         case 'excused': return '#2196F3';
         default: return '#888';
      }
   };

   const handleBarcodeScanned = useCallback(
      ({ data }: { data: string }) => {
         if (scanPaused) return;

         // Clear previous error
         setErrorMessage(null);

         // Validate: must be a non-empty string (MongoDB ObjectId is 24 hex chars)
         if (!data || typeof data !== 'string') {
            setErrorMessage('Invalid QR code');
            return;
         }

         const scannedId = data.trim();

         // Basic ObjectId format check (24 hex characters)
         if (!/^[a-fA-F0-9]{24}$/.test(scannedId)) {
            setErrorMessage('Invalid QR code format');
            clearErrorAfterDelay();
            return;
         }

         // Duplicate rapid scan cooldown (3 seconds)
         if (lastScannedIdRef.current === scannedId) {
            return; // Silently ignore
         }

         // Check if student is in this attendance
         const studentRecord = studentRecords.find((r) => {
            const student = typeof r.student === 'object' ? r.student : null;
            return student?._id === scannedId;
         });

         if (!studentRecord) {
            setErrorMessage('Student not found in this class');
            clearErrorAfterDelay();
            // Set cooldown so we don't spam for same invalid code
            lastScannedIdRef.current = scannedId;
            if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
            cooldownTimerRef.current = setTimeout(() => {
               lastScannedIdRef.current = null;
            }, 3000);
            return;
         }

         // Valid scan — set cooldown and notify parent
         lastScannedIdRef.current = scannedId;
         if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
         cooldownTimerRef.current = setTimeout(() => {
            lastScannedIdRef.current = null;
         }, 3000);

         onStudentScanned(scannedId);
      },
      [scanPaused, studentRecords, onStudentScanned]
   );

   const clearErrorAfterDelay = () => {
      setTimeout(() => setErrorMessage(null), 3000);
   };

   const scanLineTranslateY = scanLineAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, SCAN_AREA_SIZE - 4],
   });

   // Permission not yet determined
   if (!permission) {
      return (
         <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={styles.container}>
               <View style={styles.centerContent}>
                  <Text style={styles.permissionText}>Loading camera...</Text>
               </View>
            </SafeAreaView>
         </Modal>
      );
   }

   // Permission denied
   if (!permission.granted) {
      return (
         <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={styles.container}>
               <View style={styles.permissionHeader}>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                     <Ionicons name="close" size={28} color="#ffffff" />
                  </TouchableOpacity>
               </View>
               <View style={styles.centerContent}>
                  <Ionicons name="camera-outline" size={80} color="#555" />
                  <Text style={styles.permissionTitle}>Camera Permission Required</Text>
                  <Text style={styles.permissionText}>
                     Allow camera access to scan student QR codes for attendance marking.
                  </Text>
                  <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                     <Ionicons name="camera" size={20} color="#000" />
                     <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
                  </TouchableOpacity>
               </View>
            </SafeAreaView>
         </Modal>
      );
   }

   return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
         <View style={styles.container}>
            <CameraView
               style={StyleSheet.absoluteFillObject}
               facing="back"
               barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
               }}
               onBarcodeScanned={scanPaused ? undefined : handleBarcodeScanned}
            />

            {/* Overlay with scan area cutout */}
            <View style={styles.overlay}>
               {/* Top overlay */}
               <SafeAreaView style={styles.topOverlay}>
                  <View style={styles.header}>
                     <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color="#ffffff" />
                     </TouchableOpacity>
                     <Text style={styles.headerTitle}>Scan QR Code</Text>
                     <View style={{ width: 44 }} />
                  </View>
               </SafeAreaView>

               {/* Middle row: left overlay | scan area | right overlay */}
               <View style={styles.middleRow}>
                  <View style={styles.sideOverlay} />
                  <View style={styles.scanArea}>
                     {/* Corner markers */}
                     <View style={[styles.corner, styles.topLeft]} />
                     <View style={[styles.corner, styles.topRight]} />
                     <View style={[styles.corner, styles.bottomLeft]} />
                     <View style={[styles.corner, styles.bottomRight]} />

                     {/* Animated scan line */}
                     {!scanPaused && (
                        <Animated.View
                           style={[
                              styles.scanLine,
                              { transform: [{ translateY: scanLineTranslateY }] },
                           ]}
                        />
                     )}

                     {scanPaused && (
                        <View style={styles.pausedOverlay}>
                           <Ionicons name="pause-circle" size={48} color="#ffffff" />
                           <Text style={styles.pausedText}>Processing...</Text>
                        </View>
                     )}
                  </View>
                  <View style={styles.sideOverlay} />
               </View>

               {/* Bottom overlay with instructions and recent scans */}
               <View style={styles.bottomOverlay}>
                  <Text style={styles.instructionText}>
                     Point camera at a student's QR code
                  </Text>

                  {/* Error message */}
                  {errorMessage && (
                     <View style={styles.errorBanner}>
                        <Ionicons name="alert-circle" size={20} color="#F44336" />
                        <Text style={styles.errorText}>{errorMessage}</Text>
                     </View>
                  )}

                  {/* Recent scans */}
                  {recentScans.length > 0 && (
                     <View style={styles.recentScansContainer}>
                        <Text style={styles.recentScansTitle}>
                           Recently Scanned ({recentScans.length})
                        </Text>
                        {recentScans.slice(0, 5).map((entry, index) => (
                           <View key={`${entry.student._id}-${index}`} style={styles.recentScanItem}>
                              <View
                                 style={[
                                    styles.recentDot,
                                    { backgroundColor: getStatusColor(entry.status) },
                                 ]}
                              />
                              <Text style={styles.recentName} numberOfLines={1}>
                                 {entry.student.name || 'Student'}
                              </Text>
                              <View
                                 style={[
                                    styles.recentBadge,
                                    { backgroundColor: getStatusColor(entry.status) + '30' },
                                 ]}
                              >
                                 <Text
                                    style={[
                                       styles.recentBadgeText,
                                       { color: getStatusColor(entry.status) },
                                    ]}
                                 >
                                    {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                                 </Text>
                              </View>
                              <Text style={styles.recentTime}>{entry.time}</Text>
                           </View>
                        ))}
                     </View>
                  )}
               </View>
            </View>
         </View>
      </Modal>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: '#000000',
   },
   overlay: {
      ...StyleSheet.absoluteFillObject,
   },
   topOverlay: {
      backgroundColor: 'rgba(0,0,0,0.7)',
   },
   header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
   },
   headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#ffffff',
   },
   closeButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
   },
   middleRow: {
      flexDirection: 'row',
      height: SCAN_AREA_SIZE,
   },
   sideOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
   },
   scanArea: {
      width: SCAN_AREA_SIZE,
      height: SCAN_AREA_SIZE,
      position: 'relative',
      overflow: 'hidden',
   },
   corner: {
      position: 'absolute',
      width: 24,
      height: 24,
      borderColor: '#ffffff',
   },
   topLeft: {
      top: 0,
      left: 0,
      borderTopWidth: 3,
      borderLeftWidth: 3,
      borderTopLeftRadius: 4,
   },
   topRight: {
      top: 0,
      right: 0,
      borderTopWidth: 3,
      borderRightWidth: 3,
      borderTopRightRadius: 4,
   },
   bottomLeft: {
      bottom: 0,
      left: 0,
      borderBottomWidth: 3,
      borderLeftWidth: 3,
      borderBottomLeftRadius: 4,
   },
   bottomRight: {
      bottom: 0,
      right: 0,
      borderBottomWidth: 3,
      borderRightWidth: 3,
      borderBottomRightRadius: 4,
   },
   scanLine: {
      position: 'absolute',
      left: 8,
      right: 8,
      height: 3,
      backgroundColor: '#4CAF50',
      borderRadius: 2,
      shadowColor: '#4CAF50',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 6,
      elevation: 4,
   },
   pausedOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
   },
   pausedText: {
      color: '#ffffff',
      fontSize: 14,
      marginTop: 8,
   },
   bottomOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      paddingHorizontal: 20,
      paddingTop: 20,
   },
   instructionText: {
      color: '#cccccc',
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 12,
   },
   errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(244, 67, 54, 0.15)',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      gap: 8,
      marginBottom: 12,
   },
   errorText: {
      color: '#F44336',
      fontSize: 14,
      fontWeight: '600',
      flex: 1,
   },
   centerContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      gap: 16,
   },
   permissionHeader: {
      alignItems: 'flex-start',
      paddingHorizontal: 16,
      paddingTop: 8,
   },
   permissionTitle: {
      color: '#ffffff',
      fontSize: 22,
      fontWeight: '700',
      textAlign: 'center',
   },
   permissionText: {
      color: '#888',
      fontSize: 15,
      textAlign: 'center',
      lineHeight: 22,
   },
   permissionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
      marginTop: 8,
   },
   permissionButtonText: {
      color: '#000000',
      fontSize: 16,
      fontWeight: '700',
   },
   recentScansContainer: {
      marginTop: 4,
   },
   recentScansTitle: {
      color: '#888',
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 8,
   },
   recentScanItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      gap: 8,
   },
   recentDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
   },
   recentName: {
      flex: 1,
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '500',
   },
   recentBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
   },
   recentBadgeText: {
      fontSize: 11,
      fontWeight: '600',
   },
   recentTime: {
      color: '#666',
      fontSize: 11,
   },
});
