import type { Profile, Badge } from '../types/incident';

export interface LevelInfo {
  level: number;
  title: string;
  minPoints: number;
  nextLevelPoints: number;
  progressPercent: number;
}

export const LEVEL_TIERS: { level: number; title: string; minPoints: number }[] = [
  { level: 1, title: 'Alert Resident', minPoints: 0 },
  { level: 2, title: 'Ward Watcher', minPoints: 100 },
  { level: 3, title: 'Civic Sentinel', minPoints: 250 },
  { level: 4, title: 'Community Inspector', minPoints: 500 },
  { level: 5, title: 'Neighborhood Guardian', minPoints: 750 },
  { level: 6, title: 'Ward Champion', minPoints: 1000 },
  { level: 7, title: 'Community Guardian', minPoints: 1500 },
];

export function calculateLevel(points: number): LevelInfo {
  let currentTier = LEVEL_TIERS[0];
  let nextTier = LEVEL_TIERS[1];

  for (let i = 0; i < LEVEL_TIERS.length; i++) {
    if (points >= LEVEL_TIERS[i].minPoints) {
      currentTier = LEVEL_TIERS[i];
      nextTier = LEVEL_TIERS[i + 1] || { level: LEVEL_TIERS[i].level + 1, title: 'Honorary Zonal Commissioner', minPoints: currentTier.minPoints + 1000 };
    } else {
      break;
    }
  }

  const pointsInCurrentLevel = points - currentTier.minPoints;
  const pointsRequiredForNext = nextTier.minPoints - currentTier.minPoints;
  const progressPercent = Math.min(100, Math.max(0, Math.round((pointsInCurrentLevel / pointsRequiredForNext) * 100)));

  return {
    level: currentTier.level,
    title: currentTier.title,
    minPoints: currentTier.minPoints,
    nextLevelPoints: nextTier.minPoints,
    progressPercent,
  };
}

export function computeBadges(profile: Profile | null, issuesCountByCategory: Record<string, number> = {}): Badge[] {
  const points = profile?.civic_points ?? 10;
  const reportsCount = profile?.verified_reports_count ?? 0;
  const verificationsCount = profile?.verifications_count ?? 0;
  
  const mergedCategories = {
    ...(profile?.category_counts || {}),
    ...issuesCountByCategory,
  };

  const potholeCount = mergedCategories['pothole'] || 0;
  const sanitationCount = (mergedCategories['garbage'] || 0) + (mergedCategories['open_manhole'] || 0) + (mergedCategories['drainage'] || 0);

  return [
    {
      id: 'civic_detective',
      name: 'Civic Detective',
      description: 'Lodge 5 genuine, AI-verified civic hazard reports with photographic evidence.',
      icon: 'detective',
      category: 'reporting',
      unlocked: reportsCount >= 5,
      progress: reportsCount,
      maxProgress: 5,
    },
    {
      id: 'early_alert',
      name: 'Early Alert Sentinel',
      description: 'First resident to document a high-hazard civic failure before cluster escalation.',
      icon: 'alert',
      category: 'reporting',
      unlocked: reportsCount >= 1,
      progress: Math.min(1, reportsCount),
      maxProgress: 1,
    },
    {
      id: 'master_verifier',
      name: 'Master Verifier',
      description: 'Cast 10 verified sign-off audits confirming municipal contractor repairs.',
      icon: 'verifier',
      category: 'verification',
      unlocked: verificationsCount >= 10,
      progress: verificationsCount,
      maxProgress: 10,
    },
    {
      id: 'clean_city',
      name: 'Sanitation Champion',
      description: 'Document and audit solid waste, overflow, or stormwater drain clearance.',
      icon: 'eco',
      category: 'impact',
      unlocked: sanitationCount >= 2,
      progress: Math.min(2, sanitationCount),
      maxProgress: 2,
    },
    {
      id: 'road_watcher',
      name: 'Road Infrastructure Watcher',
      description: 'Report 3 road surface hazards, dangerous potholes, or collapsed medians.',
      icon: 'road',
      category: 'impact',
      unlocked: potholeCount >= 3,
      progress: Math.min(3, potholeCount),
      maxProgress: 3,
    },
    {
      id: 'civic_guardian',
      name: 'Civic Guardian Honors',
      description: 'Reach 1,000+ verified Civic Points and Top Ward reputation standing.',
      icon: 'guardian',
      category: 'mastery',
      unlocked: points >= 1000,
      progress: points,
      maxProgress: 1000,
    },
  ];
}
