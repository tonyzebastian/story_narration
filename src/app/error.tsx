'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body>
        <main className="max-w-2xl mx-auto p-6 text-center space-y-3">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-gray-600">{error?.message || 'Unexpected error'}</p>
          <button className="border rounded px-3 py-1 text-sm" onClick={() => reset()}>Try again</button>
        </main>
      </body>
    </html>
  );
}


