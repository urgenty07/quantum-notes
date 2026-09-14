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

export const competitionAchievements: CompetitionAchievement[] = [
  {
    index: "01",
    date: "2026.08",
    event: "第十五届“中国软件杯”大学生软件设计大赛",
    stage: "全国总决赛",
    group: "普通高等教育组",
    award: "三等奖",
    project: "基于大模型的个性化资源生成与学习多智能体系统开发",
    summary: "围绕个性化学习资源生成与多智能体协作，完成系统方案设计与工程实现。",
    topics: ["大模型", "多智能体", "个性化学习"]
  }
];
