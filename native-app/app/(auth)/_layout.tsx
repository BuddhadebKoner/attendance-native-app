import { Tabs } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function AuthLayout() {
   return (
      <Tabs
         screenOptions={{
            headerShown: false,
            tabBarStyle: {
               backgroundColor: '#000000',
               borderTopColor: '#333',
               borderTopWidth: 1,
               height: Platform.OS === 'ios' ? 85 : 65,
               paddingBottom: Platform.OS === 'ios' ? 25 : 10,
               paddingTop: 8,
            },
            tabBarActiveTintColor: '#ffffff',
            tabBarInactiveTintColor: '#666',
         }}
      >
         <Tabs.Screen
            name="dashboard"
            options={{
               title: 'Dashboard',
               tabBarLabel: 'Home',
               tabBarIcon: ({ color, size }) => (
                  <Ionicons name="home" size={size} color={color} />
               ),
            }}
         />
         <Tabs.Screen
            name="profile"
            options={{
               title: 'Profile',
               tabBarLabel: 'Profile',
               tabBarIcon: ({ color, size }) => (
                  <Ionicons name="person" size={size} color={color} />
               ),
            }}
         />
         {/* Hide other screens from tab bar */}
         <Tabs.Screen
            name="edit-profile"
            options={{
               href: null,
            }}
         />
         <Tabs.Screen
            name="change-password"
            options={{
               href: null,
            }}
         />
         <Tabs.Screen
            name="create-class"
            options={{
               href: null,
            }}
         />
         <Tabs.Screen
            name="class-details/[id]"
            options={{
               href: null,
            }}
         />
         <Tabs.Screen
            name="update-class/[id]"
            options={{
               href: null,
            }}
         />
         <Tabs.Screen
            name="notifications"
            options={{
               href: null,
            }}
         />
         <Tabs.Screen
            name="privacy"
            options={{
               href: null,
            }}
         />
      </Tabs>
   );
}
