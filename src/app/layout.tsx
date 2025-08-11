import './globals.css';
import type { Metadata } from 'next';

const appName = 'ScriptFlow - AI Story Creation & Voice Narration';
const appShortName = 'ScriptFlow';
const appDescription = 'Create and edit stories with AI assistance, then bring them to life with professional voice narration using OpenAI GPT and ElevenLabs text-to-speech.';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://scriptflow.vercel.app';

export const metadata: Metadata = {
  title: {
    default: appName,
    template: `%s | ${appShortName}`,
  },
  description: appDescription,
  keywords: [
    'story creation',
    'AI writing',
    'text to speech',
    'narration',
    'OpenAI',
    'ElevenLabs',
    'voice synthesis',
    'creative writing',
    'storytelling',
    'AI assistant'
  ],
  authors: [{ name: 'ScriptFlow' }],
  creator: 'ScriptFlow',
  publisher: 'ScriptFlow',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(appUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: appUrl,
    title: appName,
    description: appDescription,
    siteName: appShortName,
    images: [
      {
        url: `${appUrl}/opengraph-image.png`,
        width: 1200,
        height: 630,
        alt: 'ScriptFlow - AI-powered story creation and voice narration',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: appName,
    description: appDescription,
    creator: '@scriptflow',
    images: {
      url: `${appUrl}/twitter-image.png`,
      alt: 'ScriptFlow - AI-powered story creation and voice narration',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">
        {children}
      </body>
    </html>
  );
}


