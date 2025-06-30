// Image artifacts functionality is disabled for this constraint parser project

export const imageDocumentHandler = {
  kind: 'image' as const,
  onCreateDocument: async () => {
    return '';
  },
  onUpdateDocument: async () => {
    return '';
  },
};
