export interface ResumeRecord {
  id: string;
  title: string;
  description?: string | null;
  fileName: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}
