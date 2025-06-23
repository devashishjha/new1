'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { BottomNavBar } from '@/components/bottom-nav-bar';
import { ChatListItem } from '@/components/chat-list-item';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { ChatConversation } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { dateToJSON } from '@/lib/utils';

export default function ChatsPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
        collection(db, "chats"), 
        where("participantIds", "array-contains", user.uid),
        orderBy("lastMessage.timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const convos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatConversation[];

      const serializableConvos = convos.map(convo => dateToJSON(convo)) as ChatConversation[];
      setConversations(serializableConvos);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching conversations:", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <>
      <Header />
      <main className="container mx-auto py-24 px-4 pb-24">
        <h1 className="text-4xl font-bold tracking-tight mb-2">My Chats</h1>
        <p className="text-muted-foreground mb-8">Your recent conversations.</p>
        
        {isLoading ? (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : conversations.length > 0 ? (
            <Card>
                <CardContent className="p-0">
                    <div className="space-y-0">
                    {conversations.map((convo, index) => (
                        <Link href={`/chats/${convo.id}`} key={convo.id}>
                            <ChatListItem conversation={convo} isLast={index === conversations.length - 1} />
                        </Link>
                    ))}
                    </div>
                </CardContent>
            </Card>
        ) : (
            <div className="text-center py-20 border border-dashed rounded-lg mt-10">
                <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h2 className="text-xl font-semibold text-white mt-4">No Chats Yet</h2>
                <p className="text-muted-foreground mt-2">Start a conversation from a property reel or user profile.</p>
            </div>
        )}

      </main>
      <BottomNavBar />
    </>
  );
}
