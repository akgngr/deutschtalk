
"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import type { LoginFormData } from '@/lib/validators';
import { LoginSchema } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { signInWithEmail, handleGoogleUser } from '@/app/actions/auth'; // Updated import
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { auth, googleProvider } from '@/lib/firebase'; // Import auth and googleProvider for client-side Google Sign-In
import { signInWithPopup, type UserCredential } from 'firebase/auth'; // Import signInWithPopup

// Simple SVG for Google icon
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);


export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth(); // useAuth will be updated by FirebaseAuthProvider on successful sign-in
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (loginSuccess && user) { // user comes from useAuth() context
      router.push('/dashboard');
    }
  }, [loginSuccess, user, router]);

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);
    setLoginSuccess(false);
    const result = await signInWithEmail(data);
    setIsLoading(false);
    if (result.success) {
      toast({ title: "Login Successful", description: "Welcome back!" });
      setLoginSuccess(true); // This will trigger useEffect when user context updates
    } else {
      toast({ title: "Login Failed", description: result.error || "An unknown error occurred.", variant: "destructive" });
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    setLoginSuccess(false);
    try {
      const result: UserCredential = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // Call the server action to ensure profile exists and get it (which might trigger context update)
      const profileResult = await handleGoogleUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      });

      setIsGoogleLoading(false);
      if (profileResult.success) {
        toast({ title: "Google Sign-In Successful", description: "Welcome!" });
        // loginSuccess will be set to true. The useEffect will wait for `user` from AuthProvider.
        setLoginSuccess(true); 
      } else {
        toast({ title: "Google Sign-In Failed", description: profileResult.error || "Could not complete Google Sign-In.", variant: "destructive" });
      }
    } catch (error: any) {
      setIsGoogleLoading(false);
      let errorMessage = "Could not sign in with Google.";
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in popup closed. Please try again.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = "Sign-in popup request cancelled. Please try again.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Sign-in popup was blocked by the browser. Please allow popups for this site.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "An account already exists with this email using a different sign-in method.";
      }
      toast({ title: "Google Sign-In Failed", description: error.message || errorMessage, variant: "destructive" });
    }
  }

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Welcome Back!</CardTitle>
        <CardDescription>Log in to your DeutschTalk account.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="••••••••" {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log In
            </Button>
          </form>
        </Form>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
          {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
          <span className="ml-2">Log in with Google</span>
        </Button>
      </CardContent>
      <CardFooter className="flex-col items-center space-y-2">
         <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Button variant="link" asChild className="p-0 h-auto">
            <Link href="/register">Sign up</Link>
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}
