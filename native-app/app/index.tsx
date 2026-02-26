import { Redirect } from 'expo-router';

export default function Index() {
  // Default landing page is the dashboard (accessible to everyone)
  return <Redirect href="/(app)/(home)" />;
}
