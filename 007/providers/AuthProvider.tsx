import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "@/api";

type User = { id: string; email: string } | null;

const AuthContext = createContext<{
  signIn: (email: string, password: string) => Promise<void>;
  register: (username:string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  token: string | null;
  user: User;
  isLoading: boolean;
}>({
  signIn: async () => {},
  register: async () => {},
  signOut: async () => {},
  token: null,
  user: null,
  isLoading: true,
});

export function useAuthSession() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Attache le token aux requêtes
  useEffect(() => {
    const interceptor = api.interceptors.request.use((cfg) => {
      if (token) cfg.headers.Authorization = `Bearer ${token}`;
      return cfg;
    });
    return () => api.interceptors.request.eject(interceptor);
  }, [token]);

  // Restaure la session au boot
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("@token");
      if (saved) {
        setToken(saved);
        try {
          const me = await api.get("/me");
          setUser(me.data);
        } catch {
          setToken(null);
          await AsyncStorage.removeItem("@token");
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const res = await api.post("/auth/login", { username, password });
    const t = res.data?.token as string;
    await AsyncStorage.setItem("@token", t);
    setToken(t);
    setUser(res.data?.user ?? null);
    router.replace("/_(authorized)/(tabs)");
  }, []);

  const register = useCallback(async (username:string, email: string, password: string) => {
    const res = await api.post("/auth/register", {username, email, password });
    console.log(res.data);
    const t = res.data?.token as string;
    await AsyncStorage.setItem("@token", t);
    setToken(t);
    setUser(res.data?.user ?? null);
    router.replace("/_(authorized)/(tabs)");
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem("@token");
    setToken(null);
    setUser(null);
    router.replace("/_login");
  }, []);

  return (
    <AuthContext.Provider
      value={{ signIn, register, signOut, token, user, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}