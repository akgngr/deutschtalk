
import { Languages } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
       <Link href="/" className="absolute top-8 left-8 flex items-center space-x-2 text-primary hover:opacity-80 transition-opacity">
          <Languages className="h-7 w-7" />
          <span className="font-headline text-2xl font-bold">DeutschTalk</span>
        </Link>
      <div className="w-full max-w-md">
        {children}
      </div>
       <footer className="absolute bottom-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} DeutschTalk. Practice German with AI.</p>
      </footer>
    </div>
  );
}
