import React from 'react';
import { ElementData } from '../../types';
import { CrystalLatticeView } from './CrystalLatticeView';
import {
  LatticeSystemType,
  MillerPlaneType,
  inferElementLatticeSystem,
} from '../../utils/CrystalLatticeEngine';

export type { LatticeSystemType, MillerPlaneType };
export { inferElementLatticeSystem };

interface CrystalLattice3DProps {
  element: ElementData;
}

export const CrystalLattice3D: React.FC<CrystalLattice3DProps> = ({ element }) => {
  return <CrystalLatticeView element={element} />;
};
