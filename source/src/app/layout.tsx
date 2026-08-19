// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DUCK STUDIO OS — RnF · Ritmo & Frequência',
  description:
    'Sistema operacional de estúdio musical: CRM, projetos, mastering, plugins, portal do cliente e assistente IA com contexto operacional.',
  keywords: ['DUCK', 'Studio OS', 'mastering', 'RnF', 'produção musical', 'CRM estúdio'],
  authors: [{ name: 'Duck RnF' }],
  icons: { icon: 'https://z-cdn.chatglm.cn/z-ai/static/logo.svg' },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}
