import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useCreateAttendance } from './queries';
import type { CreateAttendanceRequest } from '../types/api';

export interface UseAttendanceReturn {
   isCreating: boolean;
   createAttendance: (data: CreateAttendanceRequest) => Promise<void>;
   error: string | null;
}

/**
 * Custom hook for managing attendance operations
 * Wraps the useCreateAttendance mutation with UI logic (alerts + navigation)
 */
export function useAttendance(classId: string): UseAttendanceReturn {
   const mutation = useCreateAttendance();

   const createAttendance = async (data: CreateAttendanceRequest) => {
      try {
         const attendance = await mutation.mutateAsync(data);

         if (attendance) {
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
                        if (isQuick) {
                           router.push(`/(app)/(home)/attendance/${attendance._id}`);
                        } else {
                           router.back();
                        }
                     },
                  },
               ]
            );
         }
      } catch (err: any) {
         throw err;
      }
   };

   return {
      isCreating: mutation.isPending,
      createAttendance,
      error: mutation.error?.message ?? null,
   };
}
