
"use client";

import { useRouter } from "next/navigation";
import { BrainCircuit, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast({ title: "Logged Out", description: "You have been successfully signed out." });
      router.push('/login');
      router.refresh();
    } catch (error) {
      toast({ variant: "destructive", title: "Logout Failed", description: "Could not log out. Please try again." });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center">
          <BrainCircuit className="h-6 w-6 mr-2 text-primary" />
          <h1 className="font-bold font-headline text-xl">Omondi AI</h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
