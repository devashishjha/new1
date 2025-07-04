'use client';
import { cn } from '@/lib/utils';
import { usePresence } from '@/hooks/use-presence';

export function PresenceDot({ userId }: { userId: string | undefined }) {
  const status = usePresence(userId);

  return (
    <span className={cn(
      'h-3 w-3 rounded-full border-2 border-background',
      status === 'online' ? 'bg-green-500' : 'bg-red-500'
    )} />
  );
}
