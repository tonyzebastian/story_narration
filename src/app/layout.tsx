import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'Story Narration App',
  description: 'Create stories with GPT and narrate with ElevenLabs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto p-6">{children}</div>
      </body>
    </html>
  );
}


