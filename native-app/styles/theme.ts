/**
 * App-wide theme configuration
 * Colors, spacing, typography, and other design tokens
 */

export const colors = {
   // Primary colors
   primary: '#007AFF',
   secondary: '#5856D6',

   // Status colors
   success: '#34C759',
   warning: '#FF9500',
   error: '#FF3B30',
   info: '#007AFF',

   // Neutral colors
   black: '#000000',
   white: '#FFFFFF',
   gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
   },

   // App-specific colors
   background: '#000000',
   surface: '#1A1A1A',
   border: '#333333',
   text: {
      primary: '#FFFFFF',
      secondary: '#A0A0A0',
      disabled: '#666666',
   },
};

export const spacing = {
   xs: 4,
   sm: 8,
   md: 16,
   lg: 24,
   xl: 32,
   xxl: 48,
};

export const borderRadius = {
   sm: 4,
   md: 8,
   lg: 12,
   xl: 16,
   round: 9999,
};

export const fontSize = {
   xs: 12,
   sm: 14,
   md: 16,
   lg: 18,
   xl: 20,
   xxl: 24,
   xxxl: 32,
};

export const fontWeight = {
   regular: '400' as const,
   medium: '500' as const,
   semibold: '600' as const,
   bold: '700' as const,
};

export const shadows = {
   sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
   },
   md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
      elevation: 4,
   },
   lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
   },
};

export const theme = {
   colors,
   spacing,
   borderRadius,
   fontSize,
   fontWeight,
   shadows,
};

export type Theme = typeof theme;
