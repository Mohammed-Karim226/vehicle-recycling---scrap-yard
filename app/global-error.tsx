"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans antialiased px-4">
        <Card className="max-w-md w-full bg-slate-900/80 text-center">
          <CardContent className="space-y-5 p-8">
          <h1 className="text-2xl font-black uppercase tracking-tight">Critical Error</h1>
          <p className="text-slate-400 text-sm">
            The application encountered a critical failure. Please reload the page.
          </p>
          <Button
            onClick={reset}
            className="bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold uppercase px-5 py-2.5 rounded-xl cursor-pointer"
          >
            Reload application
          </Button>
          </CardContent>
        </Card>
      </body>
    </html>
  );
}
