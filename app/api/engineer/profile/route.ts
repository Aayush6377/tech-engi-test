import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEngineer } from "@/lib/auth";
import { deleteFile, uploadFile } from "@/lib/uploads";
import { z } from "zod";
import { generateEmbedding } from "@/lib/embeddings";

export async function GET() {
  try {
    const { user, error } = await getEngineer(false);
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ success: true, profile: user.engineerProfile }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

const engineerProfileSchema = z.object({
  qualification: z.enum(["UG", "EMPLOYED", "UNEMPLOYED"]),
  idType: z.enum(["STUDENT_ID", "AADHAAR", "PAN", "PAY_SLIP"]),
  idNumber: z.string().min(5, "Valid ID number is required"),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  certifications: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getEngineer(false);
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    if (user.engineerProfile) {
      return NextResponse.json({ success: false, message: "Profile already exists" }, { status: 400 });
    }

    const formData = await req.formData();
    
    const idFile = formData.get("file") as File;
    if (!idFile){
        return NextResponse.json({ success: false, message: "ID Image is required" }, { status: 400 });
    }

    const data = {
      qualification: formData.get("qualification"),
      idType: formData.get("idType"),
      idNumber: formData.get("idNumber"),
      skills: JSON.parse(formData.get("skills") as string || "[]"),
      certifications: JSON.parse(formData.get("certifications") as string || "[]"),
    };

    const validation = engineerProfileSchema.safeParse(data);
    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const idFileUrl = await uploadFile(idFile, "kyc");

    const newProfile = await prisma.engineerProfile.create({
      data: {
        userId: user.id,
        status: "PENDING",
        qualification: validation.data.qualification,
        idType: validation.data.idType,
        idNumber: validation.data.idNumber,
        idFile: idFileUrl,
        skills: validation.data.skills,
        certifications: validation.data.certifications || [],
      }
    });

    // generate embedding in background — don't block the response
    generateEmbedding(`Skills: ${validation.data.skills.join(", ")}`)
      .then((embeddingVector) => {
        const vectorString = JSON.stringify(embeddingVector);
        return prisma.$executeRaw`
          UPDATE "EngineerProfile"
          SET embedding = ${vectorString}::vector
          WHERE id = ${newProfile.id}
        `;
      })
      .catch((err) => console.error("[embedding POST]", err));

    return NextResponse.json({ success: true, message: "Profile created successfully" }, { status: 201 });

  } catch (err) {
    console.error("[engineer/profile POST]", err);
    return NextResponse.json({ success: false, message: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user, error } = await getEngineer(false);
    if (error || !user || !user.engineerProfile) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 404 });
    }

    const formData = await req.formData();
    const idFile = formData.get("file") as File | null;

    const data = {
      qualification: formData.get("qualification"),
      idType: formData.get("idType"),
      idNumber: formData.get("idNumber"),
      skills: JSON.parse(formData.get("skills") as string || "[]"),
      certifications: JSON.parse(formData.get("certifications") as string || "[]"),
    };

    const validation = engineerProfileSchema.safeParse(data);
    if (!validation.success){
        return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    let idFileUrl = user.engineerProfile.idFile;
    
    if (idFile && idFile.size > 0) {
      if (user.engineerProfile.idFile) {
        await deleteFile(user.engineerProfile.idFile);
      }
      
      idFileUrl = await uploadFile(idFile, "kyc");
    }

    await prisma.engineerProfile.update({
      where: { userId: user.id },
      data: {
        qualification: validation.data.qualification,
        idType: validation.data.idType,
        idNumber: validation.data.idNumber,
        idFile: idFileUrl,
        skills: validation.data.skills,
        certifications: validation.data.certifications || []
      }
    });

    // generate embedding in background — don't block the response
    generateEmbedding(`Skills: ${validation.data.skills.join(", ")}`)
      .then((embeddingVector) => {
        const vectorString = JSON.stringify(embeddingVector);
        return prisma.$executeRaw`
          UPDATE "EngineerProfile"
          SET embedding = ${vectorString}::vector
          WHERE "userId" = ${user.id}
        `;
      })
      .catch((err) => console.error("[embedding PUT]", err));

    return NextResponse.json({ success: true, message: "Profile updated successfully" }, { status: 200 });

  } catch (err) {
    console.error("[engineer/profile PUT]", err);
    return NextResponse.json({ success: false, message: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}