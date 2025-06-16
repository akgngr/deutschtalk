
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  const { user, initialLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initialLoading) {
      if (user) {
        router.replace('/dashboard');
      }
      // If not logged in, stay on landing page. Explicit navigation to /login is through buttons.
    }
  }, [user, initialLoading, router]);

  if (initialLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-lg text-foreground">Loading DeutschTalk...</p>
      </div>
    );
  }

  // If user is loaded and not null, they will be redirected by useEffect.
  // Otherwise, show landing page.
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Languages className="h-8 w-8 text-primary" />
            <span className="font-headline text-2xl font-bold text-primary">DeutschTalk</span>
          </Link>
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Sign Up</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        <section className="container mx-auto flex flex-col items-center px-4 py-16 text-center md:py-24">
          <div className="mb-8 flex items-center justify-center rounded-full bg-primary/10 p-4">
             <Languages className="h-16 w-16 text-primary" />
          </div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Master German with <span className="text-primary">DeutschTalk</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Connect with language partners, practice speaking, and get AI-powered feedback to boost your German fluency.
            Start your journey to confident German conversation today!
          </p>
          <div className="mt-10 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow">
              <Link href="/register">Get Started for Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="shadow-lg hover:shadow-xl transition-shadow">
              <Link href="/#features">Learn More</Link>
            </Button>
          </div>
        </section>

        <section id="features" className="bg-background py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="font-headline mb-12 text-center text-3xl font-bold text-foreground md:text-4xl">
              Why DeutschTalk?
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<MessageSquare className="h-10 w-10 text-primary" />}
                title="Real-time Chat Practice"
                description="Engage in live conversations with fellow learners and native speakers."
                dataAiHint="chat conversation"
              />
              <FeatureCard
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-primary"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>} // Placeholder for "AI" icon
                title="AI-Powered Feedback"
                description="Get instant grammar checks and suggestions to refine your German writing."
                dataAiHint="artificial intelligence"
              />
              <FeatureCard
                icon={<UserCircle className="h-10 w-10 text-primary" />}
                title="Personalized Matching"
                description="Find language partners based on your level and interests for effective practice."
                dataAiHint="people connection"
              />
            </div>
          </div>
        </section>
        
        <section className="py-16 md:py-24">
            <div className="container mx-auto px-4 text-center">
                 <h2 className="font-headline mb-8 text-3xl font-bold text-foreground md:text-4xl">Ready to Speak German Confidently?</h2>
                 <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow">
                    <Link href="/register">Join DeutschTalk Today</Link>
                 </Button>
            </div>
        </section>
      </main>

      <footer className="border-t border-border/40 py-8">
        <div className="container flex flex-col items-center justify-center text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} DeutschTalk. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  dataAiHint?: string;
}

function FeatureCard({ icon, title, description, dataAiHint }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border bg-card p-6 text-center shadow-sm transition-all hover:shadow-lg" data-ai-hint={dataAiHint}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        {icon}
      </div>
      <h3 className="font-headline mb-2 text-xl font-semibold text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

