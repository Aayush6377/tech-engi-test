"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ProjectDetailsPage() {
  const { projectId } = useParams();

  const [project, setProject] = useState<any>(null);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/invitations`);
      const json = await res.json();

      setProject(json.project);
      setInvitations(json.invitations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (
    invitationId: string,
    action: "APPROVE" | "REJECT"
  ) => {
    try {
      await fetch(`/api/admin/invitations/${invitationId}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });

      fetchData(); // refresh
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;
  if (!project) return <p className="p-6">Project not found</p>;

  return (
    <DashboardShell>
      <div className="p-6 space-y-6">

        {/* PROJECT */}
        <Card>
          <CardHeader>
            <CardTitle>Project</CardTitle>
          </CardHeader>
          <CardContent>
            <h2 className="text-xl font-bold">{project.title}</h2>
            <p className="text-muted-foreground">{project.description}</p>

            <div className="flex gap-3 mt-3">
              <Badge>{project.status}</Badge>
              <Badge variant="outline">₹{project.budget}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* INVITATIONS */}
        <Card>
          <CardHeader>
            <CardTitle>Invited Engineers</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {invitations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No invitations yet
              </p>
            ) : (
              invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex justify-between items-center border p-3 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {inv.engineer.user.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {inv.engineer.user.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge>{inv.status}</Badge>

                    {inv.status === "PENDING_ADMIN" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleAction(inv.id, "APPROVE")
                          }
                        >
                          Approve
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleAction(inv.id, "REJECT")
                          }
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardShell>
  );
}