'use client';

import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import type { UserProfile, Property } from "@/lib/types";
import { addDoc, collection, getDocs, query, where, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function useChatNavigation() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isNavigating, setIsNavigating] = useState(false);

    const navigateToChat = async (targetUser: UserProfile | Property['lister']) => {
        if (!user) {
            toast({ variant: 'destructive', title: "Not Logged In", description: "You need to be logged in to start a chat." });
            return;
        }

        if (user.uid === targetUser.id) {
             toast({ variant: 'destructive', title: "Cannot Chat", description: "You cannot start a chat with yourself." });
            return;
        }

        setIsNavigating(true);

        try {
            const chatsRef = collection(db, 'chats');
            const q = query(chatsRef, where('participantIds', 'array-contains', user.uid));
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
                const currentUserDocSnap = await getDoc(doc(db, 'users', user.uid));
                if (!currentUserDocSnap.exists()) {
                    throw new Error("Could not find current user's profile.");
                }
                const currentUserProfile = currentUserDocSnap.data() as UserProfile;

                const newChatRef = await addDoc(chatsRef, {
                    participantIds: [user.uid, targetUser.id],
                    participants: {
                        [user.uid]: {
                            name: currentUserProfile.name,
                            avatar: currentUserProfile.avatar || `https://placehold.co/100x100.png`
                        },
                        [targetUser.id]: {
                            name: targetUser.name,
                            avatar: targetUser.avatar || `https://placehold.co/100x100.png`
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
        } finally {
            setIsNavigating(false);
        }
    };

    return { navigateToChat, isNavigating };
}
