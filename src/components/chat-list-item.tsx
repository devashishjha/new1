'use client';

import type { ChatConversation } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import type { Timestamp } from 'firebase/firestore';

export function ChatListItem({ conversation, isLast }: { conversation: ChatConversation, isLast: boolean }) {
  const { user } = useAuth();
  
  if (!user) return null;

  const otherUserId = conversation.participantIds.find(id => id !== user.uid);
  if (!otherUserId) return null; // Should not happen in a valid conversation

  const otherUser = conversation.participants[otherUserId];
  const lastMessageTimestamp = conversation.lastMessage?.timestamp as unknown as Timestamp | { toDate: () => Date };

  const lastMessageDate = lastMessageTimestamp && typeof lastMessageTimestamp.toDate === 'function' 
    ? lastMessageTimestamp.toDate() 
    : new Date(lastMessageTimestamp as unknown as string);


  return (
    <div className="block hover:bg-secondary/50 transition-colors">
        <div className="flex items-center gap-4 p-4">
            <Avatar className="h-12 w-12 border">
                <AvatarImage src={otherUser.avatar} alt={otherUser.name} data-ai-hint="person portrait" />
                <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow overflow-hidden">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold truncate">{otherUser.name}</h3>
                    {lastMessageTimestamp && (
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(lastMessageDate, { addSuffix: true })}
                      </p>
                    )}
                </div>
                <div className="flex justify-between items-start mt-1">
                    <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage?.text}</p>
                    {conversation.unreadCount > 0 && (
                        <Badge variant="default" className="h-5 w-5 flex items-center justify-center p-0 text-xs shrink-0 bg-primary">
                            {conversation.unreadCount}
                        </Badge>
                    )}
                </div>
            </div>
        </div>
        {!isLast && <Separator className="ml-20" />}
    </div>
  );
}
