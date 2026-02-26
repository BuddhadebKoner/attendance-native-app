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
 * Check if string is empty or whitespace
 * @param value - String to check
 * @returns True if empty, false otherwise
 */
export const isEmpty = (value: string): boolean => {
   return !value || value.trim().length === 0;
};
