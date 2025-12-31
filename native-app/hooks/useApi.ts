import { useState, useEffect } from 'react';
import { ApiError } from '../types/api';

/**
 * Custom hook for API calls with loading and error states
 */
export function useApi<T>(
   apiCall: () => Promise<T>,
   dependencies: any[] = []
) {
   const [data, setData] = useState<T | null>(null);
   const [loading, setLoading] = useState<boolean>(true);
   const [error, setError] = useState<ApiError | null>(null);

   const fetchData = async () => {
      try {
         setLoading(true);
         setError(null);
         const result = await apiCall();
         setData(result);
      } catch (err: any) {
         setError(err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchData();
   }, dependencies);

   return { data, loading, error, refetch: fetchData };
}
