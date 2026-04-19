import React from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { MessageSquareWarning, Video, ArrowRight } from 'lucide-react';

export const PublicOpinionResearch = () => {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">舆情研究中心</h2>
        <p className="text-slate-500">全网声量监控与情绪感知</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4">
            <Badge variant="warning">即将上线 V2</Badge>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 mb-6">
            <MessageSquareWarning className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">小红书舆情洞察</h3>
          <p className="text-slate-600 mb-6">
            实时抓取小红书平台关于“超级电动”、“新能源订阅”的笔记与评论，自动识别用户情绪与潜在风险。
          </p>
          
          <div className="space-y-3 mb-8">
            <div className="text-sm font-medium text-slate-900">未来能力预告：</div>
            <ul className="text-sm text-slate-600 space-y-2">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> 自动抓取评论/帖子</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> 情绪识别与分类</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> 品牌公关风险预警</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> 竞品声量对比分析</li>
            </ul>
          </div>
          
          <Button variant="outline" className="w-full justify-between group-hover:border-red-200 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
            申请优先接入体验 <ArrowRight className="w-4 h-4" />
          </Button>
        </Card>

        <Card className="p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4">
            <Badge variant="warning">即将上线 V2</Badge>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white mb-6">
            <Video className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">抖音短视频舆情</h3>
          <p className="text-slate-600 mb-6">
            监控抖音平台相关视频内容的评论区，挖掘下沉市场与年轻群体的真实反馈。
          </p>
          
          <div className="space-y-3 mb-8">
            <div className="text-sm font-medium text-slate-900">未来能力预告：</div>
            <ul className="text-sm text-slate-600 space-y-2">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div> 爆款视频评论区挖掘</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div> 视频内容标签化提取</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div> 负面评论实时告警</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div> 潜在客资线索识别</li>
            </ul>
          </div>
          
          <Button variant="outline" className="w-full justify-between group-hover:border-slate-300 group-hover:bg-slate-100 group-hover:text-slate-900 transition-colors">
            申请优先接入体验 <ArrowRight className="w-4 h-4" />
          </Button>
        </Card>
      </div>
    </div>
  );
};
