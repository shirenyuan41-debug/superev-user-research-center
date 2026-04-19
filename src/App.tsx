import React, { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
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
import { globalStore } from './lib/store';

export default function App() {
  const isLegacyExportMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get('page') === 'legacy-export';
  const [systemNotice, setSystemNotice] = useState('');
  const [currentPage, setCurrentPage] = useState('首页');

  useEffect(() => {
    void (async () => {
      try {
        await globalStore.loadAll(true);
        setSystemNotice('');
      } catch (error) {
        globalStore.reset();
        const message = error instanceof Error ? error.message : '后端数据加载失败，当前将以空数据进入首页。';
        setSystemNotice(message || '后端数据加载失败，当前将以空数据进入首页。');
      }
    })();
  }, []);

  if (isLegacyExportMode) {
    return <LegacyExport />;
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
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={() => setCurrentPage('首页')}>
      {systemNotice ? (
        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {systemNotice}
        </div>
      ) : null}
      {renderPage()}
    </Layout>
  );
}
