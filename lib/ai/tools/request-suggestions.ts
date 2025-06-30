import { z } from 'zod';
import type { User } from '@supabase/supabase-js';
import { type DataStreamWriter, streamObject, tool } from 'ai';
import type { Document, Suggestion } from '@/lib/types';
import { myProvider } from '@/lib/ai/providers';

// TODO: Implement these functions with Supabase
async function getDocumentById(id: string): Promise<Document | null> {
  console.log('getDocumentById called with:', id);
  return null;
}

async function saveSuggestions(
  suggestions: Array<Omit<Suggestion, 'id' | 'createdAt'>>,
): Promise<void> {
  console.log('saveSuggestions called with:', suggestions);
}

interface RequestSuggestionsProps {
  session: { user: User | null };
  dataStream: DataStreamWriter;
}

export const requestSuggestions = ({
  session,
  dataStream,
}: RequestSuggestionsProps) =>
  tool({
    description:
      'Request suggestions for a document. This will generate suggestions for the document and save them to the database.',
    parameters: z.object({
      documentId: z.string(),
    }),
    execute: async ({ documentId }) => {
      if (!session.user) {
        throw new Error('User must be authenticated to request suggestions');
      }

      const document = await getDocumentById(documentId);

      if (!document) {
        throw new Error('Document not found');
      }

      const suggestions: Array<Omit<Suggestion, 'id' | 'createdAt'>> = [];

      const { partialObjectStream } = await streamObject({
        model: myProvider.languageModel('suggestion-model'),
        system: `You are a helpful assistant that provides suggestions for documents.
        
        Please provide suggestions for the document content. Each suggestion should include:
        - originalText: the text that should be changed
        - suggestedText: the suggested replacement text
        - description: a brief description of why this suggestion is being made
        
        Focus on improvements to clarity, grammar, style, and overall quality.`,
        prompt: `Document title: ${document.title}\nDocument content: ${document.content}`,
        schema: z.object({
          suggestions: z.array(
            z.object({
              originalText: z.string(),
              suggestedText: z.string(),
              description: z.string(),
            }),
          ),
        }),
      });

      for await (const partialObject of partialObjectStream) {
        dataStream.writeData({
          type: 'suggestions',
          content: JSON.stringify(partialObject),
        });
      }

      if (suggestions.length > 0) {
        await saveSuggestions(
          suggestions.map((suggestion) => ({
            ...suggestion,
            documentId,
            documentCreatedAt: document.createdAt,
            isResolved: false,
            userId: session.user!.id,
          })),
        );
      }

      return {
        message: `Generated ${suggestions.length} suggestions for the document.`,
      };
    },
  });
