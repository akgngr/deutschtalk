
export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t border-border/40 py-8">
      <div className="container flex flex-col items-center justify-center text-center text-sm text-muted-foreground">
        <p>&copy; {currentYear} DeutschTalk. All rights reserved.</p>
        <p>Practice German, connect with learners, and improve your fluency.</p>
      </div>
    </footer>
  );
}
