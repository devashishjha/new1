'use client' // Error components must be Client Components

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <Card className="w-full max-w-lg text-center">
            <CardHeader>
                <div className="mx-auto bg-destructive/20 text-destructive p-3 rounded-full w-fit">
                    <AlertTriangle className="h-10 w-10" />
                </div>
                <CardTitle className="mt-4">Something went wrong!</CardTitle>
                <CardDescription>
                    We encountered an unexpected error. Please try again.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={() => reset()} size="lg">
                    Try again
                </Button>
                {process.env.NODE_ENV === 'development' && (
                    <pre className="mt-6 text-left text-xs bg-muted p-4 rounded-md overflow-auto text-destructive">
                        <code>{error.stack}</code>
                    </pre>
                )}
            </CardContent>
        </Card>
    </main>
  )
}
