import React, { useEffect, useRef, useState } from 'react';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { InterviewAnalysis } from './pages/InterviewAnalysis';
import { UserPersona } from './pages/UserPersona';
import { TodoManagement } from './pages/TodoManagement';
import { UsageFeedback } from './pages/UsageFeedback';
import { SalesResearch } from './pages/SalesResearch';
import { PublicOpinionResearch } from './pages/PublicOpinionResearch';
import { IndustryResearch } from './pages/IndustryResearch';
import { EmployeeResearch } from './pages/EmployeeResearch';
import { DataCenter } from './pages/DataCenter';
import { AccountInfo } from './pages/SystemManagement/AccountInfo';
import { RolePermissions } from './pages/SystemManagement/RolePermissions';
import { PromptManagement } from './pages/SystemManagement/PromptManagement';
import { DataIngestion } from './pages/SystemManagement/DataIngestion';
import { SecurityPrivacy } from './pages/SystemManagement/SecurityPrivacy';
import { LegacyExport } from './pages/LegacyExport';
import { ApiError, api } from './lib/api';
import { globalStore } from './lib/store';

const ACTIVITY_TIMEOUT_MS = 12 * 60 * 60 * 1000;
const ACTIVITY_SYNC_THROTTLE_MS = 30 * 1000;
const SESSION_CHECK_INTERVAL_MS = 60 * 1000;

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

export default function App() {
  const isLegacyExportMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get('page') === 'legacy-export';
  const apiTarget = import.meta.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:3001';
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking');
  const [systemNotice, setSystemNotice] = useState('');
  const [currentPage, setCurrentPage] = useState('首页');
  const lastActivityRef = useRef<number | null>(null);

  const getBackendIssueMessage = (error: unknown) => {
    if (error instanceof ApiError && error.status >= 500) {
      return `本地后端当前不可用，前端无法完成登录态恢复。请先确认后端服务已启动，并且 ${apiTarget} 可访问；后端还依赖 MySQL 和 backend/.env。`;
    }

    if (error instanceof Error && /Failed to fetch|NetworkError|fetch/i.test(error.message)) {
      return `本地后端当前不可用，前端无法完成登录态恢复。请先确认后端服务已启动，并且 ${apiTarget} 可访问；后端还依赖 MySQL 和 backend/.env。`;
    }

    return '';
  };

  const syncActivity = async (timestamp = Date.now()) => {
    lastActivityRef.current = timestamp;
    await api.auth.me();
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignore logout request failures and clear local state anyway.
    }

    lastActivityRef.current = null;
    globalStore.reset();
    setAuthStatus('unauthenticated');
  };

  const bootstrapAuthenticatedState = async () => {
    await api.auth.me();
    await globalStore.loadAll(true);
    lastActivityRef.current = Date.now();
    setSystemNotice('');
    setAuthStatus('authenticated');
  };

  const login = async (account: string, password: string) => {
    try {
      await api.auth.login({ account, password });
      await globalStore.loadAll(true);
      lastActivityRef.current = Date.now();
      setSystemNotice('');
      setAuthStatus('authenticated');
    } catch (error) {
      const backendIssueMessage = getBackendIssueMessage(error);
      if (backendIssueMessage) {
        setSystemNotice(backendIssueMessage);
        throw new Error(backendIssueMessage);
      }

      throw error;
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        await bootstrapAuthenticatedState();
      } catch (error) {
        globalStore.reset();
        setSystemNotice(getBackendIssueMessage(error));
        setAuthStatus('unauthenticated');
      }
    })();
  }, []);

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      return;
    }

    let lastSyncedAt = lastActivityRef.current ?? Date.now();

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastSyncedAt < ACTIVITY_SYNC_THROTTLE_MS) {
        return;
      }

      lastSyncedAt = now;
      void syncActivity(now).catch(() => {
        void logout();
      });
    };

    const checkSession = () => {
      const lastActivityAt = lastActivityRef.current;
      if (lastActivityAt === null) {
        return;
      }

      if (Date.now() - lastActivityAt >= ACTIVITY_TIMEOUT_MS) {
        void logout();
      }
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      'click',
      'keydown',
      'mousemove',
      'scroll',
      'touchstart',
      'focus',
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });

    const intervalId = window.setInterval(checkSession, SESSION_CHECK_INTERVAL_MS);

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
      window.clearInterval(intervalId);
    };
  }, [authStatus]);

  if (isLegacyExportMode) {
    return <LegacyExport />;
  }

  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9F8] text-slate-500">
        正在恢复登录状态...
      </div>
    );
  }

  if (authStatus !== 'authenticated') {
    return <Login onLogin={login} systemNotice={systemNotice} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case '首页': return <Home setCurrentPage={setCurrentPage} />;
      case '访谈分析': return <InterviewAnalysis />;
      case '用户画像': return <UserPersona />;
      case 'Todo管理': return <TodoManagement />;
      case '使用反馈': return <UsageFeedback />;
      case '销转研究': return <SalesResearch />;
      case '舆情研究': return <PublicOpinionResearch />;
      case '行业研究': return <IndustryResearch />;
      case '员工研究': return <EmployeeResearch />;
      case '数据中心': return <DataCenter />;
      case '账号信息': return <AccountInfo />;
      case '角色权限': return <RolePermissions />;
      case '提示词管理': return <PromptManagement />;
      case '数据入口': return <DataIngestion />;
      case '安全与隐私': return <SecurityPrivacy />;
      default: return <Home setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={() => { void logout(); }}>
      {renderPage()}
    </Layout>
  );
}
