export type ListingSnapshot = {
  listingId: string;
  title: string;
  categoryId: string;
  sellerId?: string;
};

export type RecommendationItem = {
  listingId: string;
  title?: string;
  categoryId?: string;
  score: number;
  reason: string;
  updatedAt: Date;
};

export type OrderItem = {
  listingId: string;
  title?: string;
  categoryId?: string;
};
