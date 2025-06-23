'use client';

import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import type { UserProfile, Property } from "@/lib/types";
import { addDoc, collection, getDocs, query, where, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { Loader2, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

export function ChatButton({ targetUser }: { targetUser: UserProfile | Property['lister'] }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const handleChat = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: "Not Logged In", description: "You need to be logged in to start a chat." });
            return;
        }

        if (user.uid === targetUser.id) {
             toast({ variant: 'destructive', title: "Cannot Chat", description: "You cannot start a chat with yourself." });
            return;
        }

        try {
            // Check if a chat already exists
            const chatsRef = collection(db, 'chats');
            const q = query(chatsRef, 
                where('participantIds', 'array-contains', user.uid)
            );
            const querySnapshot = await getDocs(q);
            
            let existingChatId: string | null = null;
            querySnapshot.forEach(doc => {
                const chat = doc.data();
                if (chat.participantIds.includes(targetUser.id)) {
                    existingChatId = doc.id;
                }
            });

            if (existingChatId) {
                router.push(`/chats/${existingChatId}`);
            } else {
                // Fetch current user's profile to get their name for the chat document
                const currentUserDocSnap = await getDoc(doc(db, 'users', user.uid));
                if (!currentUserDocSnap.exists()) {
                    throw new Error("Could not find current user's profile.");
                }
                const currentUserProfile = currentUserDocSnap.data() as UserProfile;

                // Create a new chat
                const newChatRef = await addDoc(chatsRef, {
                    participantIds: [user.uid, targetUser.id],
                    participants: {
                        [user.uid]: {
                            name: currentUserProfile.name,
                            avatar: currentUserProfile.avatar || 'https://placehold.co/100x100.png'
                        },
                        [targetUser.id]: {
                            name: targetUser.name,
                            avatar: targetUser.avatar || 'https://placehold.co/100x100.png'
                        }
                    },
                    messages: [],
                    lastMessage: {
                        text: 'Chat started.',
                        timestamp: serverTimestamp(),
                        senderId: user.uid,
                    },
                    unreadCount: 0,
                });
                router.push(`/chats/${newChatRef.id}`);
            }
        } catch (error) {
            console.error("Error starting chat:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not start the chat. Please try again." });
        }
    };

    if (loading) {
        return (
             <Button size="lg" className="w-full" disabled>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading Chat...
            </Button>
        );
    }
    
    // Don't show the button if the user is viewing their own profile or is not logged in.
    if (!user || user.uid === targetUser.id) {
        return null;
    }

    return (
        <Button size="lg" className="w-full" onClick={handleChat}>
            <MessageCircle className="mr-2 h-5 w-5" />
            Chat with {targetUser.name.split(' ')[0]}
        </Button>
    )
}
