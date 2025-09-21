/**
 * Schemas and types for the SBAR Synthesizer AI agent.
 * Adapted for the Electron + React (Vite) renderer using zod.
 *
 * These schemas are intended for use in the renderer (validation of inputs/outputs)
 * before sending requests to the Electron main process AI services.
 */

import { z } from 'zod';

export const SbarSynthesizerInputSchema = z.object({
  notes: z
    .string()
    .describe(
      'Raw text notes, observations, and data related to a clinical informatics issue or proposal.'
    ),
  documents: z
    .array(
      z.object({
        fileName: z.string(),
        dataUri: z
          .string()
          .describe(
            "A document or image file as a data URI, including MIME type and Base64 encoding. E.g., 'data:image/png;base64,iVBORw0KGgo...'"
          ),
      })
    )
    .describe('An array of supporting documents or images.'),
});
export type SbarSynthesizerInput = z.infer<typeof SbarSynthesizerInputSchema>;

const SlideSchema = z.object({
  title: z.string().describe('The title of the presentation slide.'),
  content: z
    .array(z.string())
    .describe('A list of bullet points for the slide content.'),
});

const LiteratureResourceSchema = z.object({
  title: z.string().describe('The title of the article or resource.'),
  summary: z.string().describe('A brief summary explaining the relevance of the resource.'),
  status: z
    .enum(['supporting', 'refuting'])
    .describe('Whether the resource supports or refutes the recommendation.'),
});

export const SbarSynthesizerOutputSchema = z.object({
  situation: z
    .string()
    .describe(
      "The 'Situation' section of the SBAR report. Clearly state the problem and its enterprise-wide benefit if solved."
    ),
  background: z
    .string()
    .describe("The 'Background' section. Detail what led to the situation and the current state."),
  assessment: z
    .string()
    .describe("The 'Assessment' section. Analyze the situation and identify key issues."),
  recommendation: z.object({
    text: z.string().describe("The 'Recommendation' section. Propose specific, actionable solutions."),
    successMetrics: z.string().describe('Key metrics to measure the success of the recommendation.'),
  }),
  presentationSlides: z.array(SlideSchema).describe('An array of slides for a PowerPoint presentation summarizing the SBAR report.'),
  pdfContent: z.string().describe('A well-formatted string containing the full SBAR report, suitable for direct inclusion in a PDF document.'),
  literature: z.array(LiteratureResourceSchema).describe('A list of suggested literature resources.'),
});
export type SbarSynthesizerOutput = z.infer<typeof SbarSynthesizerOutputSchema>;
