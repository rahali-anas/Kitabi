export type CategoryLayout = 'auto' | 'cards' | 'hexagon';

export interface PowerEntry {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  subEntries: string[];
}

export interface PowerCategory {
  id: string;
  name: string;
  subtitle: string;
  accent: string;
  layout: CategoryLayout;
  entries: PowerEntry[];
}

export interface PowerSystem {
  name: string;
  description: string;
  categories: PowerCategory[];
  rules: string[];
}

export const emptyPowerSystem = (): PowerSystem => ({
  name: '',
  description: '',
  categories: [],
  rules: [],
});

export const emptyCategory = (): PowerCategory => ({
  id: crypto.randomUUID(),
  name: '',
  subtitle: '',
  accent: '#7d2734',
  layout: 'auto',
  entries: [],
});

export const emptyEntry = (): PowerEntry => ({
  id: crypto.randomUUID(),
  name: '',
  subtitle: '',
  description: '',
  subEntries: [],
});