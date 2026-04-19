import React from 'react';
import { Card, Button, Input, Badge } from '@/components/ui';
import { Plus, Upload, Search } from 'lucide-react';

export const AccountInfo = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div className="flex gap-3">
          <Button className="gap-2"><Plus className="w-4 h-4" /> 新增账号</Button>
          <Button variant="outline" className="gap-2"><Upload className="w-4 h-4" /> 批量导入</Button>
        </div>
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input className="pl-9 h-9" placeholder="搜索姓名或账号..." />
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-6 py-3 font-medium">姓名</th>
              <th className="px-6 py-3 font-medium">账号</th>
              <th className="px-6 py-3 font-medium">角色</th>
              <th className="px-6 py-3 font-medium">状态</th>
              <th className="px-6 py-3 font-medium">最后登录</th>
              <th className="px-6 py-3 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[
              { name: '施任远', account: 'shirenyuan41@gmail.com', role: '管理员', status: '正常', lastLogin: '2026-04-16 09:12' },
              { name: '张三', account: 'zhangsan@superev.com', role: '用研角色', status: '正常', lastLogin: '2026-04-15 18:30' },
              { name: '李四', account: 'lisi@superev.com', role: '销售角色', status: '已停用', lastLogin: '2026-03-01 10:00' },
            ].map((user, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                <td className="px-6 py-4 text-slate-600">{user.account}</td>
                <td className="px-6 py-4"><Badge variant="outline">{user.role}</Badge></td>
                <td className="px-6 py-4">
                  <Badge variant={user.status === '正常' ? 'success' : 'default'}>{user.status}</Badge>
                </td>
                <td className="px-6 py-4 text-slate-500">{user.lastLogin}</td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">编辑</Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">删除</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
