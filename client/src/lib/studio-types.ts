export type StudioCategory = "photo" | "sound-stage" | "podcast" | "music" | "art";

export type FeaturedStudio = {
  id: string;
  title: string;
  category: StudioCategory;
  hourlyRate: number;
  location: string;
  image: string;
  rating: number;
  maxCapacity: number;
  amenities?: string[];
  createdAt?: string;
};

export type HostStudio = FeaturedStudio & {
  securityDeposit: number;
  maxCapacity: number;
  images: string[];
  amenities: string[];
  overview: string;
  isAvailable: boolean;
  ownerName: string;
  ownerEmail: string;
  moderationStatus: "pending" | "approved" | "rejected";
  moderationNote?: string;
  updatedAt?: string;
};

export const studioCategoryLabels: Record<StudioCategory, string> = {
  photo: "Photo studio",
  "sound-stage": "Sound stage",
  podcast: "Podcast room",
  music: "Music suite",
  art: "Art workshop",
};

export const studioCategoryToneClasses: Record<StudioCategory, string> = {
  photo: "bg-accent-rose-soft text-accent-rose-strong",
  "sound-stage": "bg-accent-blue-soft text-accent-blue-strong",
  podcast: "bg-accent-violet-soft text-accent-violet-strong",
  music: "bg-accent-yellow-soft text-accent-yellow-strong",
  art: "bg-accent-green-soft text-accent-green-strong",
};
