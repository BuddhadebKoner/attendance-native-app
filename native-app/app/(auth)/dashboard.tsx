import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
   return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
         <Text style={{ color: '#ffffff' }}>Hello World</Text>
      </SafeAreaView>
   );
}
