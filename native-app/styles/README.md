# Styles

This folder contains shared styling utilities and theme configuration.

## Files:
- **theme.ts** - App-wide design tokens (colors, spacing, typography)

## Usage:
```typescript
import { colors, spacing, fontSize } from '@/styles/theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  text: {
    fontSize: fontSize.lg,
    color: colors.text.primary,
  },
});
```

## Extending the theme:
Add new design tokens to `theme.ts` as your app grows. Keep all styling constants centralized here for consistency.
