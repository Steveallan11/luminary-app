import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Luminary — Learning That Lights Up Every Child',
    template: '%s | Luminary',
  },
  description:
    'AI-powered homeschooling platform for UK children aged 5-16. Personalised learning with Lumi, your child\'s AI tutor. Covers all 15 National Curriculum subjects.',
  keywords: [
    'homeschooling UK',
    'home education',
    'AI tutor',
    'children learning',
    'UK curriculum',
    'personalised education',
    'Lumi AI',
    'Key Stage 1',
    'Key Stage 2',
    'Key Stage 3',
    'GCSE preparation',
  ],
  authors: [{ name: 'Luminary Education' }],
  creator: 'Luminary Education',
  publisher: 'Luminary Education',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://luminary.education'),
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: '/',
    siteName: 'Luminary',
    title: 'Luminary — Learning That Lights Up Every Child',
    description:
      'AI-powered homeschooling for UK children aged 5-16. Personalised learning across 15 subjects with Lumi, your child\'s AI tutor.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luminary — Learning That Lights Up Every Child',
    description:
      'AI-powered homeschooling for UK children aged 5-16. Personalised learning with Lumi AI.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0e1a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,400&family=Nunito:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
