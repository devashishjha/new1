import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import type {Plugin} from 'genkit';

const plugins: Plugin<any>[] = [googleAI()];

export const ai = genkit({
  plugins,
  model: 'googleai/gemini-2.0-flash',
});
