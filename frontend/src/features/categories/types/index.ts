export interface Category {
  id: number;
  name: string;
  is_default: boolean;
  created_at: string | null;
}

export interface CategoryCreate {
  name: string;
}

export interface CategoryUpdate {
  name: string;
}