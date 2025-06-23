'use client';

import { useAuth } from "@/hooks/use-auth";
import type { UserProfile, Property } from "@/lib/types";
import { Loader2, MessageCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useChatNavigation } from "@/hooks/use-chat-navigation";


export function ChatButton({ targetUser }: { targetUser: UserProfile | Property['lister'] }) {
    const { user, loading: authLoading } = useAuth();
    const { navigateToChat, isNavigating } = useChatNavigation();

    const handleChat = () => {
        navigateToChat(targetUser);
    }

    if (authLoading) {
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
        <Button size="lg" className="w-full" onClick={handleChat} disabled={isNavigating}>
            {isNavigating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <MessageCircle className="mr-2 h-5 w-5" />}
            {isNavigating ? 'Starting...' : `Chat with ${targetUser.name.split(' ')[0]}`}
        </Button>
    )
}
