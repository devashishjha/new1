import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import type {Plugin} from 'genkit';

const plugins: Plugin<any>[] = [];
// Only initialize the Google AI plugin if the API key is provided.
// This prevents server crashes during startup if the key is missing.
if (process.env.GOOGLE_API_KEY) {
  plugins.push(googleAI());
}

export const ai = genkit({
  plugins,
  model: 'googleai/gemini-2.0-flash',
});
