'use server';

/**
 * @fileOverview An AI agent that suggests task prioritization based on deadlines and impact.
 *
 * - suggestTaskPrioritization - A function that handles the task prioritization process.
 * - SuggestTaskPrioritizationInput - The input type for the suggestTaskPrioritization function.
 * - SuggestTaskPrioritizationOutput - The return type for the suggestTaskPrioritization function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTaskPrioritizationInputSchema = z.object({
  tasks: z
    .array(
      z.object({
        title: z.string().describe('The title of the task.'),
        description: z.string().describe('A detailed description of the task.'),
        dueDate: z.string().describe('The due date of the task (ISO format).'),
        impact: z
          .string()
          .describe(
            'The impact of the task on the project or organization (e.g., High, Medium, Low).' /* Added description */
          ),
      })
    )
    .describe('A list of tasks to prioritize.'),
});
export type SuggestTaskPrioritizationInput = z.infer<
  typeof SuggestTaskPrioritizationInputSchema
>;

const SuggestTaskPrioritizationOutputSchema = z.object({
  prioritizedTasks: z
    .array(
      z.object({
        title: z.string().describe('The title of the task.'),
        priority: z
          .string()
          .describe(
            'The suggested priority of the task (e.g., High, Medium, Low).' /* Added description */
          ),
        reason: z
          .string()
          .describe('The reason for the suggested priority.' /* Added description */),
      })
    )
    .describe('A list of tasks with suggested priorities and reasons.'),
});
export type SuggestTaskPrioritizationOutput = z.infer<
  typeof SuggestTaskPrioritizationOutputSchema
>;

export async function suggestTaskPrioritization(
  input: SuggestTaskPrioritizationInput
): Promise<SuggestTaskPrioritizationOutput> {
  return suggestTaskPrioritizationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTaskPrioritizationPrompt',
  input: {schema: SuggestTaskPrioritizationInputSchema},
  output: {schema: SuggestTaskPrioritizationOutputSchema},
  prompt: `You are an AI assistant that suggests task prioritization based on deadlines and impact.

  Given the following list of tasks, suggest a priority (High, Medium, or Low) for each task and provide a reason for the suggestion.  Consider the due date and impact of each task when determining the priority.

  Tasks:
  {{#each tasks}}
  - Title: {{this.title}}
    Description: {{this.description}}
    Due Date: {{this.dueDate}}
    Impact: {{this.impact}}
  {{/each}}

  Output should be a JSON array of tasks with suggested priorities and reasons.
  `,
});

const suggestTaskPrioritizationFlow = ai.defineFlow(
  {
    name: 'suggestTaskPrioritizationFlow',
    inputSchema: SuggestTaskPrioritizationInputSchema,
    outputSchema: SuggestTaskPrioritizationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
