import prisma from '../../database/prisma.js';

export const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      playerId: true,
      username: true,
      email: true,
      avatar: true,
      college: true,
      leetcode_link: true,
      hackerearth_link: true,
      xp: true,
      level: true,
      rank: true,
      coins: true,
      wins: true,
      losses: true,
      createdAt: true,
      submissions: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
      // We explicitly DO NOT select the password here
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const difficultyStatsRaw = await prisma.submission.groupBy({
    by: ['difficulty'],
    where: { userId },
    _count: true
  });
  
  const difficultyStats = { Easy: 0, Medium: 0, Hard: 0 };
  difficultyStatsRaw.forEach(stat => {
    difficultyStats[stat.difficulty] = stat._count;
  });

  user.difficultyStats = difficultyStats;

  return user;
};

export const getUserHeatmap = async (userId) => {
  const heatmap = await prisma.heatmapActivity.findMany({
    where: { userId },
    orderBy: { date: 'asc' }
  });
  return heatmap;
};

export const recordSubmission = async (userId, problemName, difficulty = 'Easy') => {
  const today = new Date().toISOString().split('T')[0];
  
  await prisma.submission.create({
    data: { userId, problemName, difficulty }
  });
  
  const existingActivity = await prisma.heatmapActivity.findUnique({
    where: { userId_date: { userId, date: today } }
  });
  
  if (existingActivity) {
    const newLevel = Math.min(existingActivity.level + 1, 4);
    await prisma.heatmapActivity.update({
      where: { id: existingActivity.id },
      data: { level: newLevel }
    });
  } else {
    await prisma.heatmapActivity.create({
      data: { userId, date: today, level: 1 }
    });
  }
  
  // Gamification: increment XP based on difficulty
  let xpEarned = 15;
  if (difficulty === 'Medium') xpEarned = 30;
  if (difficulty === 'Hard') xpEarned = 50;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { xp: true } });
  const newXp = (user?.xp || 0) + xpEarned;
  
  const level = Math.floor(newXp / 100) + 1;
  let rank = 'Unranked';
  if (level >= 50) rank = 'Challenger';
  else if (level >= 40) rank = 'Grandmaster';
  else if (level >= 30) rank = 'Master';
  else if (level >= 20) rank = 'Diamond';
  else if (level >= 15) rank = 'Platinum';
  else if (level >= 10) rank = 'Gold';
  else if (level >= 5) rank = 'Silver';
  else if (level >= 2) rank = 'Bronze';

  await prisma.user.update({
    where: { id: userId },
    data: { xp: newXp, level, rank }
  });
};

export const recordSubmissionByPlayerId = async (playerId, problemName, difficulty = 'Easy') => {
  const user = await prisma.user.findUnique({
    where: { playerId }
  });
  if (!user) throw new Error('User not found');
  
  await recordSubmission(user.id, problemName, difficulty);
};

export const addBonusXpByPlayerId = async (playerId, bonusXp) => {
  const user = await prisma.user.findUnique({ where: { playerId }, select: { id: true, xp: true } });
  if (!user) return;
  
  const newXp = (user.xp || 0) + bonusXp;
  const level = Math.floor(newXp / 100) + 1;
  let rank = 'Unranked';
  if (level >= 50) rank = 'Challenger';
  else if (level >= 40) rank = 'Grandmaster';
  else if (level >= 30) rank = 'Master';
  else if (level >= 20) rank = 'Diamond';
  else if (level >= 15) rank = 'Platinum';
  else if (level >= 10) rank = 'Gold';
  else if (level >= 5) rank = 'Silver';
  else if (level >= 2) rank = 'Bronze';

  await prisma.user.update({
    where: { id: user.id },
    data: { xp: newXp, level, rank }
  });
};

export const updateUserProfile = async (userId, data) => {
  if (data.username) {
    const existing = await prisma.user.findUnique({ where: { username: data.username } });
    if (existing && existing.id !== userId) {
      throw new Error('Username is already taken');
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      username: data.username,
      college: data.college || null,
      leetcode_link: data.leetcode_link || null,
      hackerearth_link: data.hackerearth_link || null,
      avatar: data.avatar || null,
    },
    select: {
      id: true,
      playerId: true,
      username: true,
      email: true,
      avatar: true,
      college: true,
      leetcode_link: true,
      hackerearth_link: true,
      xp: true,
      level: true,
      rank: true,
      coins: true,
      wins: true,
      losses: true,
      createdAt: true,
      submissions: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });
  
  return updatedUser;
};

export const searchUserById = async (playerId) => {
  const user = await prisma.user.findUnique({
    where: { playerId },
    select: {
      id: true,
      playerId: true,
      username: true,
      avatar: true,
      rank: true,
      level: true,
    }
  });
  return user;
};

export const getLeaderboard = async () => {
  const users = await prisma.user.findMany({
    orderBy: { xp: 'desc' },
    take: 100,
    select: {
      id: true,
      playerId: true,
      username: true,
      avatar: true,
      xp: true,
      level: true,
      rank: true,
      college: true
    }
  });
  return users;
};
