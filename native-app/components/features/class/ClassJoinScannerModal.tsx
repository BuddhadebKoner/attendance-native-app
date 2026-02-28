import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   Modal,
   Dimensions,
   Animated,
   Alert,
   ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRequestJoinClass } from '../../../hooks/queries';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.65;

interface ClassJoinScannerModalProps {
   visible: boolean;
   onClose: () => void;
}

export const ClassJoinScannerModal: React.FC<ClassJoinScannerModalProps> = ({
   visible,
   onClose,
}) => {
   const [permission, requestPermission] = useCameraPermissions();
   const [errorMessage, setErrorMessage] = useState<string | null>(null);
   const [isProcessing, setIsProcessing] = useState(false);
   const lastScannedRef = useRef<string | null>(null);
   const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
   const scanLineAnim = useRef(new Animated.Value(0)).current;
   const requestJoinMutation = useRequestJoinClass();

   // Scan line animation
   useEffect(() => {
      if (visible && !isProcessing) {
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
   }, [visible, isProcessing]);

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
         setErrorMessage(null);
         setIsProcessing(false);
         lastScannedRef.current = null;
      }
   }, [visible]);

   const handleBarcodeScanned = useCallback(
      async ({ data }: { data: string }) => {
         if (isProcessing) return;

         // Clear previous error
         setErrorMessage(null);

         // Validate and parse QR data
         let parsed: { type?: string; classId?: string };
         try {
            parsed = JSON.parse(data);
         } catch {
            setErrorMessage('Invalid QR code format');
            return;
         }

         if (parsed.type !== 'class-join' || !parsed.classId) {
            setErrorMessage('This is not a class QR code');
            return;
         }

         const { classId } = parsed;

         // Cooldown: prevent re-scanning same class
         if (lastScannedRef.current === classId) return;
         lastScannedRef.current = classId;

         // Clear cooldown after 3 seconds
         if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
         cooldownTimerRef.current = setTimeout(() => {
            lastScannedRef.current = null;
         }, 3000);

         // Send join request
         setIsProcessing(true);
         try {
            const result = await requestJoinMutation.mutateAsync(classId);
            Alert.alert(
               'Request Sent!',
               `Your request to join "${result.className}" (${result.subject}) has been sent. The teacher will review your request.`,
               [{ text: 'OK', onPress: onClose }]
            );
         } catch (error: any) {
            const message =
               error?.response?.data?.message ||
               error?.message ||
               'Failed to send join request';
            setErrorMessage(message);
            setIsProcessing(false);
         }
      },
      [isProcessing, requestJoinMutation, onClose]
   );

   const scanLineTranslate = scanLineAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, SCAN_AREA_SIZE - 4],
   });

   // Permission not yet determined
   if (!permission) {
      return (
         <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={styles.container}>
               <View style={styles.permissionContainer}>
                  <ActivityIndicator size="large" color="#ffffff" />
                  <Text style={styles.permissionText}>Checking camera permission...</Text>
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
               <View style={styles.header}>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                     <Ionicons name="close" size={28} color="#ffffff" />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>Scan Class QR</Text>
                  <View style={styles.closeButton} />
               </View>
               <View style={styles.permissionContainer}>
                  <View style={styles.permissionIconCircle}>
                     <Ionicons name="camera-outline" size={48} color="#007AFF" />
                  </View>
                  <Text style={styles.permissionTitle}>Camera Access Needed</Text>
                  <Text style={styles.permissionText}>
                     Allow camera access to scan class QR codes and join classes
                  </Text>
                  <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
                     <Text style={styles.grantButtonText}>Grant Camera Access</Text>
                  </TouchableOpacity>
               </View>
            </SafeAreaView>
         </Modal>
      );
   }

   return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
         <SafeAreaView style={styles.container}>
            {/* Camera */}
            <CameraView
               style={StyleSheet.absoluteFillObject}
               facing="back"
               barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
               }}
               onBarcodeScanned={isProcessing ? undefined : handleBarcodeScanned}
            />

            {/* Overlay: top */}
            <View style={styles.overlayTop}>
               <View style={styles.header}>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                     <Ionicons name="close" size={28} color="#ffffff" />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>Scan Class QR</Text>
                  <View style={styles.closeButton} />
               </View>
            </View>

            {/* Overlay: middle row */}
            <View style={styles.overlayMiddle}>
               <View style={styles.overlaySide} />

               {/* Scan area cutout */}
               <View style={styles.scanArea}>
                  {/* Corner markers */}
                  <View style={[styles.corner, styles.cornerTopLeft]} />
                  <View style={[styles.corner, styles.cornerTopRight]} />
                  <View style={[styles.corner, styles.cornerBottomLeft]} />
                  <View style={[styles.corner, styles.cornerBottomRight]} />

                  {/* Animated scan line */}
                  {!isProcessing && (
                     <Animated.View
                        style={[
                           styles.scanLine,
                           { transform: [{ translateY: scanLineTranslate }] },
                        ]}
                     />
                  )}

                  {/* Processing overlay */}
                  {isProcessing && (
                     <View style={styles.processingOverlay}>
                        <ActivityIndicator size="large" color="#10b981" />
                        <Text style={styles.processingText}>Sending request...</Text>
                     </View>
                  )}
               </View>

               <View style={styles.overlaySide} />
            </View>

            {/* Overlay: bottom */}
            <View style={styles.overlayBottom}>
               {/* Error banner */}
               {errorMessage && (
                  <View style={styles.errorBanner}>
                     <Ionicons name="alert-circle" size={18} color="#F44336" />
                     <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
               )}

               <View style={styles.instructionContainer}>
                  <Ionicons name="qr-code-outline" size={24} color="#ffffff" />
                  <Text style={styles.instructionText}>
                     Point your camera at a class QR code to send a join request
                  </Text>
               </View>
            </View>
         </SafeAreaView>
      </Modal>
   );
};

