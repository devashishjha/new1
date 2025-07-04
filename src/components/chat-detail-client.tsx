
'use client';

import { useState, useEffect, useRef } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChatBubble } from '@/components/chat-bubble';
import { useAuth } from '@/hooks/use-auth';
import type { ChatConversation, UserProfile } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, serverTimestamp, getDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { PresenceDot } from './presence-dot';

export function ChatDetailClient() {
  const { user } = useAuth();
  const params = useParams();
  const chatId = params.id as string;
  const { toast } = useToast();
  
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!user || !chatId) return;

    if (!db) {
        console.error("Firestore not configured.");
        toast({
            variant: 'destructive',
            title: 'Chat Error',
            description: 'The database is not available. Please check your connection or configuration.',
            duration: 9000
        });
        setIsLoading(false);
        return;
    }

    const chatDocRef = doc(db, 'chats', chatId);
    const unsubscribe = onSnapshot(chatDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const convoData = { id: docSnap.id, ...docSnap.data() } as ChatConversation;
        
        // Ensure user is a participant
        if (!convoData.participantIds.includes(user.uid)) {
          setIsLoading(false);
          return notFound();
        }

        setConversation(convoData);

        // Fetch other user's full profile if not already fetched
        if (!otherUser) {
            const otherUserId = convoData.participantIds.find(id => id !== user.uid);
            if (otherUserId) {
                if (!db) return; // Guard clause for TypeScript
                const userDocRef = doc(db, 'users', otherUserId);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setOtherUser(userDocSnap.data() as UserProfile);
                }
            }
        }
        setIsLoading(false);

      } else {
        setIsLoading(false);
        notFound();
      }
    });

    return () => unsubscribe();
  }, [user, chatId, otherUser, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatId || isSending) return;

    if (!db) {
        toast({
            variant: 'destructive',
            title: "Send Error",
            description: "Cannot send message, database not available.",
        });
        return;
    }

    setIsSending(true);
    const textToSend = newMessage;
    setNewMessage(''); // Clear input immediately for better UX

    try {
      const chatDocRef = doc(db, 'chats', chatId);
      const messageData = {
          id: Date.now().toString(), // Not ideal for production, use uuid
          senderId: user.uid,
          text: textToSend,
          timestamp: serverTimestamp()
      };

      await updateDoc(chatDocRef, {
          messages: arrayUnion(messageData),
          lastMessage: {
              text: textToSend,
              timestamp: serverTimestamp(),
              senderId: user.uid
          }
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(textToSend); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
        <div className="flex flex-col h-dvh items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }
  
  if (!conversation || !otherUser) {
      return notFound();
  }
  
  const sortedMessages = conversation.messages?.sort((a, b) => {
      const timeA = a.timestamp ? (a.timestamp as Timestamp).toMillis() : 0;
      const timeB = b.timestamp ? (b.timestamp as Timestamp).toMillis() : 0;
      return timeA - timeB;
  });

  return (
    <div className="flex flex-col h-dvh">
      <header className="fixed top-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-sm border-b">
        <div className="container mx-auto flex items-center h-16 gap-4 px-4">
            <Link href="/chats">
              <Button variant="ghost" size="icon"><ArrowLeft /></Button>
            </Link>
            <div className="relative">
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={conversation.participants[otherUser.id]?.avatar} alt={otherUser.name} data-ai-hint="person portrait" />
                <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0">
                <PresenceDot userId={otherUser.id} />
              </div>
            </div>
            <Link href={`/view-profile/${otherUser.id}`} className="hover:underline">
              <h2 className="text-lg font-semibold">{otherUser.name}</h2>
            </Link>
        </div>
      </header>
      
      <main className="flex-grow overflow-y-auto pt-20 pb-24 px-4 space-y-4">
        {sortedMessages?.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-sm border-t">
        <form onSubmit={handleSendMessage} className="container mx-auto p-2 sm:p-4">
          <div className="flex items-center gap-2">
            <Input 
                placeholder="Type a message..." 
                className="flex-grow bg-background" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={isSending}
            />
            <Button size="icon" type="submit" disabled={!newMessage.trim() || isSending}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send />}
            </Button>
          </div>
        </form>
      </footer>
    </div>
  );
}
