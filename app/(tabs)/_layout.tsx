import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

// Import the main screen directly since we're removing tabs
import FleetManagementScreen from './index';

export default function TabLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4A90A4" />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  // Render the map screen directly without tabs
  return <FleetManagementScreen />;
}
