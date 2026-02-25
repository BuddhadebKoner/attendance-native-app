import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { attendanceApi } from '../services/attendance.api';
import type { CreateAttendanceRequest, Attendance } from '../types/api';

export interface UseAttendanceReturn {
   isCreating: boolean;
   createAttendance: (data: CreateAttendanceRequest) => Promise<void>;
   error: string | null;
}

/**
 * Custom hook for managing attendance operations
 */
export function useAttendance(classId: string): UseAttendanceReturn {
   const [isCreating, setIsCreating] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const createAttendance = async (data: CreateAttendanceRequest) => {
      setIsCreating(true);
      setError(null);

      try {
         const response = await attendanceApi.createAttendance(data);

         if (response.success && response.data?.attendance) {
            const attendance = response.data.attendance;
            const isQuick = attendance.attendanceType === 'quick';

            Alert.alert(
               'Success',
               isQuick
                  ? 'Quick attendance session started successfully!'
                  : 'Attendance scheduled successfully! You will receive a reminder.',
               [
                  {
                     text: 'OK',
                     onPress: () => {
                        // Navigate to attendance details screen
                        if (isQuick) {
                           router.push(`/(app)/(home)/attendance/${attendance._id}`);
                        } else {
                           // Go back to class details for scheduled attendance
                           router.back();
                        }
                     },
                  },
               ]
            );
         } else {
            throw new Error(response.message || 'Failed to create attendance');
         }
      } catch (err: any) {
         const errorMessage =
            err?.response?.data?.message ||
            err?.message ||
            'Failed to create attendance';
         setError(errorMessage);
         throw err;
      } finally {
         setIsCreating(false);
      }
   };

   return {
      isCreating,
      createAttendance,
      error,
   };
}
