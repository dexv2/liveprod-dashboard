"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface DeviceContextType {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function useDevice() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error("useDevice must be used within DeviceProvider");
  }
  return context;
}

export default function DeviceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [deviceType, setDeviceType] = useState<DeviceContextType>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 768px)");
    const tabletQuery = window.matchMedia("(min-width: 769px) and (max-width: 1024px)");

    const updateDeviceType = () => {
      setDeviceType({
        isMobile: mobileQuery.matches,
        isTablet: tabletQuery.matches,
        isDesktop: !mobileQuery.matches && !tabletQuery.matches,
      });
    };

    // Initial check
    updateDeviceType();

    // Listen for changes
    mobileQuery.addEventListener("change", updateDeviceType);
    tabletQuery.addEventListener("change", updateDeviceType);

    return () => {
      mobileQuery.removeEventListener("change", updateDeviceType);
      tabletQuery.removeEventListener("change", updateDeviceType);
    };
  }, []);

  return (
    <DeviceContext.Provider value={deviceType}>
      {children}
    </DeviceContext.Provider>
  );
}
