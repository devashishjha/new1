'use server';

/**
 * @fileOverview A property match score AI agent.
 *
 * - propertyMatchScore - A function that calculates a match score between a property and user search criteria.
 * - PropertyMatchScoreInput - The input type for the propertyMatchScore function.
 * - PropertyMatchScoreOutput - The return type for the propertyMatchScore function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PropertyMatchScoreInputSchema = z.object({
  propertyDetails: z.string().describe('The details of the property.'),
  searchCriteria: z.string().describe('The user provided search criteria.'),
});
export type PropertyMatchScoreInput = z.infer<typeof PropertyMatchScoreInputSchema>;

const PropertyMatchScoreOutputSchema = z.object({
  matchScore: z.number().describe('A percentage score (0-100) indicating how well the property matches the search criteria.'),
  matches: z.array(z.string()).describe('A list of reasons why the property is a good match.'),
  mismatches: z.array(z.string()).describe('A list of reasons why the property is not a good match.'),
});
export type PropertyMatchScoreOutput = z.infer<typeof PropertyMatchScoreOutputSchema>;

export async function propertyMatchScore(input: PropertyMatchScoreInput): Promise<PropertyMatchScoreOutput> {
  return propertyMatchScoreFlow(input);
}

const prompt = ai.definePrompt({
  name: 'propertyMatchScorePrompt',
  input: {schema: PropertyMatchScoreInputSchema},
  output: {schema: PropertyMatchScoreOutputSchema},
  prompt: `You are an AI expert in real estate property matching. Your goal is to provide a clear, balanced analysis.

You will receive property details and user search criteria.
Your task is to:
1. Calculate a match score from 0 to 100 indicating how well the property matches the search criteria.
2. Provide a list of "matches": specific, positive property features that align with the user's search criteria.
3. Provide a list of "mismatches": specific property features that do not align with the user's search criteria, or could be potential drawbacks.

**CRITICAL INSTRUCTIONS:**
- You MUST provide at least one item for both the 'matches' and 'mismatches' lists.
- If there are no clear positive matches, for the 'matches' list, you can state a neutral fact like "Property is available for rent/sale as requested."
- If there are no clear negative mismatches, for the 'mismatches' list, you can state something like "No major drawbacks found based on provided details."
- Keep each reason concise and to the point.

Analyze the following:
Property Details: {{{propertyDetails}}}
Search Criteria: {{{searchCriteria}}}`,
});

const propertyMatchScoreFlow = ai.defineFlow(
  {
    name: 'propertyMatchScoreFlow',
    inputSchema: PropertyMatchScoreInputSchema,
    outputSchema: PropertyMatchScoreOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
