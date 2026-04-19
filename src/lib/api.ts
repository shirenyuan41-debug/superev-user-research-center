type RequestOptions = RequestInit & {
  searchParams?: Record<string, string | number | undefined | null>;
};

export class ApiError extends Error {
  status: number;

  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const buildUrl = (path: string, searchParams?: RequestOptions['searchParams']) => {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);

  Object.entries(searchParams || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    url.searchParams.set(key, String(value));
  });

  return url.toString();
};

const request = async <T>(path: string, options: RequestOptions = {}) => {
  const headers = new Headers(options.headers || {});
  const isFormData = options.body instanceof FormData;

  if (!isFormData && !headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(buildUrl(path, options.searchParams), {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'message' in payload
      ? String((payload as { message?: string }).message || '请求失败')
      : typeof payload === 'string' && payload.trim()
        ? payload
        : '请求失败';

    throw new ApiError(response.status, message, payload);
  }

  return payload as T;
};

export const api = {
  auth: {
    login: (payload: { account: string; password: string }) => request<{ user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    me: () => request<{ user: any }>('/api/auth/me'),
    logout: () => request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),
  },
  documents: {
    list: (searchParams?: Record<string, string | number | undefined | null>) => request<{ items: any[] }>('/api/documents', { searchParams }),
    get: (id: string) => request<{ item: any }>(`/api/documents/${id}`),
    upload: (payload: { file: File; businessLine: string; promptModule?: string; subject?: string }) => {
      const formData = new FormData();
      formData.append('file', payload.file);
      formData.append('businessLine', payload.businessLine);
      if (payload.promptModule) {
        formData.append('promptModule', payload.promptModule);
      }
      if (payload.subject) {
        formData.append('subject', payload.subject);
      }

      return request<{ item: any }>('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
    },
    update: (id: string, payload: Record<string, unknown>) => request<{ item: any }>(`/api/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
    delete: (id: string) => request<{ success: boolean }>(`/api/documents/${id}`, { method: 'DELETE' }),
    analyze: (id: string) => request<{ item: any }>(`/api/documents/${id}/analyze`, { method: 'POST' }),
  },
  todos: {
    list: () => request<{ items: any[] }>('/api/todos'),
    create: (payload: Record<string, unknown>) => request<{ item: any }>('/api/todos', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    update: (id: number, payload: Record<string, unknown>) => request<{ item: any }>(`/api/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
    delete: (id: number) => request<{ success: boolean }>(`/api/todos/${id}`, { method: 'DELETE' }),
  },
  feedbacks: {
    list: () => request<{ items: any[] }>('/api/feedbacks'),
    create: (payload: Record<string, unknown>) => request<{ item: any }>('/api/feedbacks', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    update: (id: string, payload: Record<string, unknown>) => request<{ item: any }>(`/api/feedbacks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  },
  promptModules: {
    list: () => request<{ items: any[] }>('/api/prompt-modules'),
    listVersions: (code: string) => request<{ items: any[] }>(`/api/prompt-modules/${encodeURIComponent(code)}/versions`),
    createVersion: (code: string, payload: { content: string; status?: '草稿' | '已发布' | '已归档' }) => request<{ item: any }>(`/api/prompt-modules/${encodeURIComponent(code)}/versions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  },
  promptVersions: {
    update: (recordId: string, payload: { content: string }) => request<{ item: any }>(`/api/prompt-versions/${recordId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
    publish: (recordId: string) => request<{ item: any }>(`/api/prompt-versions/${recordId}/publish`, {
      method: 'POST',
    }),
  },
};
