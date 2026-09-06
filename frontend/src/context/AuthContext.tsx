import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';

import { authApi } from '../services/api';


// ============================================================
// USER TYPE
// ============================================================

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  company_id: number;
  company_name: string;
}


// ============================================================
// AUTH CONTEXT TYPE
// ============================================================

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;

  login: (
    company_name: string,
    password: string
  ) => Promise<void>;

  logout: () => void;
}


// ============================================================
// CREATE CONTEXT
// ============================================================

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );


// ============================================================
// AUTH PROVIDER
// ============================================================

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {

  const [user, setUser] =
    useState<User | null>(null);

  const [token, setToken] =
    useState<string | null>(
      localStorage.getItem(
        'attrition_token'
      )
    );

  const [loading, setLoading] =
    useState<boolean>(true);


  // ==========================================================
  // CHECK EXISTING LOGIN SESSION
  // ==========================================================

  useEffect(() => {

    const initAuth = async () => {

      if (token) {

        try {

          const userData =
            await authApi.getMe();

          setUser(userData);

        } catch (error) {

          console.error(
            'Session expired or invalid token:',
            error
          );

          localStorage.removeItem(
            'attrition_token'
          );

          setToken(null);
          setUser(null);

        }
      }

      setLoading(false);
    };


    initAuth();

  }, [token]);


  // ==========================================================
  // SAVE LOGIN SESSION
  // ==========================================================

  const persistSession = (
    response: any
  ) => {

    localStorage.setItem(
      'attrition_token',
      response.access_token
    );

    setToken(
      response.access_token
    );

    setUser(
      response.user
    );
  };


  // ==========================================================
  // COMPANY LOGIN
  // Company name acts as the login identity.
  // ==========================================================

  const login = async (
    company_name: string,
    password: string
  ) => {

    const response =
      await authApi.login(
        company_name,
        password
      );

    persistSession(response);
  };


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = () => {

    localStorage.removeItem(
      'attrition_token'
    );

    setToken(null);

    setUser(null);
  };


  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (

    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout
      }}
    >

      {children}

    </AuthContext.Provider>

  );
};


// ============================================================
// USE AUTH HOOK
// ============================================================

export const useAuth = () => {

  const context =
    useContext(AuthContext);

  if (!context) {

    throw new Error(
      'useAuth must be used within AuthProvider'
    );
  }

  return context;
};