import { createContext } from "react";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  profile_image_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AuthContextValue = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (token: string, userData: AuthUser, redirectPath?: string) => void;
  logout: () => void;
  updateUser: (newUser: AuthUser | null) => void;
};

export const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

