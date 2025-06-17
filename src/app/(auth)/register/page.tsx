
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { RegisterForm } from '@/components/auth/register-form';
import type { Metadata } from 'next';
import { Loader2 } from 'lucide-react';

// export const metadata: Metadata = { // Metadata can't be dynamic in client components easily.
//   title: 'Sign Up - DeutschTalk',
//   description: 'Create an account on DeutschTalk.',
// };

export default function RegisterPage() {
  const { user, initialLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initialLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, initialLoading, router]);

  if (initialLoading || (!initialLoading && user)) {
    // Show loader while checking auth state or if user exists and redirect is pending
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If not initialLoading and no user, show the register form
  return <RegisterForm />;
}
