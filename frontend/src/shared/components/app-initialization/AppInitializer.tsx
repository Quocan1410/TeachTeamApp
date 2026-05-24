"use client";

import { useEffect } from "react";
import StorageManager from "@/shared/utils/storageManager";

export default function AppInitializer() {
  useEffect(() => {
    // Run initialization on app load
    const initializeApp = async () => {
      try {
        // Check storage health
        StorageManager.checkStorageHealth();

        // AuthContext already verifies profile on load — avoid duplicate API call here
      } catch (error) {
        console.error("❌ App initialization error:", error);
      }
    };

    // Run initialization with a small delay to ensure DOM is ready
    const timer = setTimeout(initializeApp, 100);

    return () => clearTimeout(timer);
  }, []);

  // This component doesn't render anything
  return null;
}
