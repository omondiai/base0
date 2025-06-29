import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';

const faviconUrl = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3e%3cdefs%3e%3clinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3e%3cstop offset='0%25' stop-color='hsl(180, 100%25, 45%25)'/%3e%3cstop offset='100%25' stop-color='hsl(285, 100%25, 50%25)'/%3e%3c/linearGradient%3e%3c/defs%3e%3crect width='32' height='32' rx='8' fill='url(%23g)'/%3e%3cpath d='M16 7C10.4772 7 6 11.4772 6 17C6 22.5228 10.4772 27 16 27C21.5228 27 26 22.5228 26 17C26 13.5 24.25 10.4375 21.625 8.375' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3e%3cpath d='M21 7L20 11L24 12' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e";

export const metadata: Metadata = {
  title: 'Omondi AI',
  description: 'Next generation AI for your graphic design projects.',
  icons: {
    icon: faviconUrl,
    shortcut: faviconUrl,
    apple: faviconUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
