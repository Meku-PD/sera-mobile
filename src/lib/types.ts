export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  stock: number;
  region: string | null;
  maker_name: string | null;
  maker_story: string | null;
  rating: number | null;
  featured: boolean | null;
  maker_image_url?: string | null;
};
