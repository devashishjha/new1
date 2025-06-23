import { AuthForm } from '@/components/auth-form';
import { isFirebaseEnabled } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

function FirebaseWarning() {
    return (
        <Card className="w-full max-w-md shadow-2xl bg-black/20 backdrop-blur-lg border border-destructive/50">
            <CardHeader>
                <div className="mx-auto bg-destructive/20 text-destructive p-3 rounded-full w-fit">
                    <AlertTriangle className="h-8 w-8" />
                </div>
                <CardTitle className="mt-4 text-center">Action Required: Configure Firebase</CardTitle>
                <CardDescription className="text-center">
                    Your application is running in offline mode. To enable user sign-in and all other features, you must add your Firebase project credentials to the `.env` file.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground bg-black/30 p-4 rounded-md font-mono space-y-2">
                <p>1. Open the file named <span className="text-primary font-semibold">.env</span> in the file explorer.</p>
                <p>2. Fill in the placeholder values with the keys from your Firebase project settings.</p>
                <p>3. Restart the development server.</p>
            </CardContent>
        </Card>
    )
}


export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-black to-blue-950">
      {isFirebaseEnabled ? <AuthForm /> : <FirebaseWarning />}
    </main>
  );
}
