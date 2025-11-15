import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Course as AdminCourse } from '@/types/type';
import { toast } from 'sonner';
import { mockUserActivities, mockCourses } from '@/data/mock';

export type PurchasedItem = {
  id: string;
  course: AdminCourse;
  purchasedAt: string; // ISO string
};

type PurchasesContextValue = {
  items: PurchasedItem[];
  addCourse: (course: AdminCourse) => void;
  addCourses: (courses: AdminCourse[]) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  count: number;
};

const PurchasesContext = createContext<PurchasesContextValue | undefined>(undefined);

const STORAGE_KEY = 'skillboost_purchases_v1';

export const PurchasesProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [items, setItems] = useState<PurchasedItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PurchasedItem[]) : [];
    } catch {
      return [];
    }
  });

  // Seed purchases from UserActivity for current user
  useEffect(() => {
    try {
      const currentUserId = localStorage.getItem('currentUserId') || '1';
      const now = new Date();
      const purchasedCourseIds = mockUserActivities
        .filter((a) => a.userId === currentUserId && a.transaction?.status === 'SUCCESS' && (!a.expiresAt || new Date(a.expiresAt) > now))
        .map((a) => a.courseId);

      if (purchasedCourseIds.length === 0) return;

      const purchasedCourses = mockCourses.filter((c) => purchasedCourseIds.includes(c.id));

      setItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.id));
        const toAdd = purchasedCourses
          .filter((c) => !existingIds.has(c.id))
          .map((c) => ({ id: c.id, course: c, purchasedAt: new Date().toISOString() } as PurchasedItem));
        return toAdd.length > 0 ? [...toAdd, ...prev] : prev;
      });
    } catch {
      // ignore errors in seeding
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const has = (id: string) => items.some((i) => i.id === id);

  const addCourse = (course: AdminCourse) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === course.id)) {
        toast.info('Khoá học đã có trong thư viện của bạn');
        return prev;
      }
      const next: PurchasedItem = {
        id: course.id,
        course,
        purchasedAt: new Date().toISOString(),
      };
      toast.success('Đã thêm vào khoá học đã mua');
      return [next, ...prev];
    });
  };

  const addCourses = (courses: AdminCourse[]) => {
    if (!courses || courses.length === 0) return;
    setItems((prev) => {
      const now = new Date().toISOString();
      const existingIds = new Set(prev.map((i) => i.id));
      const toAdd = courses
        .filter((c) => c && !existingIds.has(c.id))
        .map((c) => ({ id: c.id, course: c, purchasedAt: now } as PurchasedItem));
      if (toAdd.length > 0) {
        toast.success(`Đã thêm ${toAdd.length} khoá học vào thư viện`);
        return [...toAdd, ...prev];
      }
      toast.info('Tất cả khoá học đã có trong thư viện');
      return prev;
    });
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clear = () => setItems([]);

  const count = items.length;

  const value: PurchasesContextValue = { items, addCourse, addCourses, remove, clear, has, count };

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
};

export const usePurchases = () => {
    const ctx = useContext(PurchasesContext);
    if (!ctx) throw new Error('usePurchases must be used within PurchasesProvider');
    return ctx;
};