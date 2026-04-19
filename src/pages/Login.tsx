import React, { useState } from 'react';
import { Button, Input, Card } from '@/components/ui';

export const Login = ({ onLogin, systemNotice = '' }: { onLogin: (account: string, password: string) => Promise<void>, systemNotice?: string }) => {
  const [account, setAccount] = useState('shirenyuan41@gmail.com');
  const [password, setPassword] = useState('123456');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await onLogin(account, password);
    } catch (error) {
      const message = error instanceof Error ? error.message : '登录失败，请稍后重试';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9F8] p-4 font-sans">
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <div className="w-8 h-8 bg-[#00A854] rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
        <span className="font-bold text-slate-900 text-xl tracking-tight">SUPEREV 用户研究中心</span>
      </div>

      <Card className="w-full max-w-md p-8 shadow-xl border-slate-100">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">欢迎回来</h2>
          <p className="text-slate-500 text-sm">请输入您的工作账号以继续</p>
        </div>

        {systemNotice && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {systemNotice}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">账号</label>
              <Input value={account} onChange={(event) => setAccount(event.target.value)} placeholder="请输入员工邮箱或工号" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">密码</label>
                <button type="button" className="text-sm text-[#00A854] hover:underline">忘记密码？</button>
              </div>
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="请输入密码" />
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-[#00A854] focus:ring-[#00A854]"
              defaultChecked
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
              记住登录状态
            </label>
          </div>

          <Button type="submit" className="w-full h-11 text-base" disabled={isSubmitting}>
            {isSubmitting ? '登录中...' : '登录'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
