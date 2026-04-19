import React from 'react';
import { Card } from '@/components/ui';
import { Globe, TrendingUp, BarChart3, PieChart } from 'lucide-react';

export const IndustryResearch = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">行业研究</h2>
          <p className="text-slate-500">洞察行业趋势，把握市场动态</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-slate-500">市场规模</div>
              <div className="text-2xl font-bold text-slate-900">128.5 亿</div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-slate-500">同比增长</div>
              <div className="text-2xl font-bold text-green-600">+12.4%</div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-slate-500">市场占有率</div>
              <div className="text-2xl font-bold text-slate-900">18.2%</div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-slate-500">关注地区</div>
              <div className="text-2xl font-bold text-slate-900">华东/华南</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-12 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
          <Globe className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">行业研报库正在完善中</h3>
        <p className="text-slate-500 max-w-md">
          我们正在整合各大咨询机构的深度研报与核心行业数据，敬请期待。
        </p>
      </Card>
    </div>
  );
};
