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
import { Badge } from "@/components/ui/badge";
import { AdminAction } from "@/components/admin/admin-action";
import {
  AdminTabs,
  AdminTabsContent,
  AdminTabsList,
  AdminTabsTrigger,
} from "@/components/admin/admin-tabs";
import {
  AdminQueueFilters,
  AdminQueuePagination,
} from "@/components/admin/admin-queue-controls";
import {
  parseAdminQueueParams,
  type RawAdminSearchParams,
} from "@/schemas/admin";
import { listAdminVerifications } from "@/lib/services/verification";
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

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<RawAdminSearchParams>;
}) {
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

  const params = parseAdminQueueParams(await searchParams);
  const [stats, verifications, reports, campaigns, users] = await Promise.all([
    adminStats(),
    listAdminVerifications({
      q: params.q,
      page: params.page,
      status: params.verificationStatus,
    }),
    listReports({
      q: params.q,
      page: params.page,
      status: params.reportStatus,
    }),
    adminListCampaigns({
      q: params.q,
      page: params.page,
      status: params.campaignStatus,
    }),
    adminListUsers({
      q: params.q,
      page: params.page,
      verificationStatus: params.verificationStatus,
      banned: params.banned,
    }),
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

      <AdminTabs activeTab={params.tab}>
        <AdminTabsList>
          <AdminTabsTrigger value="verifications">
            Verifications ({verifications.total})
          </AdminTabsTrigger>
          <AdminTabsTrigger value="reports">
            Reports ({reports.total})
          </AdminTabsTrigger>
          <AdminTabsTrigger value="campaigns">
            Campaigns ({campaigns.total})
          </AdminTabsTrigger>
          <AdminTabsTrigger value="users">
            Users ({users.total})
          </AdminTabsTrigger>
        </AdminTabsList>

        {/* Verifications */}
        <AdminTabsContent value="verifications" className="pt-4">
          <AdminQueueFilters
            tab="verifications"
            q={params.q}
            filters={[
              {
                label: "Verification status",
                name: "verificationStatus",
                value: params.verificationStatus,
                options: [
                  { value: "PENDING", label: "Pending" },
                  { value: "VERIFIED", label: "Verified" },
                  { value: "REJECTED", label: "Rejected" },
                  { value: "all", label: "All statuses" },
                ],
              },
            ]}
          />
          {verifications.items.length === 0 ? (
            <Empty>No verifications match these filters.</Empty>
          ) : (
            <div className="space-y-3">
              {verifications.items.map((v) => (
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
          <AdminQueuePagination
            tab="verifications"
            q={params.q}
            filters={[
              {
                name: "verificationStatus",
                value: params.verificationStatus,
              },
            ]}
            page={verifications.page}
            total={verifications.total}
            totalPages={verifications.totalPages}
            perPage={verifications.perPage}
          />
        </AdminTabsContent>

        {/* Reports */}
        <AdminTabsContent value="reports" className="pt-4">
          <AdminQueueFilters
            tab="reports"
            q={params.q}
            filters={[
              {
                label: "Report status",
                name: "reportStatus",
                value: params.reportStatus,
                options: [
                  { value: "OPEN", label: "Open" },
                  { value: "ACTIONED", label: "Actioned" },
                  { value: "DISMISSED", label: "Dismissed" },
                  { value: "all", label: "All statuses" },
                ],
              },
            ]}
          />
          {reports.items.length === 0 ? (
            <Empty>No reports match these filters.</Empty>
          ) : (
            <div className="space-y-3">
              {reports.items.map((r) => (
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
                  <details className="w-full border-t pt-3">
                    <summary className="cursor-pointer text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      Review campaign and organiser context
                    </summary>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <section className="space-y-2 rounded-lg bg-muted/40 p-4">
                        <h3 className="font-semibold">Campaign</h3>
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                          {r.event.description}
                        </p>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <ContextField
                            label="Category"
                            value={r.event.category.toLowerCase()}
                          />
                          <ContextField
                            label="Created"
                            value={formatAdminDate(r.event.dateAdded)}
                          />
                          <ContextField
                            label="Campaign date"
                            value={formatAdminDate(r.event.date)}
                          />
                          <ContextField
                            label="Last updated"
                            value={formatAdminDate(r.event.dateUpdated)}
                          />
                          <ContextField
                            label="Updates posted"
                            value={String(r.event._count.updates)}
                          />
                          <ContextField
                            label="Total reports"
                            value={String(r.event._count.reports)}
                          />
                        </dl>
                        {r.event.fundraiser && (
                          <div className="border-t pt-3">
                            <h4 className="text-sm font-medium">
                              Fundraising activity
                            </h4>
                            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                              <ContextField
                                label="Raised"
                                value={formatMoney(
                                  r.event.fundraiser.raisedAmount,
                                  r.event.fundraiser.currency,
                                )}
                              />
                              <ContextField
                                label="Target"
                                value={formatMoney(
                                  r.event.fundraiser.targetAmount,
                                  r.event.fundraiser.currency,
                                )}
                              />
                              <ContextField
                                label="Donors"
                                value={String(r.event.fundraiser.donorCount)}
                              />
                              <ContextField
                                label="Withdrawn"
                                value={formatMoney(
                                  r.event.fundraiser.totalWithdrawn,
                                  r.event.fundraiser.currency,
                                )}
                              />
                              <ContextField
                                label="Fundraising ends"
                                value={formatAdminDate(
                                  r.event.fundraiser.endDate,
                                )}
                              />
                            </dl>
                          </div>
                        )}
                        <Link
                          href={`/events/${r.event.id}`}
                          className="inline-block text-sm font-medium text-primary hover:underline"
                        >
                          Open public campaign
                        </Link>
                      </section>

                      <div className="space-y-4">
                        <section className="space-y-2 rounded-lg bg-muted/40 p-4">
                          <h3 className="font-semibold">Organiser</h3>
                          <p className="text-sm">
                            {r.event.user.name ?? "Name not provided"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {r.event.user.email}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <StatusBadge
                              status={r.event.user.verificationStatus}
                            />
                            {r.event.user.isBanned && (
                              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                                banned
                              </span>
                            )}
                            {r.event.user.isVerifiedOrganiser && (
                              <Badge variant="secondary">
                                verified organiser
                              </Badge>
                            )}
                          </div>
                          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <ContextField
                              label="Account created"
                              value={formatAdminDate(r.event.user.dateAdded)}
                            />
                            <ContextField
                              label="Campaigns"
                              value={String(r.event.user._count.events)}
                            />
                          </dl>
                          <Link
                            href={`/admin?tab=users&q=${encodeURIComponent(r.event.user.email)}`}
                            className="inline-block text-sm font-medium text-primary hover:underline"
                          >
                            Find organiser in users
                          </Link>
                        </section>

                        <section className="space-y-2 rounded-lg bg-muted/40 p-4">
                          <h3 className="font-semibold">
                            Recent report history
                          </h3>
                          {r.event.reports.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No reports found.
                            </p>
                          ) : (
                            <ul className="space-y-2">
                              {r.event.reports.map((report) => (
                                <li
                                  key={report.id}
                                  className="flex items-start justify-between gap-3 border-b pb-2 last:border-0 last:pb-0"
                                >
                                  <div>
                                    <p className="text-sm font-medium">
                                      {report.reason}
                                    </p>
                                    {report.details && (
                                      <p className="text-sm text-muted-foreground">
                                        {report.details}
                                      </p>
                                    )}
                                    <time
                                      dateTime={report.dateAdded.toISOString()}
                                      className="text-xs text-muted-foreground"
                                    >
                                      {formatAdminDate(report.dateAdded)}
                                    </time>
                                  </div>
                                  <StatusBadge status={report.status} />
                                </li>
                              ))}
                            </ul>
                          )}
                          {r.event._count.reports > r.event.reports.length && (
                            <p className="text-xs text-muted-foreground">
                              Showing the 5 most recent reports.
                            </p>
                          )}
                        </section>
                      </div>
                    </div>
                  </details>
                </Row>
              ))}
            </div>
          )}
          <AdminQueuePagination
            tab="reports"
            q={params.q}
            filters={[
              {
                name: "reportStatus",
                value: params.reportStatus,
              },
            ]}
            page={reports.page}
            total={reports.total}
            totalPages={reports.totalPages}
            perPage={reports.perPage}
          />
        </AdminTabsContent>

        {/* Campaigns */}
        <AdminTabsContent value="campaigns" className="pt-4">
          <AdminQueueFilters
            tab="campaigns"
            q={params.q}
            filters={[
              {
                label: "Campaign status",
                name: "campaignStatus",
                value: params.campaignStatus,
                options: [
                  { value: "all", label: "All statuses" },
                  { value: "DRAFT", label: "Draft" },
                  { value: "PENDING_REVIEW", label: "Pending review" },
                  { value: "ACTIVE", label: "Active" },
                  { value: "ENDED", label: "Ended" },
                  { value: "SUSPENDED", label: "Suspended" },
                ],
              },
            ]}
          />
          {campaigns.items.length === 0 ? (
            <Empty>No campaigns match these filters.</Empty>
          ) : (
            <div className="space-y-3">
              {campaigns.items.map((c) => (
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
          )}
          <AdminQueuePagination
            tab="campaigns"
            q={params.q}
            filters={[
              {
                name: "campaignStatus",
                value: params.campaignStatus,
              },
            ]}
            page={campaigns.page}
            total={campaigns.total}
            totalPages={campaigns.totalPages}
            perPage={campaigns.perPage}
          />
        </AdminTabsContent>

        {/* Users */}
        <AdminTabsContent value="users" className="pt-4">
          <AdminQueueFilters
            tab="users"
            q={params.q}
            filters={[
              {
                label: "Verification",
                name: "verificationStatus",
                value: params.verificationStatus,
                options: [
                  { value: "all", label: "All statuses" },
                  { value: "UNVERIFIED", label: "Unverified" },
                  { value: "PENDING", label: "Pending" },
                  { value: "VERIFIED", label: "Verified" },
                  { value: "REJECTED", label: "Rejected" },
                ],
              },
              {
                label: "Account status",
                name: "banned",
                value: params.banned,
                options: [
                  { value: "all", label: "All accounts" },
                  { value: "active", label: "Active" },
                  { value: "banned", label: "Banned" },
                ],
              },
            ]}
          />
          {users.items.length === 0 ? (
            <Empty>No users match these filters.</Empty>
          ) : (
            <div className="space-y-3">
              {users.items.map((u) => (
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
          )}
          <AdminQueuePagination
            tab="users"
            q={params.q}
            filters={[
              {
                name: "verificationStatus",
                value: params.verificationStatus,
              },
              {
                name: "banned",
                value: params.banned,
              },
            ]}
            page={users.page}
            total={users.total}
            totalPages={users.totalPages}
            perPage={users.perPage}
          />
        </AdminTabsContent>
      </AdminTabs>
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

function ContextField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function formatAdminDate(date: Date) {
  return date.toLocaleDateString("en-GH", { dateStyle: "medium" });
}
