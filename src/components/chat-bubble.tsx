import type { ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import type { Timestamp } from 'firebase/firestore';

export function ChatBubble({ message }: { message: ChatMessage }) {
    const { user } = useAuth();
    if (!user) return null;

    const isMe = message.senderId === user.uid;
    
    const messageTimestamp = message.timestamp && typeof (message.timestamp as Timestamp).toDate === 'function' 
        ? (message.timestamp as Timestamp).toDate()
        : new Date();

    return (
        <div className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
            <div className={cn(
                "max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl",
                isMe 
                    ? "bg-primary text-primary-foreground rounded-br-none" 
                    : "bg-secondary text-secondary-foreground rounded-bl-none"
            )}>
                <p className="text-sm">{message.text}</p>
                <p className={cn(
                    "text-xs mt-1.5", 
                    isMe ? "text-primary-foreground/70" : "text-muted-foreground",
                    "text-right"
                )}>
                    {format(messageTimestamp, 'p')}
                </p>
            </div>
        </div>
    )
}
