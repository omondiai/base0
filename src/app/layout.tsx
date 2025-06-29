import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';

export const metadata: Metadata = {
  title: 'Omondi AI',
  description: 'Next generation AI for your graphic design projects.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3e%3cdefs%3e%3clinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3e%3cstop offset='0%25' stop-color='hsl(180, 100%25, 45%25)' /%3e%3cstop offset='100%25' stop-color='hsl(285, 100%25, 50%25)' /%3e%3c/linearGradient%3e%3c/defs%3e%3ccircle cx='16' cy='16' r='14' fill='url(%23g)' /%3e%3ccircle cx='16' cy='16' r='8' fill='hsl(0, 0%25, 88%25)' /%3e%3c/svg%3e" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
