import { createContext } from "react";

/** Live catalog data for the homepage showcase, from /api/catalog/home. */
export interface LiveProduct {
  slug: string;
  pricePaise: number;
  compareAtPaise: number | null;
  inStock: boolean;
  rating: number | null;
  reviewCount: number;
  defaultVariantId: number | null;
  variantCount: number;
}

export interface HomeData {
  showcase: LiveProduct[];
  categories: { name: string; slug: string; description: string; count: number }[];
  productCount: number;
  brand: { tagline: string; supportingLine: string; supportEmail: string };
}

export const HomeDataContext = createContext<HomeData | null>(null);
