export interface CompanyRecord {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyFilters {
  query?: string;
  industry?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
}
