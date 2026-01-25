
export interface User {
  id: string;
  nom: string;
  prenom: string;
  nom_prenom: string; // Used for uniqueness check
}

export interface Rum {
  id: string;
  nom: string;
  couleur: string;
  degres: number;
  enStock: boolean;
  description?: string;
}

export interface Tasting {
  id: string;
  userId: string;
  rumId: string;
  note: number;
  commentaire?: string;
  timestamp?: any;
}

export interface TastingWithDetails extends Tasting {
  rumName: string;
  rumCouleur: string;
  rumDegres: number;
}
