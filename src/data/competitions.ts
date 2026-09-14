import competitionData from "./competitions.json";

export interface CompetitionAchievement {
  index: string;
  date: string;
  event: string;
  stage: string;
  group: string;
  award: string;
  project: string;
  summary: string;
  topics: string[];
}

export const competitionAchievements = competitionData as CompetitionAchievement[];
