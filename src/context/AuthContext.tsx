import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "@/lib/api";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
};

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (accessToken: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "auth_user";
const TOKEN_KEY = "auth_token";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const persistSession = (token: string, userData: AppUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    persistSession(data.token, data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    persistSession(data.token, data.user);
  };

  const loginWithGoogle = async (accessToken: string) => {
    const { data } = await api.post("/auth/google", { accessToken });
    persistSession(data.token, data.user);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};

