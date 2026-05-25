import { USERS } from "../data/users.js";

const STORAGE_KEY = "bodylog:selected-user";

export const getStoredUser = () => {
  const value = localStorage.getItem(STORAGE_KEY);
  return USERS.some((user) => user.id === value) ? value : "";
};

export const setStoredUser = (userId) => {
  if (!USERS.some((user) => user.id === userId)) return;
  localStorage.setItem(STORAGE_KEY, userId);
};

// PIN認証を追加するときは、このファイルに verifyUserPin(userId, pin) を足す想定です。
