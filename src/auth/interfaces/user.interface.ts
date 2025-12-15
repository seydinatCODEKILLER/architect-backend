// Interface pour la création d'utilisateur
export interface CreateUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
}

// Interface pour la mise à jour d'utilisateur
export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string;
  emailVerified?: boolean;
}

// Interface pour le profil utilisateur
export interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  stats?: {
    architectureCount: number;
    diagramCount: number;
    adrCount: number;
  };
}
