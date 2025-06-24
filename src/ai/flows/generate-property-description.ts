
'use server';
/**
 * @fileOverview An AI agent for generating property descriptions.
 *
 * - generatePropertyDescription - A function that creates a compelling property description from structured data.
 * - GeneratePropertyDescriptionInput - The input type for the function.
 * - GeneratePropertyDescriptionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Using a subset of the full property schema for the AI prompt
const GeneratePropertyDescriptionInputSchema = z.object({
    priceType: z.enum(['rent', 'sale']),
    priceAmount: z.number(),
    location: z.string(),
    societyName: z.string(),
    propertyType: z.string(),
    configuration: z.string(),
    floorNo: z.number(),
    totalFloors: z.number(),
    superBuiltUpArea: z.number(),
    carpetArea: z.number(),
    mainDoorDirection: z.string(),
    hasBalcony: z.boolean(),
    amenities: z.array(z.string()).describe("A list of available amenities.")
});
export type GeneratePropertyDescriptionInput = z.infer<typeof GeneratePropertyDescriptionInputSchema>;

const GeneratePropertyDescriptionOutputSchema = z.object({
  description: z.string().describe('A compelling, professionally written property description.'),
});
export type GeneratePropertyDescriptionOutput = z.infer<typeof GeneratePropertyDescriptionOutputSchema>;


export async function generatePropertyDescription(input: GeneratePropertyDescriptionInput): Promise<GeneratePropertyDescriptionOutput> {
  return generatePropertyDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePropertyDescriptionPrompt',
  input: {schema: GeneratePropertyDescriptionInputSchema},
  output: {schema: GeneratePropertyDescriptionOutputSchema},
  prompt: `You are an expert real estate copywriter. Your task is to generate a compelling and attractive property listing description based on the structured data provided.

The tone should be professional yet inviting. Highlight the key selling points without being overly verbose. Aim for a description between 50 to 100 words.

Focus on creating a narrative that helps a potential buyer or renter envision themselves living in the property.

**CRITICAL INSTRUCTIONS:**
- You MUST generate a description, even if some details are missing or have values like 0.
- If a detail is not provided or is zero, omit it gracefully from the description. For example, don't mention the floor number if it is 0.
- Use the available details to create the most appealing description possible.
- **Your entire response MUST be a single JSON object, containing only the 'description' key.**

Here are the property details:
- Listing for: {{{priceType}}}
- Price: {{{priceAmount}}}
- Location: {{{location}}}
- Society/Building: {{{societyName}}}
- Property Type: {{{propertyType}}}
- Configuration: {{{configuration}}}
- Floor: {{{floorNo}}} out of {{{totalFloors}}}
- Super Built-up Area: {{{superBuiltUpArea}}} sqft
- Carpet Area: {{{carpetArea}}} sqft
- Main Door Facing: {{{mainDoorDirection}}}
- Has Balcony: {{{hasBalcony}}}
- Key Amenities: {{#each amenities}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Generate the description now.`,
});

const generatePropertyDescriptionFlow = ai.defineFlow(
  {
    name: 'generatePropertyDescriptionFlow',
    inputSchema: GeneratePropertyDescriptionInputSchema,
    outputSchema: GeneratePropertyDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.description) {
        throw new Error("The AI model failed to produce a valid description. The output was null or empty.");
    }
    return output;
  }
);
