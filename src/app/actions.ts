'use server';

import { propertyMatchScore, type PropertyMatchScoreInput, type PropertyMatchScoreOutput } from '@/ai/flows/property-match-score';
import { generatePropertyDescription, type GeneratePropertyDescriptionInput, type GeneratePropertyDescriptionOutput } from '@/ai/flows/generate-property-description';

export async function getPropertyMatchScore(input: PropertyMatchScoreInput): Promise<PropertyMatchScoreOutput | null> {
  try {
    const result = await propertyMatchScore(input);
    return result;
  } catch (error) {
    console.error("Error in getPropertyMatchScore action:", error);
    // In a real app, you might want to log this error to a monitoring service.
    return null;
  }
}

export async function generatePropertyDescriptionAction(input: GeneratePropertyDescriptionInput): Promise<GeneratePropertyDescriptionOutput | null> {
  try {
    const result = await generatePropertyDescription(input);
    return result;
  } catch (error)
 {
    console.error("Error in generatePropertyDescriptionAction:", error);
    return null;
  }
}
