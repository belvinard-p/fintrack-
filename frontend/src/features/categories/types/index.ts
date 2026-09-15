export interface Category {
  id: number;
  name: string;
  is_default: boolean;
}

export interface CategoryCreate {
  name: string;
}

export interface CategoryUpdate {
  name: string;
}