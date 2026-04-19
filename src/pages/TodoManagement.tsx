import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, Drawer } from '@/components/ui';
import { Plus, Upload, Search, Trash2, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { globalStore, TODO_DEPARTMENTS, TODO_STATUSES, TODO_TYPES } from '@/lib/store';

const initialAddFormData = {
  type: '产品方案',
  content: '',
  mentions: 1,
  dept: '产品部',
};

export const TodoManagement = () => {
  const [todos, setTodos] = useState(globalStore.todos);

  useEffect(() => {
    const unsubscribe = globalStore.subscribe(() => {
      setTodos([...globalStore.todos]);
    });
    return unsubscribe;
  }, []);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedTodo, setSelectedTodo] = useState<any>(null);
  const [todoToDelete, setTodoToDelete] = useState<number | null>(null);

  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isDeptOpen, setIsDeptOpen] = useState(false);

  // Form states for Add/Edit
  const [editFormData, setEditFormData] = useState<any>({});
  const [addFormData, setAddFormData] = useState({ ...initialAddFormData });

  const getAttention = (mentions: number) => {
    if (mentions >= 5) return '高';
    if (mentions >= 2) return '中';
    return '低';
  };

  const getAttentionColor = (att: string) => {
    if (att === '高') return 'bg-red-100 text-red-700';
    if (att === '中') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  };

  const getStatusColor = (status: string) => {
    if (status === '已完成') return 'text-green-600';
    if (status === '跟进中') return 'text-blue-600';
    if (status === '暂不采纳') return 'text-slate-400';
    return 'text-amber-600';
  };

  // Drawer
  const openTodo = (todo: any) => {
    setSelectedTodo(todo);
    setEditFormData({ ...todo });
    setIsDrawerOpen(true);
  };

  const handleUpdateTodo = async () => {
    await globalStore.updateTodo(editFormData.id, {
      ...editFormData,
      updatedAt: new Date().toISOString(),
    });
    setIsDrawerOpen(false);
  };

  // Add
  const handleAddSubmit = async () => {
    const now = new Date().toISOString();
    const newTodo = {
      ...addFormData,
      progressText: '新建立',
      status: '待跟进',
      sourceModule: 'Todo管理',
      createdAt: now,
      updatedAt: now,
    };
    await globalStore.addTodo(newTodo);
    setIsAddModalOpen(false);
    setAddFormData({ ...initialAddFormData });
  };

  // Delete
  const confirmDelete = (id: number) => {
    setTodoToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (todoToDelete !== null) {
      await globalStore.deleteTodo(todoToDelete);
    }
    setIsDeleteModalOpen(false);
    setTodoToDelete(null);
  };

  // Filters
  const [filterType, setFilterType] = useState('所有类型');
  const [filterStatus, setFilterStatus] = useState('状态: 全部');
  const [filterDept, setFilterDept] = useState('所有部门');
  const [searchQuery, setSearchQuery] = useState('');

  const [activeFilters, setActiveFilters] = useState({
    type: '所有类型',
    status: '状态: 全部',
    dept: '所有部门',
    query: ''
  });

  const handleApplyFilters = () => {
    setActiveFilters({
      type: filterType,
      status: filterStatus,
      dept: filterDept,
      query: searchQuery
    });
  };

  const filteredTodos = todos.filter(t => {
    if (activeFilters.type !== '所有类型' && t.type !== activeFilters.type) return false;
    if (activeFilters.dept !== '所有部门' && t.dept !== activeFilters.dept) return false;
    // Map status filter
    const statusMatch = activeFilters.status === '状态: 全部' || t.status === activeFilters.status;
    if (!statusMatch) return false;
    
    if (activeFilters.query && !t.content.includes(activeFilters.query)) return false;
    
    return true;
  });

  return (
    <div className="space-y-6 relative">
      {/* Top Actions & Filters */}
      <div className="flex justify-between items-end">
        <div className="flex gap-3">
          <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}><Plus className="w-4 h-4" /> 新增 Todo</Button>
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" /> 
            <span>批量导入ToDo <span className="text-[10px] text-slate-400 font-normal ml-0.5">(敬请期待V2)</span></span>
          </Button>
        </div>
        
        <div className="flex gap-3 items-end">
          <div className="relative group">
            <label className="block text-xs font-medium text-slate-500 mb-1">类型</label>
            <div className="w-32">
              <div 
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-sm flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-[#00A854] hover:border-[#00A854] transition-all"
                onClick={() => setIsTypeOpen(!isTypeOpen)}
              >
                <span className={filterType === '所有类型' ? 'text-slate-400' : 'text-slate-700 font-medium' + " truncate"}>{filterType}</span>
                <div className="flex items-center">
                  {filterType !== '所有类型' && (
                    <button 
                      className="p-1 opacity-0 group-hover:opacity-100 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-400 transition-all mr-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilterType('所有类型');
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform shrink-0", isTypeOpen ? "rotate-180" : "")} />
                </div>
              </div>
              {isTypeOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsTypeOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 py-1">
                    {['所有类型', ...TODO_TYPES].map((opt) => (
                      <div 
                        key={opt}
                        className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer text-slate-700"
                        onClick={() => { setFilterType(opt); setIsTypeOpen(false); }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="relative group">
            <label className="block text-xs font-medium text-slate-500 mb-1">关联部门</label>
            <div className="w-32">
              <div 
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-sm flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-[#00A854] hover:border-[#00A854] transition-all"
                onClick={() => setIsDeptOpen(!isDeptOpen)}
              >
                <span className={filterDept === '所有部门' ? 'text-slate-400' : 'text-slate-700 font-medium' + " truncate"}>{filterDept}</span>
                <div className="flex items-center">
                  {filterDept !== '所有部门' && (
                    <button 
                      className="p-1 opacity-0 group-hover:opacity-100 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-400 transition-all mr-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilterDept('所有部门');
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform shrink-0", isDeptOpen ? "rotate-180" : "")} />
                </div>
              </div>
              {isDeptOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsDeptOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 py-1">
                    {['所有部门', ...TODO_DEPARTMENTS].map((opt) => (
                      <div 
                        key={opt}
                        className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer text-slate-700"
                        onClick={() => { setFilterDept(opt); setIsDeptOpen(false); }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="relative group">
            <label className="block text-xs font-medium text-slate-500 mb-1">状态</label>
            <div className="w-32 relative group">
              <div 
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-sm flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-[#00A854] hover:border-[#00A854] transition-all"
                onClick={() => setIsStatusOpen(!isStatusOpen)}
              >
                <span className={filterStatus === '状态: 全部' ? 'text-slate-400' : 'text-slate-700 font-medium' + " truncate"}>{filterStatus}</span>
                <div className="flex items-center">
                  {filterStatus !== '状态: 全部' && (
                    <button 
                      className="p-1 opacity-0 group-hover:opacity-100 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-400 transition-all mr-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilterStatus('状态: 全部');
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform shrink-0", isStatusOpen ? "rotate-180" : "")} />
                </div>
              </div>
              {isStatusOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsStatusOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 py-1">
                    {['状态: 全部', ...TODO_STATUSES].map((opt) => (
                      <div 
                        key={opt}
                        className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer text-slate-700"
                        onClick={() => { setFilterStatus(opt); setIsStatusOpen(false); }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="relative w-32 pb-0.5">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input 
              className="pl-9 h-9" 
              placeholder="搜索ToDo" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="h-9 whitespace-nowrap" onClick={handleApplyFilters}>确认</Button>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden min-h-[400px]">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-6 py-3 font-medium">类型</th>
              <th className="px-6 py-3 font-medium w-1/4">Todo 内容</th>
              <th className="px-6 py-3 font-medium">关联部门</th>
              <th className="px-6 py-3 font-medium">提及人数</th>
              <th className="px-6 py-3 font-medium">用户关注度</th>
              <th className="px-6 py-3 font-medium w-1/5">当前进度说明</th>
              <th className="px-6 py-3 font-medium">状态</th>
              <th className="px-6 py-3 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTodos.map((todo) => {
              const attention = getAttention(todo.mentions);
              return (
                <tr key={todo.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4"><Badge variant="outline">{todo.type}</Badge></td>
                  <td className="px-6 py-4 font-medium text-slate-900">{todo.content}</td>
                  <td className="px-6 py-4 text-slate-600">{todo.dept}</td>
                  <td className="px-6 py-4 text-slate-600">{todo.mentions}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getAttentionColor(attention)}`}>
                      {attention}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-600 truncate" title={todo.progressText}>{todo.progressText}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${getStatusColor(todo.status)}`}>{todo.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openTodo(todo)}>详情</Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => confirmDelete(todo.id)}>删除</Button>
                  </td>
                </tr>
              )
            })}
            {filteredTodos.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-slate-400">暂无待办事项</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center">
          <Card className="w-[480px] p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 mb-6">新增 Todo 记录</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">建议类型</label>
                <select 
                  className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A854]"
                  value={addFormData.type}
                  onChange={e => setAddFormData({...addFormData, type: e.target.value})}
                >
                  {TODO_TYPES.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">关联部门</label>
                <select 
                  className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A854]"
                  value={addFormData.dept}
                  onChange={e => setAddFormData({...addFormData, dept: e.target.value})}
                >
                  {TODO_DEPARTMENTS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Todo 内容</label>
                <textarea 
                  className="w-full h-20 rounded-md border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A854] resize-none"
                  placeholder="输入建议详情..."
                  value={addFormData.content}
                  onChange={e => setAddFormData({...addFormData, content: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">提及人数 (根据访谈计算)</label>
                <Input 
                  type="number" 
                  min="1"
                  className="h-10"
                  value={addFormData.mentions}
                  onChange={e => setAddFormData({...addFormData, mentions: parseInt(e.target.value) || 1})}
                />
              </div>
              <div className="p-3 bg-slate-50 text-xs text-slate-500 rounded">
                系统将自动计算：关注度为 <span className="font-bold text-slate-700">{getAttention(addFormData.mentions)}</span> (≥5为高，2-4为中，1为低)
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>取消</Button>
              <Button onClick={handleAddSubmit} disabled={!addFormData.content.trim()}>确认新增</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center">
          <Card className="w-[400px] p-6 shadow-xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">确认删除记录？</h2>
            <p className="text-sm text-slate-500 mb-6">此操作将从此列表中永久移除该建议，移除后不可恢复。</p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" className="w-24" onClick={() => setIsDeleteModalOpen(false)}>取消</Button>
              <Button variant="danger" className="w-24" onClick={handleDelete}>确认</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Detail Drawer */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Todo 详情" width="w-[480px]">
        {selectedTodo && (
          <div className="space-y-6">
            <div>
              <Badge variant="outline" className="mb-3">{editFormData.type}</Badge>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">{editFormData.content}</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">提及人数</div>
                <Input
                  type="number"
                  min="1"
                  className="mt-2 h-10 bg-white"
                  value={editFormData.mentions ?? 1}
                  onChange={(e) => setEditFormData({
                    ...editFormData,
                    mentions: Math.max(1, Number(e.target.value) || 1),
                  })}
                />
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">用户关注度 (自动计算)</div>
                <div className={`text-lg font-semibold ${getAttention(Number(editFormData.mentions) || 1) === '高' ? 'text-red-600' : 'text-slate-900'}`}>
                  {getAttention(Number(editFormData.mentions) || 1)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                 <h4 className="text-sm font-medium text-slate-900 mb-2">当前状态</h4>
                 <select 
                  className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A854]" 
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                 >
                   {TODO_STATUSES.map((option) => (
                     <option key={option} value={option}>{option}</option>
                   ))}
                 </select>
              </div>
              <div>
                 <h4 className="text-sm font-medium text-slate-900 mb-2">关联部门</h4>
                 <select 
                  className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A854]" 
                  value={editFormData.dept}
                  onChange={(e) => setEditFormData({...editFormData, dept: e.target.value})}
                 >
                  {TODO_DEPARTMENTS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                 </select>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-2">进度情况说明</h4>
              <textarea 
                className="w-full h-24 rounded-md border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A854] resize-none"
                placeholder="手动更新当前的开发/跟进进度详情..."
                value={editFormData.progressText}
                onChange={(e) => setEditFormData({...editFormData, progressText: e.target.value})}
              />
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-2">关联来源</h4>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                <div>{editFormData.sourceModule || 'Todo管理'} 创建</div>
                <div className="mt-1 text-xs text-slate-500">
                  {[editFormData.sourceDocumentName, editFormData.sourceBusinessLine].filter(Boolean).join(' · ') || '无关联文档信息'}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <Button className="w-full" onClick={handleUpdateTodo}>保存更新</Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
