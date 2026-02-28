import React, { useState, useCallback } from 'react';
import {
   View,
   Text,
   StyleSheet,
   FlatList,
   TouchableOpacity,
   RefreshControl,
   Alert,
   ActivityIndicator,
   Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useJoinRequests, useApproveJoinRequest, useDenyJoinRequest } from '../../../hooks/queries';
import type { JoinRequestItem } from '../../../types/api';

export default function JoinRequestsScreen() {
   const [page] = useState(1);
   const { data, isLoading, refetch, isRefetching } = useJoinRequests(page, 50);
   const approveMutation = useApproveJoinRequest();
   const denyMutation = useDenyJoinRequest();

   const requests = data?.requests || [];
   const totalRequests = data?.totalRequests || 0;

   const onRefresh = useCallback(async () => {
      await refetch();
   }, [refetch]);

   const handleApprove = (item: JoinRequestItem) => {
      Alert.alert(
         'Approve Request',
         `Allow ${item.student.name || item.student.email || 'this student'} to join "${item.className}"?`,
         [
            { text: 'Cancel', style: 'cancel' },
            {
               text: 'Approve',
               onPress: () => {
                  approveMutation.mutate(
                     { classId: item.classId, studentId: item.student._id },
                     {
                        onSuccess: () => {
                           Alert.alert('Approved', `${item.student.name || 'Student'} has been added to ${item.className}.`);
                        },
                        onError: (error: any) => {
                           Alert.alert('Error', error?.response?.data?.message || error.message || 'Failed to approve');
                        },
                     }
                  );
               },
            },
         ]
      );
   };

   const handleDeny = (item: JoinRequestItem) => {
      Alert.alert(
         'Deny Request',
         `Deny ${item.student.name || item.student.email || 'this student'} from joining "${item.className}"?`,
         [
            { text: 'Cancel', style: 'cancel' },
            {
               text: 'Deny',
               style: 'destructive',
               onPress: () => {
                  denyMutation.mutate(
                     { classId: item.classId, studentId: item.student._id },
                     {
                        onSuccess: () => {
                           Alert.alert('Denied', 'The join request has been denied.');
                        },
                        onError: (error: any) => {
                           Alert.alert('Error', error?.response?.data?.message || error.message || 'Failed to deny');
                        },
                     }
                  );
               },
            },
         ]
      );
   };

   const formatTimeAgo = (dateStr: string) => {
      const now = new Date();
      const date = new Date(dateStr);
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
   };

   const renderRequestItem = ({ item }: { item: JoinRequestItem }) => {
      const isProcessing =
         (approveMutation.isPending && approveMutation.variables?.studentId === item.student._id && approveMutation.variables?.classId === item.classId) ||
         (denyMutation.isPending && denyMutation.variables?.studentId === item.student._id && denyMutation.variables?.classId === item.classId);

      return (
         <View style={styles.requestCard}>
            <View style={styles.requestHeader}>
               <View style={styles.studentInfo}>
                  {item.student.profilePicture ? (
                     <Image source={{ uri: item.student.profilePicture }} style={styles.studentAvatar} />
                  ) : (
                     <View style={styles.studentAvatarPlaceholder}>
                        <Ionicons name="person" size={20} color="#888" />
                     </View>
                  )}
                  <View style={styles.studentDetails}>
                     <Text style={styles.studentName} numberOfLines={1}>
                        {item.student.name || 'Unnamed Student'}
                     </Text>
                     {item.student.email && (
                        <Text style={styles.studentEmail} numberOfLines={1}>
                           {item.student.email}
                        </Text>
                     )}
                  </View>
               </View>
               <Text style={styles.timeAgo}>{formatTimeAgo(item.requestedAt)}</Text>
            </View>

            <View style={styles.classInfo}>
               <Ionicons name="school-outline" size={14} color="#888" />
               <Text style={styles.classInfoText}>{item.className}</Text>
               <Text style={styles.classDot}>·</Text>
               <Text style={styles.classInfoText}>{item.subject}</Text>
            </View>

            <View style={styles.actionRow}>
               <TouchableOpacity
                  style={styles.denyBtn}
                  onPress={() => handleDeny(item)}
                  disabled={isProcessing}
               >
                  {denyMutation.isPending && denyMutation.variables?.studentId === item.student._id ? (
                     <ActivityIndicator size="small" color="#ff4444" />
                  ) : (
                     <>
                        <Ionicons name="close-circle" size={16} color="#ff4444" />
                        <Text style={styles.denyText}>Deny</Text>
                     </>
                  )}
               </TouchableOpacity>
               <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => handleApprove(item)}
                  disabled={isProcessing}
               >
                  {approveMutation.isPending && approveMutation.variables?.studentId === item.student._id ? (
                     <ActivityIndicator size="small" color="#fff" />
                  ) : (
                     <>
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                        <Text style={styles.approveText}>Approve</Text>
                     </>
                  )}
               </TouchableOpacity>
            </View>
         </View>
      );
   };

   return (
      <SafeAreaView style={styles.container}>
         {/* Header */}
         <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
               <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Join Requests</Text>
            <View style={styles.placeholder} />
         </View>

         {/* Summary */}
         {totalRequests > 0 && (
            <View style={styles.summaryBar}>
               <View style={styles.summaryDot} />
               <Text style={styles.summaryText}>
                  {totalRequests} pending request{totalRequests !== 1 ? 's' : ''}
               </Text>
            </View>
         )}

         {isLoading ? (
            <View style={styles.centerContainer}>
               <ActivityIndicator size="large" color="#FF9500" />
               <Text style={styles.loadingText}>Loading requests...</Text>
            </View>
         ) : requests.length === 0 ? (
            <View style={styles.centerContainer}>
               <View style={styles.emptyIconContainer}>
                  <Ionicons name="people-outline" size={56} color="#333" />
               </View>
               <Text style={styles.emptyTitle}>No Join Requests</Text>
               <Text style={styles.emptySubtitle}>
                  When students scan your class QR code, their requests will appear here.
               </Text>
            </View>
         ) : (
            <FlatList
               data={requests}
               renderItem={renderRequestItem}
               keyExtractor={(item) => `${item.classId}-${item.student._id}`}
               contentContainerStyle={styles.listContent}
               refreshControl={
                  <RefreshControl
                     refreshing={isRefetching}
                     onRefresh={onRefresh}
                     tintColor="#fff"
                  />
               }
               ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
         )}
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: '#000000',
   },
   header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#1a1a1a',
   },
   backButton: {
      padding: 4,
   },
   headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#ffffff',
   },
   placeholder: {
      width: 32,
   },
   summaryBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 8,
   },
   summaryDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FF9500',
   },
   summaryText: {
      fontSize: 14,
      color: '#FF9500',
      fontWeight: '600',
   },
   centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
   },
   loadingText: {
      color: '#888',
      fontSize: 14,
      marginTop: 12,
   },
   emptyIconContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: '#1a1a1a',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
   },
   emptyTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#fff',
      marginBottom: 8,
   },
   emptySubtitle: {
      fontSize: 14,
      color: '#888',
      textAlign: 'center',
      lineHeight: 20,
   },
   listContent: {
      paddingHorizontal: 16,
      paddingBottom: 20,
   },
   requestCard: {
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: '#333',
   },
   requestHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
   },
   studentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
   },
   studentAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
   },
   studentAvatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#222',
      justifyContent: 'center',
      alignItems: 'center',
   },
   studentDetails: {
      flex: 1,
   },
   studentName: {
      fontSize: 15,
      fontWeight: '600',
      color: '#fff',
   },
   studentEmail: {
      fontSize: 12,
      color: '#888',
      marginTop: 2,
   },
   timeAgo: {
      fontSize: 12,
      color: '#666',
      marginLeft: 8,
   },
   classInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 14,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#222',
   },
   classInfoText: {
      fontSize: 13,
      color: '#888',
   },
   classDot: {
      fontSize: 13,
      color: '#555',
   },
   actionRow: {
      flexDirection: 'row',
      gap: 10,
   },
   denyBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 68, 68, 0.1)',
      paddingVertical: 10,
      borderRadius: 8,
      gap: 6,
      borderWidth: 1,
      borderColor: 'rgba(255, 68, 68, 0.3)',
   },
   denyText: {
      color: '#ff4444',
      fontSize: 13,
      fontWeight: '600',
   },
   approveBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#4CAF50',
      paddingVertical: 10,
      borderRadius: 8,
      gap: 6,
   },
   approveText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '600',
   },
});
