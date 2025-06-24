
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
  prompt: `You are an expert real estate copywriter. Your task is to generate a compelling and attractive property listing description based on the structured data provided.

The tone should be professional yet inviting. Highlight the key selling points without being overly verbose. Aim for a description between 50 to 100 words.

Focus on creating a narrative that helps a potential buyer or renter envision themselves living in the property.

**CRITICAL INSTRUCTIONS:**
- Your entire response MUST be only the description text. Do NOT include any JSON formatting, markdown, or other explanatory text.
- Even if details are sparse, create the best possible description. If absolutely no appealing details are available, your description should state something like: "This property is a {{configuration}} available for {{priceType}} in {{location}}. Contact the lister for more details."

Here are the actual property details to use:
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
    const fallbackDescription = `This is a ${input.configuration} ${input.propertyType} in ${input.societyName}, available for ${input.priceType} in ${input.location}. It features a super built-up area of ${input.superBuiltUpArea} sqft. For complete details, please contact the lister.`;
    
    // Return the fallback description wrapped in the expected output schema.
    return {
        description: fallbackDescription
    };
  }
);
