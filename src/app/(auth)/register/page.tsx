
import { RegisterForm } from '@/components/auth/register-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up - DeutschTalk',
  description: 'Create an account on DeutschTalk.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
