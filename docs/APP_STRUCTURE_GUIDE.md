# React Native App Structure Guide

## Table of Contents
1. [React Native vs React Web](#react-native-vs-react-web)
2. [Entry Point Flow](#entry-point-flow)
3. [Expo Router File-Based Routing](#expo-router-file-based-routing)
4. [Your App Structure Explained](#your-app-structure-explained)
5. [Navigation Hierarchy](#navigation-hierarchy)
6. [File Structure Best Practices](#file-structure-best-practices)

---

## React Native vs React Web

### React Web (Traditional)
```
index.html
  └── main.jsx/tsx (Entry point)
      └── App.jsx/tsx (Root component)
          └── Router Setup (React Router)
              └── Pages & Components
```

### React Native with Expo Router
```
app.json (App configuration)
  └── app/_layout.tsx (Root layout - Entry point)
      └── Nested layouts & screens
          └── File-based routing (no manual router setup needed!)
```

**Key Differences:**
- ❌ No `index.html` - Native apps don't use HTML
- ❌ No `main.jsx` - Expo handles the entry point
- ❌ No manual routing - File structure = Routes
- ✅ Uses native components (View, Text, etc.) instead of div, span, etc.
- ✅ Navigation based on file/folder names

---

## Entry Point Flow

### How Your App Starts:

```
1. app.json
   ↓
   Defines app name, version, and entry point
   
2. native-app/app/_layout.tsx (ROOT LAYOUT)
   ↓
   First TypeScript file that runs
   
3. AuthProvider wraps the entire app
   ↓
   Manages authentication state globally
   
4. RootLayoutNav component
   ↓
   Handles navigation based on auth state
   
5. Routes to either:
   - /(public)/login.tsx (if not authenticated)
   - /(app)/(home) (if authenticated)
```

### Detailed Flow:

```typescript
// Step 1: app.json tells Expo where to start
{
  "expo": {
    "name": "native-app",
    "entryPoint": "expo-router/entry" // Expo Router takes over
  }
}

// Step 2: Expo Router looks for app/_layout.tsx (ROOT LAYOUT)
export default function RootLayout() {
  return (
    <AuthProvider>          // Step 3: Wrap with global state
      <RootLayoutNav />     // Step 4: Handle navigation logic
    </AuthProvider>
  );
}

// Step 5: Navigation logic
function RootLayoutNav() {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    router.replace("/(public)/login");    // Go to login
  } else {
    router.replace("/(app)/(home)");       // Go to dashboard
  }
  
  return <Stack>...</Stack>;
}
```

---

## Expo Router File-Based Routing

### The Magic of File-Based Routing

In Expo Router, **your file structure IS your route structure**. No need to define routes manually!

### Folder Naming Conventions:

| Pattern | Meaning | Example |
|---------|---------|---------|
| `app/about.tsx` | Regular route | `/about` |
| `app/(app)/(home)/index.tsx` | Grouped route | `/` (Home tab) |
| `app/user/[id].tsx` | Dynamic route | `/user/123` |
| `app/_layout.tsx` | Layout wrapper | N/A (wraps children) |
| `app/(app)/_layout.tsx` | Group layout | N/A (wraps group) |

**Parentheses `()` = Route Groups**: They organize routes without adding to the URL path.

---

## Your App Structure Explained

### Current File Structure:

```
native-app/
├── app/                          # 🎯 ROUTING FOLDER (Entry point)
│   ├── _layout.tsx               # 🌟 ROOT LAYOUT (First file executed)
│   ├── index.tsx                 # Home/Landing page (/)
│   │
│   ├── (public)/                 # 📂 PUBLIC ROUTES GROUP
│   │   ├── _layout.tsx           # Layout for public pages
│   │   ├── login.tsx             # /login
│   │   └── register.tsx          # /register
│   │
│   └── (app)/                    # 📂 AUTHENTICATED ROUTES GROUP
│       ├── _layout.tsx           # 📱 TAB NAVIGATION LAYOUT
│       │
│       ├── (home)/               # 🏠 HOME TAB GROUP
│       │   ├── _layout.tsx       # Stack navigation for home
│       │   ├── index.tsx         # / (Dashboard - Tab 1)
│       │   ├── create-class.tsx  # /create-class
│       │   │
│       │   └── class/            # Class management routes
│       │       ├── [id].tsx      # /class/123 (Class details)
│       │       └── [id]/
│       │           ├── edit.tsx       # /class/123/edit
│       │           └── add-student.tsx # /class/123/add-student
│       │
│       └── (profile)/            # 👤 PROFILE TAB GROUP
│           ├── _layout.tsx       # Stack navigation for profile
│           ├── index.tsx         # /profile (Profile - Tab 2)
│           ├── edit.tsx          # /profile/edit
│           ├── change-password.tsx  # /profile/change-password
│           ├── notifications.tsx    # /profile/notifications
│           └── privacy.tsx          # /profile/privacy
│
├── contexts/                     # 🔐 GLOBAL STATE
│   └── AuthContext.tsx           # Authentication state
│
├── services/                     # 🌐 API CALLS
│   ├── api.ts                    # Base API setup
│   └── class.api.ts              # Class-specific APIs
│
├── hooks/                        # 🎣 CUSTOM HOOKS
│   └── useApi.ts                 # API helper hook
│
├── types/                        # 📝 TYPESCRIPT TYPES
│   └── api.ts                    # Type definitions
│
├── constants/                    # ⚙️ CONFIGURATION
│   └── config.ts                 # App constants
│
└── assets/                       # 🖼️ IMAGES, FONTS, ETC.
    └── images/
```

---

## Navigation Hierarchy

### Level 1: Root Layout (`app/_layout.tsx`)

```typescript
// This is the MASTER LAYOUT - everything passes through here
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
```

**Responsibilities:**
- ✅ Wraps entire app
- ✅ Provides global state (AuthProvider)
- ✅ Handles authentication-based navigation
- ✅ Defines Stack navigator for route groups

---

### Level 2A: Public Layout (`app/(public)/_layout.tsx`)

```typescript
export default function PublicLayout() {
   return (
      <Stack screenOptions={{
         headerShown: false,
         contentStyle: { backgroundColor: '#000000' },
      }} />
   );
}
```

**Responsibilities:**
- ✅ Wraps all public routes (login, register)
- ✅ Applies common styling
- ✅ Hides headers
- ✅ Stack navigation (no tabs)

**Routes it controls:**
- `/login` → `login.tsx`
- `/register` → `register.tsx`
pp Layout (`app/(app)/_layout.tsx`)

```typescript
export default function AppLayout() {
   return (
      <Tabs screenOptions={{...}}>
         <Tabs.Screen 
            name="(home)" 
            options={{
               title: 'Home',
               tabBarIcon: ({ color, size }) => (
                  <Ionicons name="home" size={size} color={color} />
               ),
            }}
         />
         <Tabs.Screen 
            name="(profile)" 
            options={{
               title: 'Profile',
               tabBarIcon: ({ color, size }) => (
                  <Ionicons name="person" size={size} color={color} />
               ),
            }}
         />
      </Tabs>
   );
}
```

**Responsibilities:**
- ✅ Wraps all authenticated routes
- ✅ Provides TAB NAVIGATION (bottom tabs)
- ✅ Shows only tab groups in tab bar
- ✅ Applies tab styling

**Visible Tabs:**
1. 🏠 Home (`(home)` group - shows `index.tsx`)
2. 👤 ProfiA: Home Stack Layout (`app/(app)/(home)/_layout.tsx`)

```typescript
export default function HomeLayout() {
   return (
      <Stack screenOptions={{
         headerShown: false,
         contentStyle: { backgroundColor: '#000000' },
      }} />
   );
}
```

**Responsibilities:**
- ✅ Wraps all home tab screens
- ✅ Provides STACK NAVIGATION within home tab
- ✅ Hides headers for all screens

**Routes in this stack:**
- `index.tsx` - Dashboard (visible tab)
- `create-class.tsx` - Create class form
- `class/[id].tsx` - Class details
- `class/[id]/edit.tsx` - Edit class
- `class/[id]/add-student.tsx` - Add student

---

### Level 3B: Profile Stack Layout (`app/(app)/(profile)/_layout.tsx`)

```typescript
export default function ProfileLayout() {
   return (
      <Stack scpp) Tabs
              ├─ Tab 1: (home) group
              │   ├─ / (Dashboard - index.tsx)
              │   ├─ /create-class
              │   ├─ /class/[id] (Class details)
              │   ├─ /class/[id]/edit
              │   └─ /class/[id]/add-student
              │
              └─ Tab 2: (profile) group
                  ├─ /profile (Profile - index.tsx)
                  ├─ /profile/edit
                  ├─ /profile/change-password
                  ├─ /profile/notifications
                  └─ /profile all screens

**Routes in this stack:**
- `index.tsx` - Profile main (visible tab)
- `edit.tsx` - Edit profile
- `change-password.tsx` - Change password
- `notifications.tsx` - Notification settings
- `privacy.tsx` - Privacy settings

---pp)/(profile)/edit');       // Stack navigation
router.push('/(app)/(home)/class/123');     // Dynamic route

// Replace current screen (no back button)
router.replace('/(public)/login');

// Go back
router.back();

// Navigate to tab
router.push('/(app)/(home)');               // Home tab
router.push('/(app)/(profile)');            // Profile tab
---

### Level 3: Individual Screens

Each `.tsx` file in route folders is a screen/page:

```typescript
// Examplepp)/_layout.tsx`:

```typescript
<Tabs screenOptions={{...}}>
  {/* HOME TAB */}
  <Tabs.Screen
    name="(home)"
    options={{
      title: 'Home',
      tabBarLabel: 'Home',
      tabBarIcon: ({ color, size }) => (
        <Ionicons name="home" size={size} color={color} />
      ),
    }}
  />

  {/* PROFILE TAB */}
  <Tabs.Screen
    name="(profile)"
    options={{
      title: 'Profile',
      tabBarLabel: 'Profile',
      tabBarIcon: ({ color, size }) => (
        <Ionicons name="person" size={size} color={color} />
      ),
    }}
  />
</Tabs>
```

**Key Points:**
- Only route groups `(home)` and `(profile)` are shown as tabs
- Each group shows its `index.tsx` file when the tab is selected
- Other files in the group are accessible via stack navigation
- No need for `href: null` - cleaner architecture!
              └─ Hidden Screens:
                  ├─ /edit-profile
                  ├─ /change-password
                  ├─ /create-class
                  ├─ /class-details/[id]
                  ├─ /update-class/[id]
                  ├─ /add-student/[classId]
                  ├─ /notifications
                  └─ /privacy
```

### Navigation Methods:

```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

// Navigate to a screen
router.push('/(auth)/edit-profile');        // Stack navigation
router.push('/class-details/123');          // Dynamic route

// Replace current screen (no back button)
router.replace('/(public)/login');

// Go back
router.back();

// Navigate to tab
router.push('/(auth)/dashboard');
```

---

## Tab Bar Control

### How Tabs Are Configured:

In `app/(auth)/_layout.tsx`:

```typescript
<Tabs screenOptions={{...}}>
  {/* VISIBLE IN TAB BAR */}
  <Tabs.Screen
    name="dashboard"ppGroup) {
    router.replace("/(public)/login");  // Redirect to login
  } else if (isAuthenticated && inPublicGroup) {
    router.replace("/(app)/(home)");   
      tabBarIcon: ({ color, size }) => (
        <Ionicons name="home" size={size} color={color} />
      ),
    }}
  />

  {/* HIDDEN FROM TAB BAR */}
  <Tabs.Screen
    name="edit-profile"
    options={{
      href: nulpp)/(home)/class/[id].tsx
import { useLocalSearchParams } from 'expo-router';

export default function ClassDetails() {
  const { id } = useLocalSearchParams();  // Get route parameter
  
  // Fetch class data using id
  return <View><Text>Class ID: {id}</Text></View>;
}

// Navigate to: router.push('/(app)/(home)/clas
---

## File Structure Best Practices
Stack Navigation within Tabs

```typescript
// Visible tabs: Home (dashboard), Profile
// Hidden screens in stacks: Create Class, Edit Profile, etc.

// In (home)/index.tsx (Dashboard)
<TouchableOpacity onPress={() => router.push('/(app)/(home)/create-class')}>
  <Text>Create Class</Text>
</TouchableOpacity>

// In (profile)/index.tsx
<TouchableOpacity onPress={() => router.push('/(app)/(profile)/edit')}>
  <Text>Edit Profile</Text>
</TouchableOpacity>

// These screens use stack navigation within their tab groups
```

### 🎯 Recommended Additions:

```
native-app/
├── app/              # Routes
├── components/       # ⭐ ADD: Reusable UI components
│   ├── common/       #   Button, Input, Card, etc.
│   ├── features/     #   ClassCard, StudentList, etc.
│   └── layouts/      #   Header, Footer, etc.
├── contexts/         # Global state
├── services/         # API calls
├── hooks/            # Custom hooks
├── types/            # TypeScript types
├── constants/        # Configuration
├── utils/            # ⭐ ADD: Helper functions
│   ├── formatters.ts #   Date, currency, etc.
│   └── validators.ts #   Form validation
├── styles/           # ⭐ ADD: Shared styles (optional)
│   └── theme.ts      #   Colors, spacing, fonts
└── assets/           # Media files
```

---

## Common Patterns in Your App

### Pattern 1: Protected Routes

```typescript
// app/_layout.tsx
useEffect(() => {
  if (!isAuthenticated && inAuthGroup) {
    router.replace("/(public)/login");  // Redirect to login
  } else if (isAuthenticated && !inAuthGroup) {
    router.replace("/(auth)/dashboard"); // Redirect to dashboard
  }(app)/(home)/class/${classId}`);  // Pass parameter
const { id } = useLocalSearchParams();           // Get parameter

// Check current route
const currentRoute = segments[segments.length - 1];

// Check if in app group
const inAppGroup = segments[0] === "(app)";

// Check which tab group
const inHomeTab = segments[1] === "(home)";
const inProfileTab = segments[1] === "(profile
import { useLocalSearchParams } from 'expo-router';

export default function ClassDetails() {
  const { id } = useLocalSearchParams();  // Get route parameter
  
  // Fetch class data using id
  return <View><Text>Class ID: {id}</Text></View>;
}
pp)` tabs → Home/Profile
4. **User navigates** → File-based routing handles everything
5. **Tabs visible** → Only Home & Profile tab groups show in tab bar
6. **Stack navigation** → Each tab group has its own stack of screens
7. **Feature-based** → Screens organized by feature (home/classes, profile/settings)

### Pattern 3: Tab Navigation with Hidden Screens

```typescript
// Visible tabs: Dashboard, Profile
// Hidden screens: Edit Profile, Change Password, etpp routes
- 📱 **Tabs**: App layout provides bottom navigation with tab groups
- 📚 **Stack in tabs**: Each tab group has its own stack navigation
- 🚀 **Navigation**: Use `router` from `expo-router`
- 🏗️ **Feature-based**: Routes organized by feature (home, profile)
<TouchableOpacity onPress={() => router.push('/edit-profile')}>
  <Text>Edit Profile</Text>
</TouchableOpacity>

// edit-profile.tsx is accessible but not in tab bar
```

---

## Comparison: React Web vs React Native (Your App)

| Feature | React Web | React Native (Your App) |
|---------|-----------|-------------------------|
| **Entry Point** | `main.jsx` → `App.jsx` | `app/_layout.tsx` |
| **Routing** | React Router (manual) | Expo Router (file-based) |
| **Navigation** | `<Link>`, `useNavigate()` | `router.push()`, `router.replace()` |
| **Layout** | Custom wrappers | `_layout.tsx` files |
| **Nested Routes** | `<Outlet />` | Nested `_layout.tsx` |
| **Dynamic Routes** | `/user/:id` | `/user/[id].tsx` |
| **Tabs** | Custom implementation | `<Tabs>` component |
| **Auth Protection** | Route wrappers | Layout-level checks |

---

## Quick Reference: Navigation Cheat Sheet

```typescript
import { useRouter, useLocalSearchParams, useSegments } from 'expo-router';

const router = useRouter();
const params = useLocalSearchParams();
const segments = useSegments();

// Navigate
router.push('/profile');                    // Stack push
router.replace('/login');                   // Replace (no back)
router.back();                              // Go back

// Dynamic routes
router.push(`/class-details/${classId}`);   // Pass parameter
const { id } = useLocalSearchParams();      // Get parameter

// Check current route
const currentRoute = segments[segments.length - 1];

// Check if in auth group
const inAuthGroup = segments[0] === "(auth)";
```

---

## Summary

### Your App Flow (Simple Version):

1. **App starts** → `app/_layout.tsx` (root layout)
2. **Check auth** → AuthContext determines state
3. **Route user**:
   - Not logged in → `(public)` stack → Login/Register
   - Logged in → `(auth)` tabs → Dashboard/Profile
4. **User navigates** → File-based routing handles everything
5. **Tabs visible** → Only Dashboard & Profile show in tab bar
6. **Hidden screens** → Accessible via code, not tabs

### Key Concepts:

- 📁 **File = Route**: No manual routing needed
- 📂 **`(groups)`**: Organize without affecting URLs
- 🎨 **`_layout.tsx`**: Wraps children with common UI/logic
- 🔒 **Auth check**: Root layout decides public vs auth routes
- 📱 **Tabs**: Auth layout provides bottom navigation
- 🚀 **Navigation**: Use `router` from `expo-router`

---

## Next Steps for Learning:

1. ✅ Understand this structure
2. ✅ Create a `components/` folder for reusable UI
3. ✅ Add more screens following the file-based routing pattern
4. ✅ Experiment with navigation between screens
5. ✅ Learn React Native core components (View, Text, FlatList, etc.)

---

**Need Help?**
- Expo Router Docs: https://docs.expo.dev/router/introduction/
- React Native Docs: https://reactnative.dev/docs/getting-started

---

*Generated for your Attendance Native App - January 2026*
