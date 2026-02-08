import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('检查数据库用户...\n');
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      status: true,
      roleId: true,
      passwordHash: true,
    }
  });
  
  console.log(`找到 ${users.length} 个用户:\n`);
  
  for (const user of users) {
    console.log(`用户名: ${user.username}`);
    console.log(`邮箱: ${user.email}`);
    console.log(`状态: ${user.status}`);
    console.log(`密码哈希: ${user.passwordHash?.substring(0, 30)}...`);
    console.log('---');
  }
  
  if (users.length === 0) {
    console.log('⚠️ 没有用户数据，需要重新运行种子脚本！');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