const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;
const OVERLAY_COLOR = 'rgba(0, 0, 0, 0.65)';

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: '#000000',
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
      fontWeight: '600',
      color: '#ffffff',
   },
   closeButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
   },

   // Overlay sections
   overlayTop: {
      backgroundColor: OVERLAY_COLOR,
      paddingTop: 4,
   },
   overlayMiddle: {
      flexDirection: 'row',
   },
   overlaySide: {
      flex: 1,
      backgroundColor: OVERLAY_COLOR,
   },
   overlayBottom: {
      flex: 1,
      backgroundColor: OVERLAY_COLOR,
      paddingHorizontal: 20,
      paddingTop: 24,
   },

   // Scan area
   scanArea: {
      width: SCAN_AREA_SIZE,
      height: SCAN_AREA_SIZE,
      position: 'relative',
   },
   corner: {
      position: 'absolute',
      width: CORNER_SIZE,
      height: CORNER_SIZE,
   },
   cornerTopLeft: {
      top: 0,
      left: 0,
      borderTopWidth: CORNER_WIDTH,
      borderLeftWidth: CORNER_WIDTH,
      borderColor: '#10b981',
      borderTopLeftRadius: 4,
   },
   cornerTopRight: {
      top: 0,
      right: 0,
      borderTopWidth: CORNER_WIDTH,
      borderRightWidth: CORNER_WIDTH,
      borderColor: '#10b981',
      borderTopRightRadius: 4,
   },
   cornerBottomLeft: {
      bottom: 0,
      left: 0,
      borderBottomWidth: CORNER_WIDTH,
      borderLeftWidth: CORNER_WIDTH,
      borderColor: '#10b981',
      borderBottomLeftRadius: 4,
   },
   cornerBottomRight: {
      bottom: 0,
      right: 0,
      borderBottomWidth: CORNER_WIDTH,
      borderRightWidth: CORNER_WIDTH,
      borderColor: '#10b981',
      borderBottomRightRadius: 4,
   },
   scanLine: {
      position: 'absolute',
      left: 8,
      right: 8,
      height: 2,
      backgroundColor: '#10b981',
      borderRadius: 1,
      shadowColor: '#10b981',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 4,
   },

   // Processing
   processingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 4,
      gap: 12,
   },
   processingText: {
      fontSize: 14,
      color: '#10b981',
      fontWeight: '600',
   },

   // Error
   errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(244, 67, 54, 0.15)',
      borderRadius: 10,
      padding: 12,
      gap: 8,
      marginBottom: 16,
   },
   errorText: {
      fontSize: 13,
      color: '#F44336',
      flex: 1,
   },

   // Instruction
   instructionContainer: {
      alignItems: 'center',
      gap: 10,
   },
   instructionText: {
      fontSize: 14,
      color: '#aaa',
      textAlign: 'center',
      lineHeight: 20,
   },

   // Permission
   permissionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
   },
   permissionIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(0, 122, 255, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
   },
   permissionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 8,
   },
   permissionText: {
      fontSize: 14,
      color: '#888',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
   },
   grantButton: {
      backgroundColor: '#007AFF',
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderRadius: 12,
   },
   grantButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
   },
});
