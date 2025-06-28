"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const WELCOME_KEY = "omondi_ai_welcome_v1";

export function WelcomeDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // This effect runs only on the client
    const hasBeenWelcomed = localStorage.getItem(WELCOME_KEY);
    if (!hasBeenWelcomed) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(WELCOME_KEY, "true");
    setIsOpen(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-primary">
            Welcome, Paul Omondi!
          </DialogTitle>
          <DialogDescription className="text-base pt-2 text-foreground/80">
            This is Omondi AI, your personal graphic design powerhouse. Let's
            create something amazing and unlock new revenue streams together!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleClose}>Let's Get Started</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
