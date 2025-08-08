import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'bartrack',
  webDir: 'dist',
  plugins: {
    BarcodeScanner: {
      NSCameraUsageDescription: "We need camera access to scan barcodes for inventory management."
    }
  }
};

export default config;
