// context/PointsContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface PointsContextType {
  points: number;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export function PointsProvider({ children }: { children: React.ReactNode }) {
  // Här sätter vi startvärdet (t.ex. 10)
  const [points, setPoints] = useState(10); 

  return (
    <PointsContext.Provider value={{ points, setPoints }}>
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints() {
  const context = useContext(PointsContext);
  if (!context) {
    throw new Error('usePoints måste användas inom en PointsProvider');
  }
  return context;
}