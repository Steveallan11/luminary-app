import { Avatar } from '@/types';

export interface ChildSession {
  childId: string;
  childName: string;
  avatar: Avatar;
  yearGroup: string;
  familyId: string;
  loginAt: string;
}

const STORAGE_KEY = 'luminary_child_session';

export function getChildSession(): ChildSession | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const session = JSON.parse(stored) as ChildSession;
    return session;
  } catch {
    return null;
  }
}

export function setChildSession(session: ChildSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearChildSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function isChildLoggedIn(): boolean {
  return getChildSession() !== null;
}
