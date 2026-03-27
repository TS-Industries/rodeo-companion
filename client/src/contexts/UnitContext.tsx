import React, { createContext, useContext, useState, useEffect } from "react";

export type UnitSystem = "US" | "CA";

interface UnitContextValue {
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => void;
  isCanada: boolean;
  /** Distance label: "mi" or "km" */
  distanceLabel: string;
  /** Fuel economy label: "MPG" or "L/100km" */
  fuelEconomyLabel: string;
  /** Fuel volume label: "gal" or "L" */
  fuelVolumeLabel: string;
  /** Currency label */
  currencyLabel: string;
  /** Convert km to display distance (km stays km for CA, converts to mi for US) */
  formatDistance: (km: number) => string;
  /** Default fuel economy value for the unit system */
  defaultFuelEconomy: number;
}

const UnitContext = createContext<UnitContextValue | null>(null);

const STORAGE_KEY = "rodeo_unit_system";

export function UnitProvider({ children }: { children: React.ReactNode }) {
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "US" || stored === "CA") return stored;
    } catch {}
    return "US";
  });

  const setUnitSystem = (system: UnitSystem) => {
    setUnitSystemState(system);
    try { localStorage.setItem(STORAGE_KEY, system); } catch {}
  };

  const isCanada = unitSystem === "CA";

  const formatDistance = (km: number): string => {
    if (isCanada) return `${km.toFixed(1)} km`;
    const miles = km * 0.621371;
    return `${miles.toFixed(1)} mi`;
  };

  const value: UnitContextValue = {
    unitSystem,
    setUnitSystem,
    isCanada,
    distanceLabel: isCanada ? "km" : "mi",
    fuelEconomyLabel: isCanada ? "L/100km" : "MPG",
    fuelVolumeLabel: isCanada ? "L" : "gal",
    currencyLabel: isCanada ? "CAD" : "USD",
    formatDistance,
    defaultFuelEconomy: isCanada ? 12 : 20, // 12 L/100km or 20 MPG
  };

  return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>;
}

export function useUnits(): UnitContextValue {
  const ctx = useContext(UnitContext);
  if (!ctx) throw new Error("useUnits must be used within UnitProvider");
  return ctx;
}
