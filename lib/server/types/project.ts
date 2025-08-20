// Define as a pure TypeScript type to avoid unused runtime schema lint
export type ProjectImageUpload = {
  file: File;
  projectId: string;
};

export type ProjectImageResponse = {
  success: boolean;
  resourceKey?: string;
  error?: string;
};
