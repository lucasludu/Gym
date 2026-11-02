import { Stack, useLocalSearchParams } from 'expo-router';

import { ClassDetailScreen } from '../../src/components/classes/ClassDetailScreen';

export default function ClassDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Clase' }} />
      <ClassDetailScreen id={id} />
    </>
  );
}
