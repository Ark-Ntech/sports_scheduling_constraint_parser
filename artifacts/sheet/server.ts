// Sheet artifacts functionality is disabled for this constraint parser project

export const sheetDocumentHandler = {
  kind: 'sheet' as const,
  onCreateDocument: async () => {
    return '';
  },
  onUpdateDocument: async () => {
    return '';
  },
};
