// Define as a pure TypeScript type to avoid unused runtime schema lint
export type ProjectImageUpload = {
  file: File;
  projectId: string;
};

export interface ProjectImageResponse {
  success: boolean;
  resourceKey?: string;
  error?: string;
}
