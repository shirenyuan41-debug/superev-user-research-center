import React from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { Users, UserCheck, Network, ArrowRight } from 'lucide-react';

export const EmployeeResearch = () => {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">员工研究中心</h2>
        <p className="text-slate-500">组织效能与人才发展 AI 洞察</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4">
            <Badge variant="outline" className="bg-slate-50">敬请期待 V3</Badge>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">盖洛普 Q12 分析</h3>
          <p className="text-sm text-slate-600 mb-6 h-10">
            基于员工访谈与问卷，深度解析团队敬业度与管理盲区。
          </p>
          
          <div className="space-y-3 mb-8">
            <div className="text-xs font-medium text-slate-900">未来输出能力：</div>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-400"></div> 团队优势画像</li>
              <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-400"></div> 离职风险预警</li>
              <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-400"></div> 个性化管理建议</li>
            </ul>
          </div>
          
          <Button variant="outline" className="w-full justify-between text-sm group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
            了解规划 <ArrowRight className="w-4 h-4" />
          </Button>
        </Card>

        <Card className="p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4">
            <Badge variant="outline" className="bg-slate-50">敬请期待 V3</Badge>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-[#00A854]/10 flex items-center justify-center text-[#00A854] mb-6">
            <UserCheck className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">人岗匹配度评估</h3>
          <p className="text-sm text-slate-600 mb-6 h-10">
            结合绩效数据与行为特征，评估员工与当前岗位的适配性。
          </p>
          
          <div className="space-y-3 mb-8">
            <div className="text-xs font-medium text-slate-900">未来输出能力：</div>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-[#00A854]"></div> 岗位胜任力模型</li>
              <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-[#00A854]"></div> 绩效瓶颈诊断</li>
              <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-[#00A854]"></div> 调岗与培训建议</li>
            </ul>
          </div>
          
          <Button variant="outline" className="w-full justify-between text-sm group-hover:border-green-200 group-hover:bg-green-50 group-hover:text-green-700 transition-colors">
            了解规划 <ArrowRight className="w-4 h-4" />
          </Button>
        </Card>

        <Card className="p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4">
            <Badge variant="outline" className="bg-slate-50">敬请期待 V3</Badge>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-6">
            <Network className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">人人匹配与协作</h3>
          <p className="text-sm text-slate-600 mb-6 h-10">
            分析团队成员间的性格特征与沟通偏好，优化团队组合。
          </p>
          
          <div className="space-y-3 mb-8">
            <div className="text-xs font-medium text-slate-900">未来输出能力：</div>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-purple-400"></div> 协作适配度雷达图</li>
              <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-purple-400"></div> 跨部门沟通指南</li>
              <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-purple-400"></div> 项目搭班建议</li>
            </ul>
          </div>
          
          <Button variant="outline" className="w-full justify-between text-sm group-hover:border-purple-200 group-hover:bg-purple-50 group-hover:text-purple-700 transition-colors">
            了解规划 <ArrowRight className="w-4 h-4" />
          </Button>
        </Card>
      </div>
    </div>
  );
};
