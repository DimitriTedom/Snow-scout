export type CreateProjectInput = {
  name: string;
  slug: string;
  description?: string;
  bibleText?: string;
  biblePath?: string;
  titleFormulas?: string;
  thumbnailNotes?: string;
};

export type ProjectSeedBundle = {
  competitors: { channelUrl: string; label?: string }[];
  keywords: string[];
  outliers: { videoUrl: string; notes?: string }[];
};