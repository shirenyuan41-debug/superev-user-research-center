import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Users, 
  LineChart, 
  MessageSquareWarning, 
  UserCircle2, 
  Database, 
  Settings,
  LogOut,
  KeyRound,
  ChevronDown,
  ChevronRight,
  Globe
} from 'lucide-react';

export const Layout = ({ children, currentPage, setCurrentPage, onLogout }: { children: React.ReactNode, currentPage: string, setCurrentPage: (page: string) => void, onLogout: () => void }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    '用户研究': true,
    '系统管理': true,
  });

  const toggleMenu = (menu: string) => {
    setExpandedMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const navItems = [
    { id: '首页', icon: Home, label: '首页' },
    { 
      id: '用户研究', icon: Users, label: '用户研究',
      children: [
        { id: '访谈分析', label: '访谈分析' },
        { id: '用户画像', label: '用户画像' },
        { id: 'Todo管理', label: 'Todo管理' },
        { id: '使用反馈', label: '使用反馈' },
      ]
    },
    { id: '销转研究', icon: LineChart, label: '销转研究' },
    { id: '行业研究', icon: Globe, label: '行业研究' },
    { id: '舆情研究', icon: MessageSquareWarning, label: '舆情研究' },
    { id: '员工研究', icon: UserCircle2, label: '员工研究' },
    { id: '数据中心', icon: Database, label: '数据中心' },
    { 
      id: '系统管理', icon: Settings, label: '系统管理',
      children: [
        { id: '账号信息', label: '账号信息' },
        { id: '角色权限', label: '角色权限' },
        { id: '提示词管理', label: '提示词管理' },
        { id: '数据入口', label: '数据入口' },
        { id: '安全与隐私', label: '安全与隐私' },
      ]
    },
  ];

  return (
    <div className="flex h-screen w-full bg-[#F7F9F8] overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#00A854] rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">SUPEREV用研中心</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => item.children ? toggleMenu(item.id) : setCurrentPage(item.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  currentPage === item.id && !item.children ? "bg-green-50 text-[#00A854]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("w-5 h-5", currentPage === item.id && !item.children ? "text-[#00A854]" : "text-slate-400")} />
                  {item.label}
                </div>
                {item.children && (
                  <ChevronRight className={cn("w-4 h-4 transition-transform", expandedMenus[item.id] ? "rotate-90" : "")} />
                )}
              </button>
              
              {item.children && expandedMenus[item.id] && (
                <div className="mt-1 mb-2 ml-4 pl-4 border-l border-slate-100 space-y-1">
                  {item.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setCurrentPage(child.id)}
                      className={cn(
                        "w-full flex items-center px-3 py-2 rounded-lg text-sm transition-colors",
                        currentPage === child.id ? "bg-green-50 text-[#00A854] font-medium" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <h1 className="text-xl font-semibold text-slate-800">
            {currentPage === '首页' ? '工作台' : currentPage}
          </h1>
          
          <div className="relative">
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=shirenyuan" alt="Avatar" />
              </div>
              <div className="text-left hidden md:block">
                <div className="text-sm font-medium text-slate-700">施任远</div>
                <div className="text-xs text-slate-500">用研专家</div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-40">
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <KeyRound className="w-4 h-4" />
                    修改密码
                  </button>
                  <div className="h-px bg-slate-100 my-1" />
                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-[#F7F9F8] p-8">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
