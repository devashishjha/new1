import { AuthForm } from '@/components/auth-form';
import { isFirebaseEnabled } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

function FirebaseWarning() {
    const requiredSecrets = [
        "GOOGLE_API_KEY",
        "NEXT_PUBLIC_FIREBASE_API_KEY",
        "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
        "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
        "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
        "NEXT_PUBLIC_FIREBASE_APP_ID",
    ];

    return (
        <Card className="w-full max-w-2xl shadow-2xl bg-black/20 backdrop-blur-lg border border-destructive/50">
            <CardHeader>
                <div className="mx-auto bg-destructive/20 text-destructive p-3 rounded-full w-fit">
                    <AlertTriangle className="h-8 w-8" />
                </div>
                <CardTitle className="mt-4 text-center">Action Required: Configure Firebase</CardTitle>
                <CardDescription className="text-center">
                    The application is running in offline mode because it's missing its environment variables.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
                <div className="bg-black/30 p-4 rounded-md font-mono space-y-2">
                    <p><span className="text-primary font-semibold">For Local Development:</span></p>
                    <p>Ensure your <span className="text-primary font-semibold">.env</span> file is correctly filled with your Firebase project's web app configuration.</p>
                </div>
                 <div className="bg-black/30 p-4 rounded-md font-mono space-y-2">
                    <p><span className="text-primary font-semibold">For Production:</span></p>
                    <p>This live version of the app is missing one or more required secrets. Please go to Google Secret Manager and ensure the following secrets exist with the correct values:</p>
                    <ul className="list-disc pl-5 pt-2 text-xs text-white/80 space-y-1">
                        {requiredSecrets.map(secret => <li key={secret}>{secret}</li>)}
                    </ul>
                     <p className="pt-2">After adding/correcting the secrets, you must <span className="text-primary font-semibold">re-deploy</span> the application.</p>
                </div>
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
