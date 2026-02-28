import React, { useRef } from 'react';
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   Modal,
   Alert,
   Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

interface ClassQRCodeModalProps {
   visible: boolean;
   onClose: () => void;
   classId: string;
   className: string;
   subject: string;
}

export const ClassQRCodeModal: React.FC<ClassQRCodeModalProps> = ({
   visible,
   onClose,
   classId,
   className,
   subject,
}) => {
   const viewShotRef = useRef<any>(null);

   const qrValue = JSON.stringify({ type: 'class-join', classId });

   const handleShareQR = async () => {
      try {
         if (!viewShotRef.current?.capture) {
            Alert.alert('Error', 'Unable to capture QR code');
            return;
         }

         const uri = await viewShotRef.current.capture();

         if (Platform.OS === 'web') {
            Alert.alert('Info', 'Sharing is not supported on web');
            return;
         }

         const isAvailable = await Sharing.isAvailableAsync();
         if (!isAvailable) {
            Alert.alert('Error', 'Sharing is not available on this device');
            return;
         }

         await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: `QR Code for ${className}`,
         });
      } catch (error) {
         console.error('Error sharing QR:', error);
         Alert.alert('Error', 'Failed to share QR code');
      }
   };

   return (
      <Modal
         visible={visible}
         transparent={true}
         animationType="fade"
         onRequestClose={onClose}
      >
         <View style={styles.modalOverlay}>
            <TouchableOpacity
               style={styles.closeIconButton}
               onPress={onClose}
            >
               <Ionicons name="close-circle" size={32} color="#ffffff" />
            </TouchableOpacity>

            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
               <View style={styles.modalContent}>
                  <View style={styles.classIconWrapper}>
                     <Ionicons name="school" size={28} color="#ffffff" />
                  </View>

                  <Text style={styles.modalTitle}>{className}</Text>
                  <Text style={styles.modalSubtitle}>{subject}</Text>

                  <View style={styles.qrContainer}>
                     <QRCode
                        value={qrValue}
                        size={200}
                        color="#000000"
                        backgroundColor="#ffffff"
                     />
                  </View>

                  <Text style={styles.qrDescription}>
                     Students can scan this QR code to request joining your class
                  </Text>
               </View>
            </ViewShot>

            <View style={styles.actionRow}>
               <TouchableOpacity
                  style={styles.shareButton}
                  onPress={handleShareQR}
               >
                  <Ionicons name="share-outline" size={20} color="#ffffff" />
                  <Text style={styles.shareButtonText}>Share / Download</Text>
               </TouchableOpacity>
            </View>
         </View>
      </Modal>
   );
};

const styles = StyleSheet.create({
   modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
   },
   closeIconButton: {
      position: 'absolute',
      top: 60,
      right: 20,
      zIndex: 10,
      padding: 4,
   },
   modalContent: {
      backgroundColor: '#1a1a1a',
      borderRadius: 20,
      padding: 28,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#333',
      width: 300,
   },
   classIconWrapper: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: '#007AFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
   },
   modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#ffffff',
      textAlign: 'center',
      marginBottom: 4,
   },
   modalSubtitle: {
      fontSize: 14,
      color: '#888',
      marginBottom: 20,
   },
   qrContainer: {
      backgroundColor: '#ffffff',
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
   },
   qrDescription: {
      fontSize: 13,
      color: '#888',
      textAlign: 'center',
      lineHeight: 18,
      paddingHorizontal: 8,
   },
   actionRow: {
      marginTop: 20,
      width: 300,
   },
   shareButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#10b981',
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
   },
   shareButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
   },
});
