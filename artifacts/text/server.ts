// Text artifacts functionality is disabled for this constraint parser project

export const textDocumentHandler = {
  kind: 'text' as const,
  onCreateDocument: async () => {
    return '';
  },
  onUpdateDocument: async () => {
    return '';
  },
};
