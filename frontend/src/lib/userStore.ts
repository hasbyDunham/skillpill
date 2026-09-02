import { UserProfile } from '../types';

export interface UserAccount extends UserProfile {
  password?: string;
  phone?: string;
}

const STORAGE_USERS_KEY = 'skillpill_registered_users_v2';
const STORAGE_CURRENT_USER_KEY = 'skillpill_current_user_id';

const LEGACY_DUMMY_EMAILS = new Set(['alex@skillpill.id', 'rian@gmail.com']);

export function getUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const users = parsed.filter(
          (user: UserAccount) => user.role === 'user' && !LEGACY_DUMMY_EMAILS.has(user.email.toLowerCase()),
        );
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
        return users;
      }
    }
  } catch (e) {
    console.error('Failed to load users from localStorage:', e);
  }
  return [];
}

export function saveUsers(users: UserAccount[]) {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users to localStorage:', e);
  }
}

export function getCurrentUser(): UserAccount | null {
  const users = getUsers();
  const currentId = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
  if (currentId) {
    const found = users.find(u => u.id === currentId || u.email.toLowerCase() === currentId.toLowerCase());
    if (found?.role === 'user') return found;
    localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
  }
  return null;
}

export function setCurrentUser(user: UserAccount) {
  if (user.role !== 'user') return;
  try {
    localStorage.setItem(STORAGE_CURRENT_USER_KEY, user.id);
  } catch (e) {}
  const users = getUsers();
  const index = users.findIndex(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
  if (index >= 0) {
    users[index] = { ...users[index], ...user };
  } else {
    users.push(user);
  }
  saveUsers(users);
}

export function logoutUser() {
  try {
    localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
  } catch (e) {}
}
