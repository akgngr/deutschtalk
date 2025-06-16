
import { LoginForm } from '@/components/auth/login-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - DeutschTalk',
  description: 'Log in to your DeutschTalk account.',
};

export default function LoginPage() {
  return <LoginForm />;
}
