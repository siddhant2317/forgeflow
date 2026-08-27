import { createContext, useContext, useState, useCallback } from 'react';
import { gql, useMutation, useQuery, ApolloError } from '@apollo/client';
import { readStoredToken } from './tokenStorage';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  googleLogin: (googleToken: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'lineforge_token';
const LEGACY_TOKEN_KEY = 'boltline_token';

function persistToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

const CURRENT_USER = gql`
  query CurrentUser {
    currentUser {
      id
      email
      name
      avatarUrl
    }
  }
`;

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user { id email name avatarUrl }
    }
  }
`;

const REGISTER = gql`
  mutation Register($email: String!, $password: String!, $name: String) {
    register(email: $email, password: $password, name: $name) {
      token
      user { id email name avatarUrl }
    }
  }
`;

const GOOGLE_LOGIN = gql`
  mutation GoogleLogin($googleToken: String!) {
    googleLogin(googleToken: $googleToken) {
      token
      user { id email name avatarUrl }
    }
  }
`;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { loading } = useQuery(CURRENT_USER, {
    skip: !token,
    onCompleted: (data) => setUser(data.currentUser),
    onError: () => {
      clearStoredToken();
      setToken(null);
      setUser(null);
    },
  });

  const handleAuth = useCallback((data: { token: string; user: AuthUser }) => {
    persistToken(data.token);
    setToken(data.token);
    setUser(data.user);
    setError(null);
  }, []);

  const handleError = useCallback((err: ApolloError) => {
    setError(err.message);
  }, []);

  const [loginMutation] = useMutation(LOGIN, {
    onCompleted: (d) => handleAuth(d.login),
    onError: handleError,
  });
  const [registerMutation] = useMutation(REGISTER, {
    onCompleted: (d) => handleAuth(d.register),
    onError: handleError,
  });
  const [googleLoginMutation] = useMutation(GOOGLE_LOGIN, {
    onCompleted: (d) => handleAuth(d.googleLogin),
    onError: handleError,
  });

  const login = async (email: string, password: string) => {
    await loginMutation({ variables: { email, password } });
  };
  const register = async (email: string, password: string, name?: string) => {
    await registerMutation({ variables: { email, password, name } });
  };
  const googleLogin = async (googleToken: string) => {
    await googleLoginMutation({ variables: { googleToken } });
  };
  const logout = () => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  };
  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, googleLogin, logout, error, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
