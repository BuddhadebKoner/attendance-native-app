import React, { useState, useEffect } from 'react';
import {
   View,
   Text,
   StyleSheet,
   FlatList,
   TouchableOpacity,
   ActivityIndicator,
   TextInput,
   Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../../../../services/api';
import { classApi } from '../../../../../services/class.api';
import type { User } from '../../../../../types/api';

export default function AddStudentScreen() {
   const { id: classId } = useLocalSearchParams<{ id: string }>();
   const [users, setUsers] = useState<User[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isLoadingMore, setIsLoadingMore] = useState(false);
   const [isAdding, setIsAdding] = useState<string | null>(null);
   const [isBulkAdding, setIsBulkAdding] = useState(false);
   const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
   const [search, setSearch] = useState('');
   const [currentPage, setCurrentPage] = useState(1);
   const [totalPages, setTotalPages] = useState(1);
   const [hasNextPage, setHasNextPage] = useState(false);

   useEffect(() => {
      fetchUsers(1, search);
   }, []);

   const fetchUsers = async (page: number, searchQuery: string = '') => {
      try {
         if (page === 1) {
            setIsLoading(true);
         } else {
            setIsLoadingMore(true);
         }

         const response = await authApi.getAvailableStudents(classId, page, 10, searchQuery);

         if (response.success && response.data) {
            if (page === 1) {
               setUsers(response.data.users);
            } else {
               setUsers((prev) => [...prev, ...response.data.users]);
            }

            setCurrentPage(response.data.pagination.currentPage);
            setTotalPages(response.data.pagination.totalPages);
            setHasNextPage(response.data.pagination.hasNextPage);
         }
      } catch (error: any) {
         console.error('Fetch users error:', error);
         Alert.alert('Error', error?.message || 'Failed to fetch users');
      } finally {
         setIsLoading(false);
         setIsLoadingMore(false);
      }
   };

   const handleSearch = () => {
      setCurrentPage(1);
      fetchUsers(1, search);
   };

   const handleLoadMore = () => {
      if (!isLoadingMore && hasNextPage) {
         fetchUsers(currentPage + 1, search);
      }
   };

   const handleAddStudent = async (studentId: string) => {
      try {
         setIsAdding(studentId);
         const response = await classApi.addStudent(classId, studentId);

         if (response.success) {
            Alert.alert('Success', 'Student added successfully', [
               {
                  text: 'OK',
                  onPress: () => router.back(),
               },
            ]);
         }
      } catch (error: any) {
         console.error('Add student error:', error);
         const errorMessage =
            error?.response?.data?.message || error?.message || 'Failed to add student';
         Alert.alert('Error', errorMessage);
      } finally {
         setIsAdding(null);
      }
   };

   const toggleStudentSelection = (studentId: string) => {
      setSelectedStudents((prev) => {
         const newSet = new Set(prev);
         if (newSet.has(studentId)) {
            newSet.delete(studentId);
         } else {
            newSet.add(studentId);
         }
         return newSet;
      });
   };

   const handleBulkAddStudents = async () => {
      if (selectedStudents.size === 0) {
         Alert.alert('No Selection', 'Please select at least one student to add');
         return;
      }

      Alert.alert(
         'Add Students',
         `Add ${selectedStudents.size} student${selectedStudents.size > 1 ? 's' : ''} to the class?`,
         [
            { text: 'Cancel', style: 'cancel' },
            {
               text: 'Add',
               onPress: async () => {
                  try {
                     setIsBulkAdding(true);
                     let successCount = 0;
                     let failCount = 0;

                     // Add students one by one
                     for (const studentId of Array.from(selectedStudents)) {
                        try {
                           await classApi.addStudent(classId, studentId);
                           successCount++;
                        } catch (error) {
                           failCount++;
                           console.error(`Failed to add student ${studentId}:`, error);
                        }
                     }

                     if (successCount > 0) {
                        Alert.alert(
                           'Success',
                           `${successCount} student${successCount > 1 ? 's' : ''} added successfully${failCount > 0 ? `. ${failCount} failed.` : ''}`,
                           [{ text: 'OK', onPress: () => router.back() }]
                        );
                     } else {
                        Alert.alert('Error', 'Failed to add students');
                     }
                  } catch (error: any) {
                     console.error('Bulk add error:', error);
                     Alert.alert('Error', 'Failed to add students');
                  } finally {
                     setIsBulkAdding(false);
                     setSelectedStudents(new Set());
                  }
               },
            },
         ]
      );
   };

   const renderUser = ({ item }: { item: User }) => (
      <TouchableOpacity
         style={[styles.userCard, selectedStudents.has(item._id) && styles.userCardSelected]}
         onPress={() => toggleStudentSelection(item._id)}
         activeOpacity={0.7}
      >
         <TouchableOpacity
            style={styles.checkbox}
            onPress={() => toggleStudentSelection(item._id)}
         >
            {selectedStudents.has(item._id) ? (
               <Ionicons name="checkbox" size={24} color="#4CAF50" />
            ) : (
               <Ionicons name="square-outline" size={24} color="#666" />
            )}
         </TouchableOpacity>
         <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
               {item.name?.charAt(0).toUpperCase() || item.mobile?.charAt(0) || 'U'}
            </Text>
         </View>
         <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.name || 'Unknown'}</Text>
            <Text style={styles.userMobile}>{item.mobile}</Text>
            {item.email && <Text style={styles.userEmail}>{item.email}</Text>}
         </View>
         <TouchableOpacity
            style={[styles.addButton, isAdding === item._id && styles.addButtonDisabled]}
            onPress={() => handleAddStudent(item._id)}
            disabled={isAdding === item._id}
         >
            {isAdding === item._id ? (
               <ActivityIndicator size="small" color="#ffffff" />
            ) : (
               <Ionicons name="add-circle" size={24} color="#ffffff" />
            )}
         </TouchableOpacity>
      </TouchableOpacity>
   );

   const renderFooter = () => {
      if (!isLoadingMore) return null;
      return (
         <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color="#ffffff" />
         </View>
      );
   };

   const renderEmpty = () => {
      if (isLoading) return null;
      return (
         <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#333" />
            <Text style={styles.emptyStateText}>
               {search ? 'No users found' : 'No users available'}
            </Text>
            {search && (
               <Text style={styles.emptyStateSubtext}>Try a different search query</Text>
            )}
         </View>
      );
   };

   return (
      <SafeAreaView style={styles.container}>
         {/* Header */}
         <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
               <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Student</Text>
            <View style={styles.headerButton} />
         </View>

         {/* Search Bar */}
         <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
               <Ionicons name="search" size={20} color="#888" />
               <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name, mobile, or email"
                  placeholderTextColor="#666"
                  value={search}
                  onChangeText={setSearch}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
               />
               {search.length > 0 && (
                  <TouchableOpacity
                     onPress={() => {
                        setSearch('');
                        fetchUsers(1, '');
                     }}
                  >
                     <Ionicons name="close-circle" size={20} color="#888" />
                  </TouchableOpacity>
               )}
            </View>
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
               <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
         </View>

         {/* Users List */}
         {isLoading ? (
            <View style={styles.loadingContainer}>
               <ActivityIndicator size="large" color="#ffffff" />
               <Text style={styles.loadingText}>Loading users...</Text>
            </View>
         ) : (
            <FlatList
               data={users}
               renderItem={renderUser}
               keyExtractor={(item) => item._id}
               contentContainerStyle={styles.listContent}
               ListEmptyComponent={renderEmpty}
               ListFooterComponent={renderFooter}
               onEndReached={handleLoadMore}
               onEndReachedThreshold={0.5}
            />
         )}

         {/* Pagination Info */}
         {!isLoading && users.length > 0 && (
            <View style={styles.paginationInfo}>
               <Text style={styles.paginationText}>
                  Page {currentPage} of {totalPages}
               </Text>
            </View>
         )}

         {/* Bulk Add Button */}
         {selectedStudents.size > 0 && (
            <View style={styles.bulkAddContainer}>
               <View style={styles.bulkAddContent}>
                  <Text style={styles.bulkAddText}>
                     {selectedStudents.size} student{selectedStudents.size > 1 ? 's' : ''} selected
                  </Text>
                  <TouchableOpacity
                     style={[styles.bulkAddButton, isBulkAdding && styles.bulkAddButtonDisabled]}
                     onPress={handleBulkAddStudents}
                     disabled={isBulkAdding}
                  >
                     {isBulkAdding ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                     ) : (
                        <>
                           <Ionicons name="add-circle" size={20} color="#ffffff" />
                           <Text style={styles.bulkAddButtonText}>Add Selected</Text>
                        </>
                     )}
                  </TouchableOpacity>
               </View>
            </View>
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
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: 10,
   },
   headerButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
   },
   headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#ffffff',
   },
   searchContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingBottom: 16,
      gap: 12,
   },
   searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: '#333',
      gap: 8,
   },
   searchInput: {
      flex: 1,
      color: '#ffffff',
      fontSize: 16,
      paddingVertical: 12,
   },
   searchButton: {
      backgroundColor: '#333',
      paddingHorizontal: 20,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
   },
   searchButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
   },
   loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
   },
   loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: '#888',
   },
   listContent: {
      padding: 20,
      paddingTop: 0,
      paddingBottom: 100, // Extra padding for bulk add button
   },
   userCard: {
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: '#333',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
   },
   userCardSelected: {
      borderColor: '#4CAF50',
      backgroundColor: '#1a2a1a',
   },
   checkbox: {
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
   },
   userAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#333',
      justifyContent: 'center',
      alignItems: 'center',
   },
   userAvatarText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#ffffff',
   },
   userInfo: {
      flex: 1,
   },
   userName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 2,
   },
   userMobile: {
      fontSize: 14,
      color: '#888',
      marginBottom: 2,
   },
   userEmail: {
      fontSize: 12,
      color: '#666',
   },
   addButton: {
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
   },
   addButtonDisabled: {
      opacity: 0.5,
   },
   footerLoader: {
      paddingVertical: 20,
      alignItems: 'center',
   },
   emptyState: {
      alignItems: 'center',
      paddingVertical: 60,
   },
   emptyStateText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#888',
      marginTop: 12,
   },
   emptyStateSubtext: {
      fontSize: 14,
      color: '#666',
      marginTop: 4,
   },
   paginationInfo: {
      padding: 16,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: '#333',
   },
   paginationText: {
      fontSize: 14,
      color: '#888',
   },
   bulkAddContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#1a1a1a',
      borderTopWidth: 1,
      borderTopColor: '#333',
      paddingHorizontal: 20,
      paddingVertical: 16,
   },
   bulkAddContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
   },
   bulkAddText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
   },
   bulkAddButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#4CAF50',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      gap: 8,
   },
   bulkAddButtonDisabled: {
      opacity: 0.6,
   },
   bulkAddButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
   },
});
