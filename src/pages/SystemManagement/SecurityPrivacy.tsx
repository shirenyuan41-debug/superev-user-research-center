import React from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { Shield, Clock, FileText, Download } from 'lucide-react';

export const SecurityPrivacy = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">安全与隐私设置</h2>
          <p className="text-sm text-slate-500">管理数据脱敏规则与操作审计日志</p>
        </div>
        <Button>保存设置</Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-[#00A854]" />
          <h3 className="text-base font-semibold text-slate-900">敏感信息保护 (自动脱敏)</h3>
        </div>
        <div className="space-y-4 ml-7">
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-[#00A854] focus:ring-[#00A854]" />
            <div>
              <div className="text-sm font-medium text-slate-900">自动脱敏手机号</div>
              <div className="text-xs text-slate-500">将 13812345678 替换为 138****5678</div>
            </div>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-[#00A854] focus:ring-[#00A854]" />
            <div>
              <div className="text-sm font-medium text-slate-900">自动脱敏身份证</div>
              <div className="text-xs text-slate-500">隐藏出生年月日等关键信息</div>
            </div>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-[#00A854] focus:ring-[#00A854]" />
            <div>
              <div className="text-sm font-medium text-slate-900">自动脱敏详细地址</div>
              <div className="text-xs text-slate-500">仅保留至省市区级别</div>
            </div>
          </label>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-semibold text-slate-900">数据策略</h3>
        </div>
        <div className="space-y-6 ml-7">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">原始文件保留期限</label>
            <select className="w-64 h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
              <option>永久保留</option>
              <option>180 天后自动删除</option>
              <option>90 天后自动删除</option>
              <option>30 天后自动删除</option>
            </select>
            <p className="text-xs text-slate-500 mt-2">超过期限的原始录音、文档将被彻底删除，但结构化分析结果将保留。</p>
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-sm font-medium text-slate-900 mb-2">导出权限控制</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="radio" name="export" className="text-[#00A854] focus:ring-[#00A854]" /> 仅管理员可导出原始数据
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="radio" name="export" defaultChecked className="text-[#00A854] focus:ring-[#00A854]" /> 允许用研角色导出原始数据
              </label>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-700" />
            <h3 className="text-base font-semibold text-slate-900">操作审计日志</h3>
          </div>
          <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" /> 导出完整日志</Button>
        </div>
        
        <div className="ml-7 space-y-4">
          {[
            { user: '施任远', time: '今天 09:12', action: '查看访谈报告', detail: '张先生_深度访谈.docx', type: 'read' },
            { user: 'sale_a', time: '昨天 18:22', action: '导出聊天分析', detail: '20260415_企微记录.csv', type: 'export' },
            { user: 'admin', time: '昨天 14:30', action: '修改提示词', detail: 'v1.2 草稿', type: 'update' },
            { user: '施任远', time: '昨天 10:05', action: '新增 Todo', detail: '优化交付等待期关怀话术', type: 'create' },
          ].map((log, i) => (
            <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="w-24 text-xs text-slate-400 shrink-0 pt-0.5">{log.time}</div>
              <div className="flex-1">
                <div className="text-sm text-slate-900">
                  <span className="font-medium">{log.user}</span> {log.action}
                </div>
                <div className="text-xs text-slate-500 mt-1">{log.detail}</div>
              </div>
              <Badge variant="outline" className="text-[10px] uppercase">{log.type}</Badge>
            </div>
          ))}
          
          <div className="pt-4 text-center">
            <Button variant="ghost" size="sm" className="text-slate-500">查看更多日志</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
