/**
 * Utility functions for form validation
 */

/**
 * Validate email address
 * @param email - Email string to validate
 * @returns True if valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param password - Password string to validate
 * @returns True if valid, false otherwise
 */
export const isValidPassword = (password: string): boolean => {
   // TODO: Implement password validation rules
   return password.length >= 6;
};

/**
 * Validate phone number
 * @param phone - Phone number string to validate
 * @returns True if valid, false otherwise
 */
export const isValidPhone = (phone: string): boolean => {
   // TODO: Implement phone validation
   const phoneRegex = /^\d{10}$/;
   return phoneRegex.test(phone.replace(/\D/g, ''));
};

/**
 * Check if string is empty or whitespace
 * @param value - String to check
 * @returns True if empty, false otherwise
 */
export const isEmpty = (value: string): boolean => {
   return !value || value.trim().length === 0;
};
