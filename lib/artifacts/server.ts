import type { DataStreamWriter } from 'ai';
import type { Document } from '@/lib/types';
import type { User } from '@supabase/supabase-js';

// TODO: Implement with Supabase
async function saveDocument(document: Document): Promise<void> {
  console.log('saveDocument called with:', document);
}

export interface SaveDocumentProps {
  id: string;
  title: string;
  content: string;
  kind: 'text' | 'code';
}

export interface DocumentHandlerProps {
  id: string;
  title: string;
  dataStream: DataStreamWriter;
  session: { user: User | null };
}

export interface UpdateDocumentProps extends DocumentHandlerProps {
  document: Document;
  description: string;
}

export interface DocumentHandler {
  kind: 'text' | 'code';
  onCreateDocument: (props: DocumentHandlerProps) => Promise<void>;
  onUpdateDocument: (props: UpdateDocumentProps) => Promise<void>;
}

// Placeholder document handlers
const textDocumentHandler: DocumentHandler = {
  kind: 'text',
  onCreateDocument: async ({ id, title, dataStream }) => {
    dataStream.writeData({
      type: 'text-document',
      content: `# ${title}\n\nThis is a new text document.`,
    });
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    dataStream.writeData({
      type: 'text-document',
      content: `Updated: ${document.content}\n\nDescription: ${description}`,
    });
  },
};

const codeDocumentHandler: DocumentHandler = {
  kind: 'code',
  onCreateDocument: async ({ id, title, dataStream }) => {
    dataStream.writeData({
      type: 'code-document',
      content: `// ${title}\nconsole.log('Hello, world!');`,
    });
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    dataStream.writeData({
      type: 'code-document',
      content: `// Updated code\n${document.content}\n// ${description}`,
    });
  },
};

export const artifactKinds = ['text', 'code'] as const;

export const documentHandlersByArtifactKind: DocumentHandler[] = [
  textDocumentHandler,
  codeDocumentHandler,
];

export { saveDocument };
