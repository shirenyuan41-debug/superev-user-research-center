import React, { useEffect, useState } from 'react';
import { Card, Button, Drawer, Badge } from '@/components/ui';
import { ArrowRight, Sparkles, AlertTriangle, TrendingUp, Lightbulb, FileText, MessageSquare, Database, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { globalStore } from '@/lib/store';

const buildDashboardStats = () => ({
  pendingTodoCount: globalStore.todos.filter((todo) => todo.status === '待跟进' || todo.status === '跟进中').length,
  pendingFeedbackCount: globalStore.feedbacks.filter((feedback: any) => feedback.type === 'down').length,
  analyzedDocumentCount: globalStore.documents.filter((document: any) => Boolean(document.analysisResult)).length,
  pendingImportCount: globalStore.documents.filter((document: any) => !document.analysisResult).length,
});

export const Home = ({ setCurrentPage }: { setCurrentPage: (page: string) => void }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<any>(null);
  const [dashboardStats, setDashboardStats] = useState(buildDashboardStats());

  useEffect(() => {
    const unsubscribe = globalStore.subscribe(() => {
      setDashboardStats(buildDashboardStats());
    });

    return unsubscribe;
  }, []);

  // Calculate days since 2025-08-18
  const joinDate = new Date('2025-08-18');
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - joinDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const insights = [
    {
      id: 1,
      title: '乐道 L60 试驾转化率下降预警',
      type: '风险预警',
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      source: '销转研究 · 聊天记录分析',
      judgment: '近期关于“后排空间局促”的抱怨增加，导致试驾后未下订比例上升 12%。',
      quote: '“车看起来挺大，但后排坐三个成年人还是有点挤，我再看看别的吧。”',
    },
    {
      id: 2,
      title: '灵活订阅在“候鸟人群”中潜力巨大',
      type: '机会发现',
      icon: Lightbulb,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
      source: '用户研究 · 访谈分析',
      judgment: '冬季前往海南、夏季前往云贵的自由职业者对 1-3 个月的灵活订阅表现出极高兴趣。',
      quote: '“我每年冬天都在三亚呆两个月，要是能在那边直接提一辆车，走的时候还掉，那就太完美了。”',
    },
    {
      id: 3,
      title: '“电池衰减焦虑”正在向“智驾过时焦虑”转移',
      type: '趋势洞察',
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      source: '舆情研究 · 小红书分析',
      judgment: '用户对电池寿命的关注度同比下降 20%，而对“买完车智驾芯片就落后”的担忧上升 35%。',
      quote: '“现在电车更新太快了，刚买半年芯片就换代，感觉像买了个大号手机，还是订阅划算。”',
    }
  ];

  const openInsight = (insight: any) => {
    setSelectedInsight(insight);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Quote */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-1">嗨，施任远，今天是你加入超级电动的第 {diffDays} 天</h1>
          <p className="text-slate-500 italic">真正的洞察，不是看见更多，而是更早行动。</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Actions & Todos */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00A854]" />
              快捷工作台
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setCurrentPage('访谈分析')} className="flex flex-col items-center justify-center p-4 rounded-lg bg-slate-50 hover:bg-green-50 hover:text-[#00A854] transition-colors border border-slate-100 group">
                <FileText className="w-6 h-6 mb-2 text-slate-400 group-hover:text-[#00A854]" />
                <span className="text-xs font-medium">新建访谈分析</span>
              </button>
              <button onClick={() => setCurrentPage('用户画像')} className="flex flex-col items-center justify-center p-4 rounded-lg bg-slate-50 hover:bg-green-50 hover:text-[#00A854] transition-colors border border-slate-100 group">
                <Users className="w-6 h-6 mb-2 text-slate-400 group-hover:text-[#00A854]" />
                <span className="text-xs font-medium">查看用户画像</span>
              </button>
              <button onClick={() => setCurrentPage('销转研究')} className="flex flex-col items-center justify-center p-4 rounded-lg bg-slate-50 hover:bg-green-50 hover:text-[#00A854] transition-colors border border-slate-100 group">
                <MessageSquare className="w-6 h-6 mb-2 text-slate-400 group-hover:text-[#00A854]" />
                <span className="text-xs font-medium">聊天记录分析</span>
              </button>
              <button onClick={() => setCurrentPage('数据中心')} className="flex flex-col items-center justify-center p-4 rounded-lg bg-slate-50 hover:bg-green-50 hover:text-[#00A854] transition-colors border border-slate-100 group">
                <Database className="w-6 h-6 mb-2 text-slate-400 group-hover:text-[#00A854]" />
                <span className="text-xs font-medium">数据中心</span>
              </button>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">待办事项</h3>
              <button onClick={() => setCurrentPage('Todo管理')} className="text-xs text-[#00A854] hover:underline">查看全部</button>
            </div>
            <div className="space-y-3">
              {[
                { label: '已生成画像', count: dashboardStats.analyzedDocumentCount, color: 'bg-blue-100 text-blue-700' },
                { label: '待跟进 Todo', count: dashboardStats.pendingTodoCount, color: 'bg-red-100 text-red-700' },
                { label: '待处理反馈', count: dashboardStats.pendingFeedbackCount, color: 'bg-amber-100 text-amber-700' },
                { label: '待补分析文档', count: dashboardStats.pendingImportCount, color: 'bg-slate-100 text-slate-700' },
              ].map((item, i) => (
                <button key={i} onClick={() => setCurrentPage('Todo管理')} className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors">
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", item.color)}>{item.count}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: AI Insights */}
        <div className="lg:col-span-2">
          <Card className="p-5 h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00A854]" />
                AI 洞察推送
              </h3>
              <span className="text-xs text-slate-500">基于最新 24 小时数据生成</span>
            </div>
            
            <div className="space-y-4">
              {insights.map((insight) => (
                <div key={insight.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-sm hover:border-slate-200 transition-all group">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", insight.bgColor)}>
                        <insight.icon className={cn("w-5 h-5", insight.color)} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px]">{insight.type}</Badge>
                          <span className="text-xs text-slate-400">{insight.source}</span>
                        </div>
                        <h4 className="text-base font-medium text-slate-900 mb-2">{insight.title}</h4>
                        <p className="text-sm text-slate-600 line-clamp-2">{insight.judgment}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => openInsight(insight)} className="shrink-0 text-[#00A854] opacity-0 group-hover:opacity-100 transition-opacity">
                      详情 <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Insight Drawer */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="洞察详情" width="w-[480px]">
        {selectedInsight && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">{selectedInsight.type}</Badge>
                <span className="text-xs text-slate-500">{selectedInsight.source}</span>
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">{selectedInsight.title}</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-900 mb-2">关键判断</h4>
                <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700 leading-relaxed border border-slate-100">
                  {selectedInsight.judgment}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-900 mb-2">典型用户原声</h4>
                <div className="p-4 bg-green-50/50 rounded-lg text-sm text-slate-700 italic border border-green-100 relative">
                  <div className="absolute top-2 left-2 text-green-200 text-4xl font-serif leading-none">"</div>
                  <div className="relative z-10 pl-4">{selectedInsight.quote}</div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex gap-3">
              <Button className="flex-1">加入 Todo</Button>
              <Button variant="outline" className="flex-1">跳转原研究</Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
