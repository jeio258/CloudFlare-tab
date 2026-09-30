// 认证全局状态：登录/登出驱动全 UI 刷新（参考前端"登录后整站联动"）
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { readPersist, writePersist, clearPersist, getToken as readToken } from './user';
import { post, get } from '../api/client';
import type { ApiResp } from '../api/client';
import type { LoginData, UserInfo } from '../api/types';

interface AuthState {
  token: string;
  userInfo: UserInfo | null;
  isLogin: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<ApiResp<LoginData>>;
  logout: () => Promise<void>;
  setUserInfo: (u: UserInfo) => void;
}

const AuthCtx = createContext<AuthState>({
  token: '',
  userInfo: null,
  isLogin: false,
  isAdmin: false,
  login: async () => ({ code: -1, msg: '', data: null }),
  logout: async () => undefined,
  setUserInfo: () => undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(readToken);
  const [userInfo, setUserInfoState] = useState<UserInfo | null>(() => readPersist().userInfo ?? null);

  const login = useCallback(async (username: string, password: string) => {
    const resp = await post<LoginData>('/api/login', { username, password });
    if (resp.code === 200 && resp.data) {
      writePersist({ token: resp.data.token, userInfo: resp.data.userInfo });
      setToken(resp.data.token);
      setUserInfoState(resp.data.userInfo);
    }
    return resp;
  }, []);

  const logout = useCallback(async () => {
    await get('/api/user/logout');
    clearPersist();
    setToken('');
    setUserInfoState(null);
  }, []);

  // 更新资料须同步持久化，否则刷新后回退到登录时快照
  const setUserInfo = useCallback((u: UserInfo) => {
    writePersist({ token: readToken(), userInfo: u });
    setUserInfoState(u);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      token,
      userInfo,
      isLogin: !!token,
      isAdmin: userInfo?.userType === 1,
      login,
      logout,
      setUserInfo,
    }),
    [token, userInfo, login, logout, setUserInfo]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
