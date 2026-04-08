import { Ollama } from "ollama";
import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/embeddings";

const ollama = new Ollama();

export async function getTopMatches(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return [];

  const projectRequirementText = `Required Skills: ${project.instruments.join(", ")}`;
  const projectVector = await generateEmbedding(projectRequirementText);
  const vectorString = JSON.stringify(projectVector); 

  const candidatePool: any[] = await prisma.$queryRaw`
    SELECT e.id, e.skills, e."completedProjects", e.qualification, e."createdAt"
    FROM "EngineerProfile" e
    JOIN "User" u ON e."userId" = u.id
    WHERE e.status = 'APPROVED'
    
    AND u."lastActiveAt" >= NOW() - INTERVAL '180 days'
  
    AND e.id NOT IN (
      SELECT "engineerId" 
      FROM "ProjectInvitation" 
      WHERE "projectId" = ${projectId}
    )
    
    AND e.id NOT IN (
      SELECT "engineerId" 
      FROM "Project" 
      WHERE status = ('IN_PROGRESS', 'IN_REVIEW')
      AND "engineerId" IS NOT NULL
    )
    
    ORDER BY e.embedding <=> ${vectorString}::vector
    LIMIT 40;
  `;

  if (candidatePool.length === 0) return [];

  const veterans = candidatePool.filter(e => e.completedProjects > 0);
  const wildcards = candidatePool.filter(e => e.completedProjects === 0);

  const veteransToTake = Math.min(veterans.length, 16);
  const wildcardsToTake = Math.min(wildcards.length, 20 - veteransToTake);

  const finalCandidates = [
    ...veterans.slice(0, veteransToTake),
    ...wildcards.slice(0, wildcardsToTake)
  ];

  if (finalCandidates.length === 0) return [];

  const prompt = `
    Project: ${project.title}
    Details: ${project.description}
    Needs: ${project.instruments.join(", ")}

    Evaluate these ${finalCandidates.length} highly relevant engineers and pick the top 5 absolute best matches:
    ${finalCandidates.map(e => 
      `ID: ${e.id} | Skills: ${e.skills.join(", ")} | Qualification: ${e.qualification} | Completed Projects: ${e.completedProjects}`
    ).join("\n")}

    Task Guidelines:
    1. Primary match is based on 'Skills' aligning with project 'Needs'.
    2. Consider their 'Qualification' level.
    3. BALANCE EXPERIENCE: Try to select a mix of proven engineers (Completed Projects > 0) and highly-skilled newcomers (Completed Projects = 0) to give new talent a chance.

    Task: Return a JSON object with a single key called "ids" containing an array of the 5 selected engineer IDs.
    Example: { "ids": ["id1", "id2", "id3"] }
  `;

  try {
    const response = await ollama.chat({
      model: 'llama3',
      messages: [{ role: 'user', content: prompt }],
      format: 'json'
    });

    const rawText = response.message.content;
    
    const jsonMatch = rawText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const result = JSON.parse(jsonMatch[0]);
    
    let matchedIds: string[] = [];
    
    if (Array.isArray(result)) matchedIds = result;
    else if (result.ids && Array.isArray(result.ids)) matchedIds = result.ids;
    else {
      const possibleArray = Object.values(result).find(Array.isArray);
      if (possibleArray) matchedIds = possibleArray as string[];
    }

    if (matchedIds.length === 0) throw new Error("Could not extract array");

    return matchedIds.slice(0, 5);
    
  } catch {
    return finalCandidates.slice(0, 5).map(e => e.id);
  }
}