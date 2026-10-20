export type ElementCategory =
  | 'alkali-metal'
  | 'alkaline-earth'
  | 'transition-metal'
  | 'post-transition-metal'
  | 'metalloid'
  | 'reactive-nonmetal'
  | 'noble-gas'
  | 'lanthanide'
  | 'actinide'
  | 'unknown';

export type PhysicalState = 'solid' | 'liquid' | 'gas' | 'synthetic';

export type ElementBlock = 's' | 'p' | 'd' | 'f';

export type HeatmapProperty =
  | 'none'
  | 'electronegativity'
  | 'atomicRadius'
  | 'density'
  | 'meltingPoint'
  | 'boilingPoint'
  | 'ionizationEnergy'
  | 'electronAffinity'
  | 'abundanceEarth'
  | 'atomicMass';

export interface ElementData {
  atomicNumber: number;
  symbol: string;
  name: string;
  atomicMass: number;
  category: ElementCategory;
  group: number; // 1-18, or 3 for lanthanides/actinides
  period: number; // 1-7
  block: ElementBlock;
  state: PhysicalState;
  discoveryYear: number | string;
  discoverer: string;
  electronConfiguration: string;
  bohrShells: number[]; // e.g., [2, 8, 18, 7]
  valenceElectrons: number;
  
  // Physical & Thermodynamic Properties
  electronegativity: number | null; // Pauling scale
  atomicRadius: number | null; // pm
  density: number | null; // g/cm³ or g/L for gases
  meltingPoint: number | null; // K
  boilingPoint: number | null; // K
  ionizationEnergy: number | null; // kJ/mol
  electronAffinity: number | null; // kJ/mol
  
  // Structures & Chemistry
  crystalStructure: string;
  oxidationStates: number[];
  
  // Natural occurrence & abundance
  occurrence: 'Natural' | 'Synthetic' | 'Decay Product';
  abundanceEarth: number | null; // mg/kg in earth's crust
  
  // Applications & Biological
  uses: string[];
  interestingFacts: string[];
  biologicalImportance: string;
  industrialApplications: string[];
  medicalApplications: string[];
  safety: string;
  summary: string;
}

export type GradeLevel =
  | 'Grade 5'
  | 'Grade 8'
  | 'Grade 10'
  | 'CBSE/ICSE'
  | 'JEE/NEET'
  | 'University';

export interface Molecule {
  id: string;
  name: string;
  formula: string;
  iupacName: string;
  molecularWeight: number;
  bondType: 'Covalent' | 'Ionic' | 'Polar Covalent' | 'Metallic' | 'Coordinate';
  geometry: 'Linear' | 'Bent' | 'Trigonal Planar' | 'Trigonal Pyramidal' | 'Tetrahedral' | 'Octahedral' | 'Complex';
  bondAngle: string;
  hybridization: string;
  polarity: 'Polar' | 'Nonpolar';
  description: string;
  atoms: { symbol: string; count: number; x?: number; y?: number; z?: number; color?: string }[];
  bonds: { source: number; target: number; order: 1 | 2 | 3 }[];
}

export interface Reaction {
  id: string;
  title: string;
  reactants: string[];
  products: string[];
  balancedEquation: string;
  energyChange: string; // e.g. "-184 kJ/mol (Exothermic)"
  reactionType: 'Synthesis' | 'Decomposition' | 'Single Replacement' | 'Double Replacement' | 'Combustion' | 'Acid-Base' | 'Redox';
  requiredConditions: {
    temp: number; // °C
    pressure: number; // atm
    catalyst?: string;
  };
  description: string;
  industrialApplication: string;
  safetyNotes?: string[];
  stepsExplanation?: { step: number; title: string; detail: string }[];
  activationEnergy?: number; // kJ/mol
  deltaH?: number; // kJ/mol (negative for exothermic, positive for endothermic)
  entropyChange?: number; // J/(mol·K)
  equilibriumType?: 'Reversible' | 'Irreversible';
  phaseState?: 'Gas Phase' | 'Aqueous Solution' | 'Heterogeneous / Solid-Liquid' | 'High Temperature Plasma';
  colorTheme?: { reactant1: string; reactant2: string; product: string };
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface UserNote {
  elementAtomicNumber: number;
  note: string;
  updatedAt: string;
}

export type ViewMode =
  | 'table'
  | '3d-atom'
  | 'molecule-builder'
  | 'reaction-simulator'
  | 'trends'
  | 'learning'
  | 'quiz'
  | 'ai-tutor';
