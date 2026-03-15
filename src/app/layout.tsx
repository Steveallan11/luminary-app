import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Luminary — Learning That Lights Up Every Child',
  description: 'AI-powered homeschooling platform for UK children aged 5-16. Personalised learning with Lumi, your child\'s AI tutor.',
  keywords: ['homeschooling', 'UK', 'education', 'AI tutor', 'children', 'learning'],
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
