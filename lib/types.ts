export type BookCategory = "public" | "basij";

export type Book = {
  id: number;
  title: string;
  category: BookCategory;
  position: number;
  is_deleted?: boolean;
  deleted_at?: string | null;
};
