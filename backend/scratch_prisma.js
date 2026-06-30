import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    const users = await prisma.user.findMany();
    console.log(users.map(u => ({ username: u.username, leetcode_link: u.leetcode_link })));
    await prisma.$disconnect();
}
run();
