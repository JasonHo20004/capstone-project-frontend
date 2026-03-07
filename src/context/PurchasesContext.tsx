import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Course as AdminCourse } from "@/domain";
import { toast } from 'sonner';
import { courseServiceUser } from "@/lib/api/services/user";

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
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(false);

  // Fetch enrolled courses from API when user is logged in
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    let cancelled = false;
    setIsLoading(true);

    courseServiceUser
      .getAllCourses({ enrollmentStatus: 'enrolled', limit: 100 })
      .then((res) => {
        if (cancelled || !res?.data) return;
        // Handle both { data: { data: [] } } and { data: [] } response shapes
        const raw = res.data as { data?: AdminCourse[] } | AdminCourse[];
        const courses: AdminCourse[] = Array.isArray(raw) ? raw : (raw.data ?? []);
        const mapped: PurchasedItem[] = courses.map((c) => ({
          id: c.id,
          course: c,
          purchasedAt: (c as { createdAt?: string }).createdAt ?? new Date().toISOString(),
        }));
        setItems(mapped);
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
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

  const value: PurchasesContextValue = { items, addCourse, addCourses, remove, clear, has, count, isLoading };

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
};

export const usePurchases = () => {
    const ctx = useContext(PurchasesContext);
    if (!ctx) throw new Error('usePurchases must be used within PurchasesProvider');
    return ctx;
};