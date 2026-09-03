'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clearToken } from '../lib/api';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const token =
      typeof window !== 'undefined' ? sessionStorage.getItem('admin_token') : null;
    if (!token) {
      clearToken();
      router.replace('/login');
    } else {
      router.replace('/dashboard');
    }
  }, [router]);
  return null;
}