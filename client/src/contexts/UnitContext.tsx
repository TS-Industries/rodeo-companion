import React, { createContext, useContext, useState } from "react";

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
  /** Currency symbol */
  currencySymbol: string;
  /** Currency label: "USD" or "CAD" */
  currencyLabel: string;
  /** Convert km to display distance string */
  formatDistance: (km: number) => string;
  /**
   * Default fuel economy value for the active unit system.
   * Canada: 12 L/100km  |  US: 20 MPG
   */
  defaultFuelEconomy: number;
  /**
   * Default fuel price for the active unit system.
   * Canada: 1.65 CAD/L  |  US: 3.50 USD/gal
   */
  defaultFuelPrice: number;
}

const UnitContext = createContext<UnitContextValue | null>(null);

const STORAGE_KEY = "rodeo_unit_system";

function readStoredSystem(): UnitSystem {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "US" || stored === "CA") return stored;
  } catch {}
  return "CA"; // Default to Canada
}

export function UnitProvider({ children }: { children: React.ReactNode }) {
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>(readStoredSystem);

  const setUnitSystem = (system: UnitSystem) => {
    setUnitSystemState(system);
    try {
      localStorage.setItem(STORAGE_KEY, system);
    } catch {}
  };

  const isCanada = unitSystem === "CA";

  const formatDistance = (km: number): string => {
    if (isCanada) return `${km.toFixed(1)} km`;
    return `${(km * 0.621371).toFixed(1)} mi`;
  };

  const value: UnitContextValue = {
    unitSystem,
    setUnitSystem,
    isCanada,
    distanceLabel: isCanada ? "km" : "mi",
    fuelEconomyLabel: isCanada ? "L/100km" : "MPG",
    fuelVolumeLabel: isCanada ? "L" : "gal",
    currencySymbol: isCanada ? "CA$" : "$",
    currencyLabel: isCanada ? "CAD" : "USD",
    formatDistance,
    // Canada: 12 L/100km is a typical truck/trailer combo
    // US: 10 MPG is a typical truck/trailer combo
    defaultFuelEconomy: isCanada ? 12 : 10,
    // Canada: ~1.65 CAD/L  |  US: ~3.50 USD/gal
    defaultFuelPrice: isCanada ? 1.65 : 3.50,
  };

  return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>;
}

export function useUnits(): UnitContextValue {
  const ctx = useContext(UnitContext);
  if (!ctx) throw new Error("useUnits must be used within UnitProvider");
  return ctx;
}
