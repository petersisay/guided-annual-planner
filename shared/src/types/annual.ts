export interface AnnualReviewData {
  celebrations?: string;
  obstaclesEncountered?: string;
  keyLessonsLearned?: string;
  completedAt?: string;
}

export interface AnnualPlan {
  id: string;
  userId: string;
  year: number;
  themeOrWord?: string;
  annualIntentions: string[];
  annualReview: AnnualReviewData;
  createdAt: string;
  updatedAt: string;
}
