import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// By including the googleAI() plugin unconditionally, we ensure that all AI-related
// definitions (flows, prompts) are registered with Genkit.
// The actual API calls are guarded in server actions, which only execute
// if the GOOGLE_API_KEY environment variable is present at runtime.
// This approach ensures build success while maintaining runtime safety.
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
