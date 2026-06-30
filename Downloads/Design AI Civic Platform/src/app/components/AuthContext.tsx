import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../firebase";
import {
  ensureUserProfile,
  subscribeToUserProfile,
} from "../lib/firebaseData";
import type { AppUser } from "../types";
import { isDepartmentRole, isSuperAdminRole } from "../types";

interface AuthContextValue {
  user: User | null;
  profile: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isDepartmentAdmin: boolean;
  isDepartmentUser: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isSuperAdmin: false,
  isDepartmentAdmin: false,
  isDepartmentUser: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile = () => {};
    return onAuthStateChanged(auth, async (nextUser) => {
      unsubscribeProfile();
      setUser(nextUser);
      setProfile(null);
      if (!nextUser) {
        setLoading(false);
        return;
      }
      try {
        await ensureUserProfile(nextUser);
        unsubscribeProfile = subscribeToUserProfile(nextUser.uid, (nextProfile) => {
          setProfile(nextProfile);
          setLoading(false);
        });
      } catch (error) {
        console.error("Unable to load user profile", error);
        setLoading(false);
      }
    });
  }, []);

  const isDepartmentUser = isDepartmentRole(profile?.role);
  const isSuperAdmin = isSuperAdminRole(profile?.role);
  const isDepartmentAdmin = profile?.role === "department_admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin: isDepartmentUser,
        isSuperAdmin,
        isDepartmentAdmin,
        isDepartmentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
