import { Tabs } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function AppLayout() {
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
            name="(home)"
            options={{
               title: 'Home',
               tabBarLabel: 'Home',
               tabBarIcon: ({ color, size }) => (
                  <Ionicons name="home" size={size} color={color} />
               ),
            }}
         />
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
   );
}
