
'use client';

import type { PropertyMatchScoreOutput } from '@/ai/flows/property-match-score';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import { CheckCircle2, XCircle, Zap } from 'lucide-react';

export function AiMatchDialog({ open, onOpenChange, matchInfo }: { open: boolean, onOpenChange: (open: boolean) => void, matchInfo: PropertyMatchScoreOutput | null | undefined }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black/80 backdrop-blur-lg border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-primary text-2xl'><Zap className='w-7 h-7' strokeWidth={2.5} /> AI Match Analysis</DialogTitle>
          <DialogDescription>
            Here's how this property stacks up against your criteria.
          </DialogDescription>
        </DialogHeader>
        
        {matchInfo === undefined ? (
             <Card className="bg-black/40 border-white/10">
                <CardHeader>
                     <CardTitle className='flex items-center gap-2'><Skeleton className='h-6 w-24 bg-white/20' /></CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                    <Skeleton className='h-4 w-full bg-white/20' />
                     <Skeleton className='h-4 w-[80%] bg-white/20' />
                </CardContent>
            </Card>
        ) : matchInfo ? (
            <Card className='bg-primary/10 border-primary/20'>
                <CardHeader>
                    <CardTitle className='flex items-center justify-between gap-2 text-white'>
                        <span>Overall Score</span>
                        <span className="text-primary font-bold text-3xl">{matchInfo.matchScore}%</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-white">
                    {matchInfo.summary && (
                        <p className="text-sm italic text-white/80 border-l-2 border-primary/50 pl-4">
                            {matchInfo.summary}
                        </p>
                    )}
                    {matchInfo.matches && matchInfo.matches.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-400" /> What Matches</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                                {matchInfo.matches.map((match, i) => <li key={`match-${i}`}>{match}</li>)}
                            </ul>
                        </div>
                    )}
                    {matchInfo.mismatches && matchInfo.mismatches.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2 pt-3"><XCircle className="w-5 h-5 text-red-400" /> What Doesn't Match</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                                {matchInfo.mismatches.map((mismatch, i) => <li key={`mismatch-${i}`}>{mismatch}</li>)}
                            </ul>
                        </div>
                    )}
                </CardContent>
            </Card>
        ) : (
             <p className="text-center text-muted-foreground py-8">Could not retrieve AI Match Analysis for this property.</p>
        )}

      </DialogContent>
    </Dialog>
  );
}
