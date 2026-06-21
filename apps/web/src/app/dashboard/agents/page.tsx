"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, ShieldCheck, UserX, UserCheck } from "lucide-react";
import { useForm } from "react-hook-form";

interface Agent {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [open, setOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: { email: "", firstName: "", lastName: "", role: "agent" },
  });

  async function load() {
    try {
      const res = await api.get("/agents");
      setAgents(res.data.data ?? []);
    } catch {
      setAgents([]);
    }
  }
  useEffect(() => { load(); }, []);

  async function onInvite(data: any) {
    setInviting(true);
    try {
      await api.post("/agents/invite", data);
      reset();
      setOpen(false);
      await load();
    } finally {
      setInviting(false);
    }
  }

  async function toggleActive(agent: Agent) {
    const ep = agent.isActive ? "deactivate" : "activate";
    await api.patch(`/agents/${agent.id}/${ep}`);
    await load();
  }

  async function changeRole(id: string, role: string) {
    await api.patch(`/agents/${id}/role`, { role });
    await load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Agents</h1>
          <p className="text-muted-foreground mt-1">Manage your support team</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="w-4 h-4 mr-2" />Invite Agent</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a new agent</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onInvite)} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>First name</Label>
                  <Input {...register("firstName")} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Last name</Label>
                  <Input {...register("lastName")} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" {...register("email")} required />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={watch("role")} onValueChange={v => setValue("role", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={inviting}>{inviting ? "Inviting..." : "Send invite"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  No agents yet. Invite your first team member.
                </TableCell>
              </TableRow>
            ) : agents.map(agent => (
              <TableRow key={agent.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{agent.firstName[0]}{agent.lastName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{agent.firstName} {agent.lastName}</div>
                      <div className="text-xs text-muted-foreground">{agent.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">{agent.role}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={agent.isActive ? "success" : "secondary"}>
                    {agent.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(agent.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => toggleActive(agent)}
                      title={agent.isActive ? "Deactivate" : "Activate"}>
                      {agent.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon"
                      onClick={() => changeRole(agent.id, agent.role === "agent" ? "admin" : "agent")}
                      title="Toggle role">
                      <ShieldCheck className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
