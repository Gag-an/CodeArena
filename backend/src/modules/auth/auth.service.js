import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../database/prisma.js';

const generatePlayerId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const registerUser = async (data) => {
  const { email, password, username } = data;

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] }
  });
  
  if (existingUser) {
    throw new Error('User with this email or username already exists');
  }

  // Hash the password securely
  const hashedPassword = await bcrypt.hash(password, 10);

  let playerId = generatePlayerId();
  let isUnique = false;
  
  while (!isUnique) {
    const existing = await prisma.user.findUnique({ where: { playerId } });
    if (!existing) {
      isUnique = true;
    } else {
      playerId = generatePlayerId();
    }
  }

  // Save to Neon DB
  const newUser = await prisma.user.create({
    data: {
      playerId,
      email: data.email,
      password: hashedPassword,
      username: data.username,
      college: data.college || null,
      leetcode_link: data.leetcode_link || null,
      hackerearth_link: data.hackerearth_link || null,
    },
  });

  return newUser;
};

export const loginUser = async (data) => {
  const { email, password } = data;

  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid email or password');

  // Verify password matches
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid email or password');

  // Generate JWT Session Token
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.rank },
    process.env.JWT_SECRET || 'codearena_secret_key',
    { expiresIn: '7d' } // Token lasts 1 week
  );

  return { user, token };
};
