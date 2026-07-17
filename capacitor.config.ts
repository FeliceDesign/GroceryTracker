import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.felicedesign.grocerytracker',
  appName: 'GroceryTracker',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
