"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Plus, Users, Copy, Check, FolderOpen, Trash2, LogOut, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  code: string;
  userRole: string;
  memberCount: number;
  owner: { name: string; email: string };
  createdAt: string;
}

interface Member {
  id: string;
  role: string;
  user: { name: string | null; email: string; image: string | null };
}

export default function ProjectsPage() {
  const sessionHook = useSession();
  const session = sessionHook?.data ?? null;
  const status = sessionHook?.status ?? "loading";
  
  const router = useRouter();
  const hasLoadedRef = useRef(false);
  const [forcedLoad, setForcedLoad] = useState(false);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [viewingMembers, setViewingMembers] = useState<string | null>(null); // ID del proyecto cuyos miembros se ven
  const [membersList, setMembersList] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  
  const [newProjectName, setNewProjectName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);

  useEffect(() => {
    if (status === "loading") {
      const timeout = setTimeout(() => setForcedLoad(true), 5000);
      return () => clearTimeout(timeout);
    }
  }, [status]);

  useEffect(() => {
    if ((status === "authenticated" || forcedLoad) && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetch("/api/projects")
        .then((res) => {
          if (res.status === 401) { router.push("/login"); return; }
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => { if (data?.projects) setProjects(data.projects); })
        .catch((error) => { console.error(error); toast.error("Could not load projects"); })
        .finally(() => {});
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, forcedLoad, router]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName }),
      });
      if (res.ok) {
        const data = await res.json();
        setProjects([data.project, ...projects]);
        setNewProjectName("");
        setShowCreateForm(false);
        toast.success("Project created!");
      } else throw new Error("Failed");
    } catch { toast.error("Error creating project"); }
    finally { setIsCreating(false); }
  };

  const handleJoinProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setIsJoining(true);
    try {
      const res = await fetch("/api/projects/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode }),
      });
      if (res.ok) {
        const data = await res.json();
        setProjects([data.project, ...projects]);
        setJoinCode("");
        setShowJoinForm(false);
        toast.success("Joined project!");
      } else {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
    } catch (error: any) { toast.error(error.message); }
    finally { setIsJoining(false); }
  };

  const handleLeaveProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to leave this project?")) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/leave`, { method: "DELETE" });
      if (res.ok) {
        setProjects(projects.filter(p => p.id !== projectId));
        toast.success("Left project successfully");
      } else {
        const err = await res.json();
        toast.error(err.error || "Error leaving project");
      }
    } catch { toast.error("Error leaving project"); }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure? This will delete the project and remove all members.")) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (res.ok) {
        setProjects(projects.filter(p => p.id !== projectId));
        toast.success("Project deleted");
      } else toast.error("Error deleting project");
    } catch { toast.error("Error deleting project"); }
  };

  const handleViewMembers = async (projectId: string) => {
    setViewingMembers(projectId);
    setIsLoadingMembers(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembersList(data.members);
      } else toast.error("Error loading members");
    } catch { toast.error("Error loading members"); }
    finally { setIsLoadingMembers(false); }
  };

  const copyCode = async (code: string, projectId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(projectId);
      toast.success("Code copied!");
      setTimeout(() => setCopiedCode(null), 2000);
    } catch { toast.error("Failed to copy"); }
  };

  if (status === "loading" && !forcedLoad) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 p-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
          <p className="text-muted-foreground">Manage your projects and collaborate with others</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setShowCreateForm(!showCreateForm); setShowJoinForm(false); }} variant="outline">
            <Plus className="mr-2 h-4 w-4" /> New Project
          </Button>
          <Button onClick={() => { setShowJoinForm(!showJoinForm); setShowCreateForm(false); }} variant="outline">
            Join Project
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader><CardTitle>Create New Project</CardTitle><CardDescription>Create a project and invite others with a unique code</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-2">
                <Label>Project Name</Label>
                <Input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="My Awesome Project" required />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isCreating}>{isCreating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create Project"}</Button>
                <Button type="button" variant="ghost" onClick={() => setShowCreateForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showJoinForm && (
        <Card>
          <CardHeader><CardTitle>Join Existing Project</CardTitle><CardDescription>Enter the project code to join</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={handleJoinProject} className="space-y-4">
              <div className="space-y-2">
                <Label>Project Code</Label>
                <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="ABC123" className="uppercase" required />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isJoining}>{isJoining ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining...</> : "Join Project"}</Button>
                <Button type="button" variant="ghost" onClick={() => setShowJoinForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {projects.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12">
          <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground">Create your first project or join an existing one</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="relative flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Users className="h-3 w-3" /> {project.memberCount} member{project.memberCount !== 1 ? "s" : ""}
                    </CardDescription>
                  </div>
                  {project.userRole === "admin" && <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">Owner</span>}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div>
                    <p className="text-xs text-muted-foreground">Invite Code</p>
                    <p className="font-mono font-bold text-lg">{project.code}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => copyCode(project.code, project.id)}>
                    {copiedCode === project.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                
                <div className="flex gap-2 mt-auto">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleViewMembers(project.id)}>
                    <Users className="mr-1 h-3 w-3" /> Members
                  </Button>
                  {project.userRole === "admin" ? (
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteProject(project.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button size="sm" variant="destructive" onClick={() => handleLeaveProject(project.id)}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Miembros */}
      {viewingMembers && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Project Members</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setViewingMembers(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingMembers ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : (
                <ul className="space-y-3">
                  {membersList.map((member) => (
                    <li key={member.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.user.image || undefined} />
                        <AvatarFallback>{member.user.name?.[0] || member.user.email[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.user.name || "Unknown User"}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${member.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {member.role}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}