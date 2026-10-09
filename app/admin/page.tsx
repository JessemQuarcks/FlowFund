import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  Flag,
  ShieldAlert,
  Users,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AdminAction } from "@/components/admin/admin-action";
import { listPendingVerifications } from "@/lib/services/verification";
import {
  adminListCampaigns,
  adminListUsers,
  adminStats,
  listReports,
} from "@/lib/services/moderation";

export const metadata = { title: "Admin console" };

function StatusBadge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    ACTIVE:
      "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300",
    SUSPENDED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    VERIFIED:
      "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300",
    PENDING:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    UNVERIFIED: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tone[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {status.toLowerCase()}
    </span>
  );
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/signin");
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (me?.role !== "ADMIN") {
    return (
      <div className="container py-20 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Admins only</h1>
        <p className="mt-2 text-muted-foreground">
          You don&apos;t have access to the moderation console.
        </p>
      </div>
    );
  }

  const [stats, verifications, reports, campaigns, users] = await Promise.all([
    adminStats(),
    listPendingVerifications(),
    listReports("OPEN"),
    adminListCampaigns(),
    adminListUsers(),
  ]);

  const tiles = [
    {
      label: "Pending verifications",
      value: stats.pendingVerifications,
      icon: BadgeCheck,
    },
    { label: "Open reports", value: stats.openReports, icon: Flag },
    { label: "Suspended campaigns", value: stats.suspended, icon: Ban },
    { label: "Total users", value: stats.users, icon: Users },
  ];

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="brand-gradient flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-soft">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Moderation console
          </h1>
          <p className="text-sm text-muted-foreground">
            Review organisers, campaigns and reports.
          </p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="shadow-soft">
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/40">
                <t.icon className="h-5 w-5" />
              </span>
              <div>
                <div className="text-2xl font-bold">{t.value}</div>
                <div className="text-xs text-muted-foreground">{t.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="verifications">
        <TabsList>
          <TabsTrigger value="verifications">
            Verifications ({verifications.length})
          </TabsTrigger>
          <TabsTrigger value="reports">Reports ({reports.length})</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        {/* Verifications */}
        <TabsContent value="verifications" className="pt-4">
          {verifications.length === 0 ? (
            <Empty>No pending verifications.</Empty>
          ) : (
            <div className="space-y-3">
              {verifications.map((v) => (
                <Row key={v.id}>
                  <div className="min-w-0">
                    <div className="font-medium">{v.fullName}</div>
                    <div className="truncate text-sm text-muted-foreground">
                      {v.user.email} · {v.idType} {v.idNumber} · {v.phone}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <AdminAction
                      url={`/api/admin/verifications/${v.id}`}
                      body={{ decision: "approve" }}
                      label="Approve"
                      variant="gradient"
                      successText="Organiser verified"
                    />
                    <AdminAction
                      url={`/api/admin/verifications/${v.id}`}
                      body={{ decision: "reject" }}
                      label="Reject"
                      confirmText="Reject this verification?"
                    />
                  </div>
                </Row>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Reports */}
        <TabsContent value="reports" className="pt-4">
          {reports.length === 0 ? (
            <Empty>No open reports.</Empty>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <Row key={r.id}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <Link
                        href={`/events/${r.event.id}`}
                        className="font-medium hover:underline"
                      >
                        {r.event.title}
                      </Link>
                      <StatusBadge status={r.event.status} />
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      <span className="font-medium">{r.reason}</span>
                      {r.details ? ` — ${r.details}` : ""}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <AdminAction
                      url={`/api/admin/reports/${r.id}`}
                      body={{ action: "suspend" }}
                      label="Suspend campaign"
                      variant="destructive"
                      confirmText="Suspend this campaign?"
                      successText="Campaign suspended"
                    />
                    <AdminAction
                      url={`/api/admin/reports/${r.id}`}
                      body={{ action: "dismiss" }}
                      label="Dismiss"
                    />
                  </div>
                </Row>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Campaigns */}
        <TabsContent value="campaigns" className="pt-4">
          <div className="space-y-3">
            {campaigns.map((c) => (
              <Row key={c.id}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/events/${c.id}`}
                      className="truncate font-medium hover:underline"
                    >
                      {c.title}
                    </Link>
                    <StatusBadge status={c.status} />
                    {c._count.reports > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <Flag className="h-3 w-3" /> {c._count.reports}
                      </Badge>
                    )}
                  </div>
                  <div className="truncate text-sm text-muted-foreground">
                    {c.user.name} ·{" "}
                    {c.fundraiser
                      ? `${formatMoney(c.fundraiser.raisedAmount, c.fundraiser.currency)} raised`
                      : "no fundraiser"}
                  </div>
                </div>
                {c.status === "SUSPENDED" ? (
                  <AdminAction
                    url={`/api/admin/campaigns/${c.id}/status`}
                    body={{ status: "ACTIVE" }}
                    label="Reinstate"
                    variant="gradient"
                    successText="Campaign reinstated"
                  />
                ) : (
                  <AdminAction
                    url={`/api/admin/campaigns/${c.id}/status`}
                    body={{ status: "SUSPENDED" }}
                    label="Suspend"
                    variant="destructive"
                    confirmText="Suspend this campaign?"
                    successText="Campaign suspended"
                  />
                )}
              </Row>
            ))}
          </div>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users" className="pt-4">
          <div className="space-y-3">
            {users.map((u) => (
              <Row key={u.id}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">
                      {u.name ?? "—"}
                    </span>
                    {u.role === "ADMIN" && (
                      <Badge variant="secondary">admin</Badge>
                    )}
                    <StatusBadge status={u.verificationStatus} />
                    {u.isBanned && (
                      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                        banned
                      </span>
                    )}
                  </div>
                  <div className="truncate text-sm text-muted-foreground">
                    {u.email} · {u._count.events} campaigns
                  </div>
                </div>
                {u.role !== "ADMIN" &&
                  (u.isBanned ? (
                    <AdminAction
                      url={`/api/admin/users/${u.id}/ban`}
                      body={{ banned: false }}
                      label="Unban"
                      variant="gradient"
                      successText="User unbanned"
                    />
                  ) : (
                    <AdminAction
                      url={`/api/admin/users/${u.id}/ban`}
                      body={{ banned: true }}
                      label="Ban"
                      variant="destructive"
                      confirmText="Ban this user?"
                      successText="User banned"
                    />
                  ))}
              </Row>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-soft">
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card py-12 text-center text-sm text-muted-foreground shadow-soft">
      {children}
    </div>
  );
}
