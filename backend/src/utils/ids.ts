import { ulid } from 'ulid';

export const createId = () => ulid();

export const createTodoId = () => Number(`${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`);
