
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, getAdditionalUserInfo, sendPasswordResetEmail, type User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import type { SeekerProfile } from '@/lib/types';
import { Loader2 } from 'lucide-react';


const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,34.556,44,29.865,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);

export function AuthForm() {
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const createNewUserProfile = async (user: User) => {
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);

        if (!docSnap.exists()) {
            const newUserProfile: SeekerProfile = {
                id: user.uid,
                name: user.displayName || user.email?.split('@')[0] || 'New User',
                email: user.email!,
                phone: user.phoneNumber || '',
                bio: 'Welcome to LOKALITY!',
                type: 'seeker',
                searchCriteria: 'I am looking for a new property.',
                avatar: user.photoURL || `https://placehold.co/100x100.png`
            };
            await setDoc(userDocRef, newUserProfile);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const userCredential = await signInWithPopup(auth, provider);
            const additionalUserInfo = getAdditionalUserInfo(userCredential);
            if (additionalUserInfo?.isNewUser) {
                await createNewUserProfile(userCredential.user);
                toast({ title: 'Welcome!', description: 'Your account has been created.' });
            }
            // Redirection is handled by AuthProvider
        } catch (error: any) {
            console.error("Google Sign-In Error Code:", error.code);
            console.error("Google Sign-In Error Message:", error.message);
            let description = `An unknown error occurred. (Code: ${error.code})`;
             if (error.code === 'auth/popup-closed-by-user') {
                description = "The sign-in window was closed. Please try again.";
            } else if (error.code === 'auth/unauthorized-domain') {
                description = "This app's domain is not authorized for Google Sign-In. Please add it to the 'Authorized domains' list in your Firebase project's Authentication settings.";
            } else if (error.code === 'auth/operation-not-allowed') {
                description = "Google Sign-In is not enabled for this project. Please go to your Firebase Console -> Authentication -> Sign-in method and enable the Google provider.";
            }
            toast({
                variant: 'destructive',
                title: 'Authentication Failed',
                description: description,
                duration: 9000,
            });
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                // Redirection handled by AuthProvider
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await createNewUserProfile(userCredential.user);
                toast({ title: 'Welcome!', description: 'Your account has been created.' });
                // Redirection handled by AuthProvider
            }
        } catch (error: any) {
            let description = "An unexpected error occurred. Please try again.";
            switch (error.code) {
                case 'auth/invalid-email':
                    description = "Please enter a valid email address.";
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    description = "Invalid email or password. Please check your credentials and try again.";
                    break;
                case 'auth/email-already-in-use':
                    description = "An account with this email already exists. Please sign in or use a different email.";
                    break;
                case 'auth/weak-password':
                    description = "Your password is too weak. Please choose a stronger password (at least 6 characters).";
                    break;
            }
             toast({
                variant: 'destructive',
                title: isLogin ? 'Sign In Failed' : 'Sign Up Failed',
                description: description,
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handlePasswordReset = async () => {
        if (!email) {
            toast({
                variant: 'destructive',
                title: 'Email Required',
                description: 'Please enter your email address to reset your password.',
            });
            return;
        }
        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            toast({
                title: 'Password Reset Email Sent',
                description: 'Check your inbox for instructions to reset your password.',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Reset Failed',
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <Card className="w-full max-w-sm shadow-2xl bg-black/20 backdrop-blur-lg border border-white/20">
            <CardHeader className="text-center space-y-2">
                <h1 className="text-4xl font-black text-white tracking-tighter mx-auto">LOKALITY</h1>
            </CardHeader>
            <CardContent className="grid gap-4">
                <Button variant="outline" size="lg" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
                    {isGoogleLoading ? <Loader2 className="mr-2 animate-spin" /> : <GoogleIcon className="mr-2" />}
                    {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
                </Button>
                
                <div className="flex items-center gap-4 my-1">
                    <div className="flex-grow border-t border-white/30" />
                    <span className="text-xs uppercase text-white/70">or</span>
                    <div className="flex-grow border-t border-white/30" />
                </div>

                <form onSubmit={handleEmailAuth} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="text-white">Email</Label>
                        <Input id="email" type="email" placeholder="Enter your email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading || isGoogleLoading} className="bg-white/10 border-white/20 text-white placeholder:text-white/60" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password" className="text-white">Password</Label>
                        <Input id="password" type="password" placeholder="Enter your password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading || isGoogleLoading} className="bg-white/10 border-white/20 text-white placeholder:text-white/60" />
                    </div>
                    
                    {isLogin && (
                        <div className="text-right -mt-2">
                            <button
                                type="button"
                                onClick={handlePasswordReset}
                                className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
                                disabled={isLoading || isGoogleLoading || !email}
                            >
                                Forgot Password?
                            </button>
                        </div>
                    )}

                    <Button size="lg" className="w-full" type="submit" disabled={isLoading || isGoogleLoading}>
                        {isLoading && <Loader2 className="mr-2 animate-spin" />}
                        {isLoading ? (isLogin ? 'Signing In...' : 'Signing Up...') : (isLogin ? 'Sign In' : 'Sign Up')}
                    </Button>
                </form>
                
                <div className="text-center text-sm pt-2">
                    <p className="text-white/70">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                        <button onClick={() => setIsLogin(!isLogin)} className="underline hover:text-primary font-semibold">
                            {isLogin ? "Sign Up" : "Sign In"}
                        </button>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
