import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function getAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email){
    return { user: null, error: "Unauthorized" };
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  
  if (!user){
    return { user: null, error: "User not found" };
  }

  if (!user.emailVerified){
    return { user: null, error: "Please verify your email first" };
  }

  if (user.role !== "ADMIN"){
    return { user: null, error: "Admin access required" };
  }

  return { user, error: null };
}


export async function getClient() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email){
    return { user: null, error: "Unauthorized" };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { clientProfile: true }
  });

  if (!user){
    return { user: null, error: "User not found" };
  }

  if (!user.emailVerified){
    return { user: null, error: "Please verify your email first" };
  }

  if (user.role !== "CLIENT"){
    return { user: null, error: "Client access required" };
  }

  return { user, error: null };
}

export async function getEngineer(requireApproval = true) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email){
    return { user: null, error: "Unauthorized" };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { engineerProfile: true }
  });

  if (!user){
    return { user: null, error: "User not found" };
  }

  if (!user.emailVerified){
    return { user: null, error: "Please verify your email first" };
  }

  if (user.role !== "ENGINEER"){
    return { user: null, error: "Engineer access required" };
  }

  if (requireApproval) {
    if (!user.engineerProfile) {
      return { user: null, error: "Please complete your profile first" };
    }
    if (user.engineerProfile.status === "PENDING") {
      return { user: null, error: "Account is pending Admin approval" };
    }
    if (user.engineerProfile.status === "REJECTED") {
      return { user: null, error: `Account rejected: ${user.engineerProfile.rejectionReason}` };
    }
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (user.lastActiveAt < twentyFourHoursAgo) {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() }
    });
  }

  return { user, error: null };
}