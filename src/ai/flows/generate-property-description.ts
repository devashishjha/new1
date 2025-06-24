
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

// All fields are optional to allow for generating a description with partial information.
const GeneratePropertyDescriptionInputSchema = z.object({
    priceType: z.enum(['rent', 'sale']).optional(),
    priceAmount: z.number().optional(),
    location: z.string().optional(),
    societyName: z.string().optional(),
    propertyType: z.string().optional(),
    configuration: z.string().optional(),
    floorNo: z.number().optional(),
    totalFloors: z.number().optional(),
    superBuiltUpArea: z.number().optional(),
    carpetArea: z.number().optional(),
    mainDoorDirection: z.string().optional(),
    hasBalcony: z.boolean().optional(),
    amenities: z.array(z.string()).describe("A list of available amenities.").optional(),
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
- Your entire response MUST be only the description text. Do NOT include any JSON formatting, markdown, or other explanatory text.
- Even if details are sparse, create the best possible description. If no details are provided at all, you can write something like: "A property with great potential. Contact the lister for more details."

Here are the available property details to use:
{{#if priceType}}- Listing for: {{{priceType}}}{{/if}}
{{#if priceAmount}}- Price: {{{priceAmount}}}{{/if}}
{{#if location}}- Location: {{{location}}}{{/if}}
{{#if societyName}}- Society/Building: {{{societyName}}}{{/if}}
{{#if propertyType}}- Property Type: {{{propertyType}}}{{/if}}
{{#if configuration}}- Configuration: {{{configuration}}}{{/if}}
{{#if floorNo}}- Floor: {{{floorNo}}}{{#if totalFloors}} out of {{{totalFloors}}}{{/if}}{{/if}}
{{#if superBuiltUpArea}}- Super Built-up Area: {{{superBuiltUpArea}}} sqft{{/if}}
{{#if carpetArea}}- Carpet Area: {{{carpetArea}}} sqft{{/if}}
{{#if mainDoorDirection}}- Main Door Facing: {{{mainDoorDirection}}}{{/if}}
{{#if hasBalcony}}- Has Balcony: Yes{{/if}}
{{#if amenities}}- Key Amenities: {{#each amenities}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}

Generate the description now.`,
});

const generatePropertyDescriptionFlow = ai.defineFlow(
  {
    name: 'generatePropertyDescriptionFlow',
    inputSchema: GeneratePropertyDescriptionInputSchema,
    outputSchema: GeneratePropertyDescriptionOutputSchema,
  },
  async input => {
    try {
        const response = await prompt(input);
        const description = response.text;

        // If the AI returns a valid description, use it.
        if (description) {
            return { description };
        }
        // Log if the output is malformed but an error wasn't thrown.
        console.warn("AI output was empty, generating fallback.", { response });
    } catch (e) {
        // Log any error from the AI prompt call for debugging purposes.
        console.error("AI prompt call failed, generating fallback description.", e);
    }
    
    // If the AI fails for any reason (error, invalid output, safety block, etc.),
    // construct a simple, reliable fallback description.
    const fallbackDescription = `This is a ${input.configuration || 'property'} ${input.propertyType || ''} in ${input.societyName || 'a prime location'}, available for ${input.priceType || 'rent/sale'}${input.location ? ` in ${input.location}` : ''}. For complete details, please contact the lister.`;

    
    // Return the fallback description wrapped in the expected output schema.
    return {
        description: fallbackDescription
    };
  }
);
