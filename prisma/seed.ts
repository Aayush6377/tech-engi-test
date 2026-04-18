import { generateEmbedding } from "@/lib/embeddings";
import { prisma } from "@/lib/prisma";
import { Role, ApprovalStatus, Qualification, IdType, ProjectStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaClient } from '@prisma/client';

async function main() {
  console.log("Starting database seed...");

  const hashedPassword = await bcrypt.hash("password123", 10);

  console.log("Creating Admin...");
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@example.com",
      password: hashedPassword,
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
  });

  console.log("Creating Client and Projects...");
  const clientUser = await prisma.user.upsert({
    where: { email: "client@example.com" },
    update: {},
    create: {
      name: "Tech Corp India",
      email: "client@example.com",
      password: hashedPassword,
      role: Role.CLIENT,
      emailVerified: new Date(),
      clientProfile: {
        create: {
          totalProjects: 3,
          totalBudget: 45000,
          expertise: ["IoT", "Hardware Startups"],
        }
      }
    },
  });

  const clientProfile = await prisma.clientProfile.findUnique({ where: { userId: clientUser.id } });

  if (clientProfile) {
    await prisma.project.create({
      data: {
        clientId: clientProfile.id,
        title: "Smart Home Temperature Controller",
        description: "Need a microcontroller-based system to read DHT11 sensors and control AC units via relays.",
        budget: 10000,
        instruments: ["Arduino", "DHT11", "Relay Module", "ESP8266"],
        roadmapFiles: [],
        advancePaid: false,
        status: ProjectStatus.AWAITING_ADVANCE,
      }
    });

    await prisma.project.create({
      data: {
        clientId: clientProfile.id,
        title: "Drone Flight Controller Firmware",
        description: "Looking for an expert to write custom PID loops for a quadcopter using STM32.",
        budget: 25000,
        instruments: ["STM32", "IMU MPU6050", "C++", "ESC"],
        roadmapFiles: [],
        advancePaid: false,
        status: ProjectStatus.AWAITING_ADVANCE,
      }
    });

    await prisma.project.create({
      data: {
        clientId: clientProfile.id,
        title: "Custom PCB Layout for Wearable",
        description: "Design a 4-layer PCB for a smartwatch prototype.",
        budget: 10000,
        instruments: ["Altium", "Eagle", "KiCad", "SMD Soldering"],
        roadmapFiles: [],
        advancePaid: false,
        status: ProjectStatus.AWAITING_ADVANCE,
      }
    });
  }

  const skillPool = [
    "Arduino", "Raspberry Pi", "C++", "Python", "ESP32", "ESP8266", "IoT",
    "Altium", "KiCad", "PCB Design", "Soldering", "STM32", "Firmware",
    "Robotics", "Sensors", "Microcontrollers", "PID Control"
  ];

  for (let i = 1; i <= 30; i++) {
    const shuffledSkills = skillPool.sort(() => 0.5 - Math.random());
    const engineerSkills = shuffledSkills.slice(0, Math.floor(Math.random() * 3) + 3);

    console.log(`Creating ${i}/30 Engineers...`);

    const user = await prisma.user.upsert({
      where: { email: `engineer${i}@example.com` },
      update: {},
      create: {
        name: `Engineer ${i}`,
        email: `engineer${i}@example.com`,
        password: hashedPassword,
        role: Role.ENGINEER,
        emailVerified: new Date(),
        engineerProfile: {
          create: {
            status: ApprovalStatus.APPROVED,
            qualification: Qualification.UG,
            idType: IdType.AADHAAR,
            idNumber: `1234-5678-00${i.toString().padStart(2, '0')}`,
            idFile: "/placeholder-id.jpg",
            skills: engineerSkills,
            certifications: ["B.Tech Electronics"],
          }
        }
      }
    });

    const embeddingText = `Skills: ${engineerSkills.join(", ")}`;
    const embeddingVector = await generateEmbedding(embeddingText);
    const vectorString = JSON.stringify(embeddingVector);

    await prisma.$executeRaw`
      UPDATE "EngineerProfile"
      SET embedding = ${vectorString}::vector
      WHERE "userId" = ${user.id}
    `;
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });