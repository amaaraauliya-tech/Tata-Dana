import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/theme-context';
import { AuthProvider } from '@/context/auth-context';

export const metadata: Metadata = {
  title: 'TataDana — Catat Keuangan Semudah Chat dari Telegram Kamu',
  description: 'Aplikasi manajemen keuangan pribadi yang terintegrasi dengan Telegram Bot. User bisa mencatat pemasukan & pengeluaran langsung dari chat Telegram dengan bahasa natural atau foto struk.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-orange-500 selection:text-white">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
