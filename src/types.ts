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
  outerValenceElectrons?: number; // Outer s/p electrons (1-8) for Lewis dot diagrams

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

export type IsomerClassification =
  | 'Constitutional (Functional Group)'
  | 'Constitutional (Skeletal Chain)'
  | 'Constitutional (Positional / Tautomeric)'
  | 'Geometric (cis/trans)'
  | 'Ring-Chain'
  | 'Allotrope'
  | 'Canonical';

export interface MoleculeAtomNode {
  symbol: string;
  x: number;
  y: number;
  z: number;
  partialCharge?: number;
  formalCharge?: number;
  hybridization?: string;
  lonePairs?: number;
}

export interface MoleculeBondEdge {
  source: number;
  target: number;
  order: 1 | 1.33 | 1.5 | 2 | 3;
  lengthAngstrom?: number;
}

export interface MoleculeDossier {
  id: string;
  name: string;
  iupacName: string;
  commonNames: string[];
  casNumber: string;
  smiles: string;
  formula: string; // Hill system with Unicode subscripts e.g. 'C₂H₆O'
  condensedFormula: string; // e.g. 'CH₃CH₂OH'
  isomerGroup: string; // Raw formula key e.g. 'C2H6O', 'C3H6O', 'C4H10', 'C3H6', 'C2H2Cl2', 'CH4N2O', 'O_Allotropes'
  isomerType: IsomerClassification;
  isomerComparisonNote?: string;
  category:
    | 'Inorganic'
    | 'Organic'
    | 'Hydrocarbon'
    | 'Hypervalent'
    | 'Allotrope'
    | 'Ionic / Salt'
    | 'Noble Gas';
  molecularWeight: number;
  degreeOfUnsaturation: number;
  pointGroup: string;
  bondType: 'Covalent' | 'Polar Covalent' | 'Ionic' | 'Coordinate Covalent' | 'Delocalized Aromatic';
  geometry: string;
  electronicGeometry: string;
  vseprNotation: string; // e.g. 'AX₂E₂', 'AX₄', 'AX₅'
  stericNumber: number;
  bondAngle: string;
  hybridization: string;
  polarity: 'Polar' | 'Nonpolar';
  dipoleMomentDebye: number;
  description: string;
  formationCriteria: {
    octetRuleStatus: string;
    deltaEN: string;
    sigmaBonds: number;
    piBonds: number;
    lonePairsTotal: number;
    resonanceDescription: string;
  };
  thermodynamics: {
    deltaHf: string;
    deltaGf: string;
    entropyS: string;
    bondEnergies: Array<{
      bond: string;
      lengthAngstrom: number;
      energyKjMol: number;
    }>;
  };
  synthesisMethods: {
    industrial: {
      processName: string;
      equation: string;
      conditions: string;
      catalyst: string;
      mechanismSummary: string;
    };
    laboratory: {
      methodName: string;
      equation: string;
      reagents: string;
      conditions: string;
      procedureNotes: string;
    };
  };
  physicalProperties: {
    stateAtSTP: 'Gas' | 'Liquid' | 'Solid';
    appearance: string;
    meltingPointC: string;
    boilingPointC: string;
    density: string;
    solubility: string;
    pKa: string;
    intermolecularForces: string[];
  };
  spectroscopy: {
    irBands: Array<{ wavenumberCm: string; assignment: string }>;
    nmrShifts: Array<{ nucleus: string; shiftPpm: string; assignment: string }>;
  };
  applications: {
    industrial: string[];
    laboratory: string[];
    biologicalAndMedical: string[];
  };
  safety: {
    ghsHazards: string[];
    nfpa704: {
      health: number;
      flammability: number;
      instability: number;
      special?: string;
    };
    handling: string;
  };
  atoms: MoleculeAtomNode[];
  bonds: MoleculeBondEdge[];
}

export type Molecule = MoleculeDossier;

export interface Reaction {
  id: string;
  title: string;
  reactants: string[];
  products: string[];
  balancedEquation: string;
  energyChange: string; // e.g. "-184 kJ/mol (Exothermic)"
  reactionType:
    | 'Synthesis'
    | 'Decomposition'
    | 'Single Replacement'
    | 'Double Replacement'
    | 'Combustion'
    | 'Acid-Base'
    | 'Redox';
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
  phaseState?:
    | 'Gas Phase'
    | 'Aqueous Solution'
    | 'Heterogeneous / Solid-Liquid'
    | 'High Temperature Plasma';
  colorTheme?: { reactant1: string; reactant2: string; product: string };
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
  | 'molecule-visualizer'
  | 'molecule-builder'
  | 'reaction-simulator'
  | 'trends'
  | 'learning'
  | 'ai-tutor';

export type Atom3DTab = 'bohr' | 'orbitals' | 'quantum-numbers' | 'energy' | 'crystal';

export interface PendingReactionSetup {
  reactantSymbols: string[];
  temperature: number;
  pressure: number;
  catalyst: boolean;
  moleculeId?: string;
  moleculeName?: string;
  moleculeFormula?: string;
}

