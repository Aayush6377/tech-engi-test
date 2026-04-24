import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClient } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const { user, error } = await getClient();
    if (error || !user?.clientProfile) {
      return NextResponse.json(
        { success: false, message: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch project with transactions and resources
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: user.clientProfile.id
      },
      include: {
        resources: {
          where: { type: 'FILE' }
        },
        transactions: {
          where: { status: 'SUCCESS' },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found or unauthorized' },
        { status: 404 }
      );
    }

    // Calculate paid amounts
    const paidAmount = project.transactions
      .filter(t => ['ADVANCE_PAYMENT', 'FINAL_PAYMENT'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);

    const paidPercentage = project.budget > 0
      ? Math.round((paidAmount / project.budget) * 100) : 0;
      
    const remainingAmount = project.budget - paidAmount;
    const progress = project.progress || 0;

    // Format docs from resources
    const docs = project.resources.map(r => ({
      id: r.id,
      title: r.title,
      url: r.content,
      type: 'document',
      createdAt: r.createdAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      data: {
        scopeTitle: project.title,
        scopeDate: project.startDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        paymentDate: project.endDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        invoiceName: `Invoice-${project.id.substring(0, 8)}`,
        paidAmount: Math.round(paidAmount * 100) / 100,
        remainingAmount: Math.round(Math.max(0, remainingAmount) * 100) / 100,
        totalBudget: project.budget,
        progress,
        paidPercentage,
        remainingPercentage: 100 - paidPercentage,
        docs
      }
    });

  } catch (error) {
    console.error('Error fetching budget:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch budget data' },
      { status: 500 }
    );
  }
}


export async function POST(req: Request) {
  try {
    const { projectId, budget, clientName, projectType, startDate, deadline, supervisorAdmin } = await req.json();

    const projectInfo = await db.projectInfo.create({
      data: {
        projectId,
        budget,
        paidAmount: 0,
        clientName,
        projectType,
        startDate: new Date(startDate),
        deadline: new Date(deadline),
        supervisorAdmin
      }
    });

    return NextResponse.json({ success: true, data: projectInfo });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to create budget info" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const formData = await req.formData();
    const clientId = formData.get("clientId") as string;
    const projectId = formData.get("projectId") as string;
    const paidAmount = Number(formData.get("paidAmount"));
    const totalBudget = Number(formData.get("totalBudget"));

    const latestInvoice = formData.get("latestInvoice") as File | null;
    const scopeTitle = formData.get("scopeTitle") as File | null;

    const paymentHistoryFiles: File[] = [];
    let i = 0;
    while (formData.get(`paymentHistory_${i}`)) {
      paymentHistoryFiles.push(formData.get(`paymentHistory_${i}`) as File);
      i++;
    }

    // Update specific project budget
    await db.projectInfo.updateMany({
      where: { projectId },
      data: { budget: totalBudget, paidAmount }
    });

    const docsToSave = [];

    if (latestInvoice) {
      const buffer = Buffer.from(await latestInvoice.arrayBuffer());
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: "auto" },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        ).end(buffer);
      });

      docsToSave.push({
        title: `Invoice - ${latestInvoice.name}`,
        fileUrl: (uploadResult as any).secure_url,
        projectId,
        userId: clientId,
      });
    }

    if (scopeTitle) {
      const buffer = Buffer.from(await scopeTitle.arrayBuffer());
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: "auto" },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        ).end(buffer);
      });

      docsToSave.push({
        title: `Scope - ${scopeTitle.name}`,
        fileUrl: (uploadResult as any).secure_url,
        projectId,
        userId: clientId,
      });
    }

    for (const f of paymentHistoryFiles) {
      const buffer = Buffer.from(await f.arrayBuffer());
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: "auto" },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        ).end(buffer);
      });

      docsToSave.push({
        title: `Payment History - ${f.name}`,
        fileUrl: (uploadResult as any).secure_url,
        projectId,
        userId: clientId,
      });
    }

    if (docsToSave.length > 0) {
      await db.docs.createMany({ data: docsToSave });
    }

    return NextResponse.json({ success: true, message: "Updated successfully" });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Update failed" }, { status: 500 });
  }
}