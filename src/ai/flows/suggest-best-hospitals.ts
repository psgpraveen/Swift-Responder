'use server';

/**
 * @fileOverview An AI agent that suggests the most suitable hospitals based on user needs and location.
 *
 * - suggestBestHospitals - A function that suggests the best hospitals.
 * - SuggestBestHospitalsInput - The input type for the suggestBestHospitals function.
 * - SuggestBestHospitalsOutput - The return type for the suggestBestHospitals function.
 */
import { z } from 'zod';
import { ai } from '../genkit';

const SuggestBestHospitalsInputSchema = z.object({
  needs: z.string().describe('Specific medical needs of the user (e.g., cardiac care, pediatrics).'),
  location: z.string().describe('The current location of the user (e.g., city, address).'),
});
export type SuggestBestHospitalsInput = z.infer<typeof SuggestBestHospitalsInputSchema>;

const HospitalSchema = z.object({
  name: z.string().describe('The name of the hospital.'),
  address: z.string().describe('The address of the hospital.'),
  availableBeds: z.number().describe('The number of available beds in the hospital.'),
  availableICUs: z.number().describe('The number of available ICUs in the hospital.'),
  availableNICUs: z.number().describe('The number of available NICUs in the hospital.'),
  availableOxygenCylinders: z.number().describe('The number of available oxygen cylinders in the hospital.'),
  availableVentilators: z.number().describe('The number of available ventilators in the hospital.'),
  availableDoctors: z.number().describe('The number of available doctors in the hospital.'),
  suitabilityScore: z.number().describe('A score indicating how suitable the hospital is for the user (higher is better).'),
  reason: z.string().describe('The detailed reason this hospital is recommended, based on availability and user needs.')
});

const SuggestBestHospitalsOutputSchema = z.array(HospitalSchema);
export type SuggestBestHospitalsOutput = z.infer<typeof SuggestBestHospitalsOutputSchema>;

export async function suggestBestHospitals(input: SuggestBestHospitalsInput): Promise<SuggestBestHospitalsOutput> {
  return suggestBestHospitalsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestBestHospitalsPrompt',
  input: {schema: SuggestBestHospitalsInputSchema},
  output: {schema: SuggestBestHospitalsOutputSchema},
  prompt: `You are an AI assistant designed to suggest the best hospitals for a user based on their specific medical needs and current location.  You have access to real-time data about hospital bed, ICU, NICU, oxygen, ventilator, and doctor availability.

Given the user's needs: {{{needs}}}, and their current location: {{{location}}},

Suggest a list of hospitals that are most suitable. For each hospital, include its name, address, the number of available beds, ICUs, NICUs, oxygen cylinders, ventilators, and doctors, and a suitability score (higher is better). Also, state the reason why this hospital is recommended. Order the results by suitability score, highest to lowest.

Present the data in a structured format as requested by the output schema.  The suitability score should reflect how well the hospital meets the patient's needs given its location and availability.
`
});

const suggestBestHospitalsFlow = ai.defineFlow(
  {
    name: 'suggestBestHospitalsFlow',
    inputSchema: SuggestBestHospitalsInputSchema,
    outputSchema: SuggestBestHospitalsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
