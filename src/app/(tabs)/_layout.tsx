import { Tabs } from 'expo-router';

import { CustomTabBar } from '@/components/ui/CustomTabBar';
import { surface } from '@/theme/tokens';

export function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: surface.base } }}
      tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

export default TabsLayout;
