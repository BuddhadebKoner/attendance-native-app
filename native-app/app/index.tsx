import { Redirect } from 'expo-router';

export default function Index() {
  // This will be handled by the root layout's navigation logic
  return <Redirect href="/(public)/login" />;
}
