export type StudioCategory = "photo" | "sound-stage" | "podcast" | "music" | "art";

export type FeaturedStudio = {
  id: string;
  title: string;
  category: StudioCategory;
  hourlyRate: number;
  location: string;
  image: string;
  rating: number;
};

export const studioCategoryLabels: Record<StudioCategory, string> = {
  photo: "Photo studio",
  "sound-stage": "Sound stage",
  podcast: "Podcast room",
  music: "Music suite",
  art: "Art workshop",
};
