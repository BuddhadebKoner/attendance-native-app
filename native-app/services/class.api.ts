import api from './api';
import type { ApiResponse, Class, CreateClassRequest, UpdateClassRequest } from '../types/api';

// Class API endpoints
export const classApi = {
   /**
    * Create a new class
    * POST /api/classes
    */
   async createClass(data: CreateClassRequest): Promise<ApiResponse<{ class: Class }>> {
      try {
         const response = await api.post<ApiResponse<{ class: Class }>>('/classes', data);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Get all classes (created by user or enrolled in)
    * GET /api/classes
    */
   async getClasses(): Promise<ApiResponse<{ classes: Class[]; count: number }>> {
      try {
         const response = await api.get<ApiResponse<{ classes: Class[]; count: number }>>('/classes');
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Get single class by ID
    * GET /api/classes/:id
    */
   async getClass(classId: string): Promise<ApiResponse<{ class: Class }>> {
      try {
         const response = await api.get<ApiResponse<{ class: Class }>>(`/classes/${classId}`);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Update class details
    * PUT /api/classes/:id
    */
   async updateClass(classId: string, data: UpdateClassRequest): Promise<ApiResponse<{ class: Class }>> {
      try {
         const response = await api.put<ApiResponse<{ class: Class }>>(`/classes/${classId}`, data);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Delete a class
    * DELETE /api/classes/:id
    */
   async deleteClass(classId: string): Promise<ApiResponse> {
      try {
         const response = await api.delete<ApiResponse>(`/classes/${classId}`);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Add a student to class
    * POST /api/classes/:id/students
    */
   async addStudent(classId: string, studentId: string): Promise<ApiResponse<{ class: Class }>> {
      try {
         const response = await api.post<ApiResponse<{ class: Class }>>(`/classes/${classId}/students`, { studentId });
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   /**
    * Remove a student from class
    * DELETE /api/classes/:id/students/:studentId
    */
   async removeStudent(classId: string, studentId: string): Promise<ApiResponse<{ class: Class }>> {
      try {
         const response = await api.delete<ApiResponse<{ class: Class }>>(`/classes/${classId}/students/${studentId}`);
         return response.data;
      } catch (error) {
         throw error;
      }
   },
};

export default classApi;
