import React, { useState } from 'react';
import { Card, Button, Tabs } from '@/components/ui';
import { Check } from 'lucide-react';

export const RolePermissions = () => {
  const [activeRole, setActiveRole] = useState('用研角色');

  const permissions = [
    { group: '用户研究', items: ['查看访谈分析', '编辑访谈分析', '查看用户画像', '编辑 Todo'] },
    { group: '销转研究', items: ['查看聊天分析', '使用文案工坊'] },
    { group: '数据中心', items: ['查看数据中心', '导出原始资料'] },
    { group: '系统管理', items: ['管理账号', '管理角色权限', '管理提示词', '管理数据入口'] },
  ];

  const roleMatrix: Record<string, string[]> = {
    '管理员': ['查看访谈分析', '编辑访谈分析', '查看用户画像', '编辑 Todo', '查看聊天分析', '使用文案工坊', '查看数据中心', '导出原始资料', '管理账号', '管理角色权限', '管理提示词', '管理数据入口'],
    '用研角色': ['查看访谈分析', '编辑访谈分析', '查看用户画像', '编辑 Todo', '查看数据中心', '导出原始资料'],
    '销售角色': ['查看访谈分析', '查看用户画像', '查看聊天分析', '使用文案工坊', '查看数据中心'],
    'HR角色': ['查看数据中心'],
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <Tabs 
          tabs={['管理员', '用研角色', '销售角色', 'HR角色']} 
          activeTab={activeRole} 
          onChange={setActiveRole} 
        />
        <Button>保存权限设置</Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-6 py-3 font-medium w-1/3">权限模块</th>
              <th className="px-6 py-3 font-medium w-1/3">权限项</th>
              <th className="px-6 py-3 font-medium text-center">授权状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {permissions.map((group, groupIdx) => (
              <React.Fragment key={groupIdx}>
                {group.items.map((item, itemIdx) => {
                  const hasPermission = roleMatrix[activeRole].includes(item);
                  return (
                    <tr key={itemIdx} className="hover:bg-slate-50">
                      {itemIdx === 0 && (
                        <td rowSpan={group.items.length} className="px-6 py-4 font-medium text-slate-900 align-top border-r border-slate-100 bg-white">
                          {group.group}
                        </td>
                      )}
                      <td className="px-6 py-4 text-slate-700">{item}</td>
                      <td className="px-6 py-4 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={hasPermission}
                            readOnly
                            className="w-4 h-4 rounded border-slate-300 text-[#00A854] focus:ring-[#00A854]" 
                          />
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
