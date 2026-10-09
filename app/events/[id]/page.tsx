import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock,
  ShieldCheck,
  Tag,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DonationForm } from "@/components/donation-form";
import { DonorsList } from "@/components/donors-list";
import { EventUpdates } from "@/components/event-updates";
import { ShareButton } from "@/components/share-button";
import { ReportDialog } from "@/components/report-dialog";
import { AnimatedProgress } from "@/components/animated-progress";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CATEGORY_LABELS: Record<string, string> = {
  COMMUNITY: "Community",
  EDUCATIONAL: "Education",
  ENVIRONMENT: "Environment",
  MEDICAL: "Medical",
  NONPROFIT: "Nonprofit",
  EMERGENCY: "Emergency",
  ANIMALS: "Animals",
  OTHER: "Other",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: { fundraiser: { select: { image: true } } },
  });
  if (!event) return { title: "Event not found" };

  const description = event.description.slice(0, 160);
  const images = event.fundraiser?.image ? [event.fundraiser.image] : [];
  return {
    title: event.title,
    description,
    openGraph: { title: event.title, description, images, type: "website" },
    twitter: {
      card: images.length ? "summary_large_image" : "summary",
      title: event.title,
      description,
      images,
    },
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      fundraiser: { omit: { dateAdded: true, dateUpdated: true } },
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          isVerifiedOrganiser: true,
        },
      },
    },
  });

  const session = await getServerSession(authOptions);
  const isOwner = !!session?.user?.id && session.user.id === event?.userId;

  if (!event) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-3xl font-bold">Campaign not found</h1>
        <p className="mt-2 text-muted-foreground">
          The campaign you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/events" className="mt-6 inline-block">
          <Button variant="gradient">Browse fundraisers</Button>
        </Link>
      </div>
    );
  }

  const f = event.fundraiser;
  const progress = f
    ? Math.min(100, Math.round((f.raisedAmount / f.targetAmount) * 100))
    : 0;
  const daysLeft = f?.endDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(f.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        ),
      )
    : 0;
  const ended = daysLeft <= 0;
  const createdAt = new Date(event.dateAdded).toLocaleDateString("en-GH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const organiserInitial = (event.user?.name ?? "F").charAt(0).toUpperCase();

  return (
    <div className="container max-w-6xl py-8">
      <Link
        href="/events"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to campaigns
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr]">
        {/* ---------- Main column ---------- */}
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl border shadow-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={f?.image || "/placeholder.svg"}
              alt={event.title}
              className="aspect-[16/9] w-full object-cover"
            />
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary-700 shadow-sm backdrop-blur dark:bg-black/60 dark:text-primary-300">
              <Tag className="h-3.5 w-3.5" />
              {CATEGORY_LABELS[event.category] ?? event.category}
            </span>
          </div>

          {event.status === "SUSPENDED" && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                This campaign is under review and is not currently accepting
                donations.
              </span>
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              {event.title}
            </h1>
            <div className="flex items-center gap-1">
              <ShareButton title={event.title} />
              <ReportDialog eventId={event.id} />
            </div>
          </div>

          {/* Organiser row */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={event.user?.image || undefined} alt="" />
                <AvatarFallback className="bg-primary-100 text-xs text-primary-700">
                  {organiserInitial}
                </AvatarFallback>
              </Avatar>
              <span>
                by{" "}
                <span className="font-medium text-foreground">
                  {event.user?.name ?? "Organiser"}
                </span>
              </span>
              {event.user?.isVerifiedOrganiser && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified
                </span>
              )}
            </div>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> Created {createdAt}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {ended ? "Campaign ended" : `${daysLeft} days left`}
            </span>
          </div>

          <Tabs defaultValue="about">
            <TabsList>
              <TabsTrigger value="about">Story</TabsTrigger>
              <TabsTrigger value="donors">Donors</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
            </TabsList>
            <TabsContent value="about" className="pt-2">
              <div className="space-y-4 text-[15px] leading-relaxed text-foreground/90">
                {event.description
                  .split("\n")
                  .filter((p) => p.trim())
                  .map((para, i) => (
                    <p key={i} className="whitespace-pre-wrap">
                      {para}
                    </p>
                  ))}
              </div>
            </TabsContent>
            <TabsContent value="donors" className="pt-2">
              <DonorsList eventId={event.id} />
            </TabsContent>
            <TabsContent value="updates" className="pt-2">
              <EventUpdates eventId={event.id} isOwner={isOwner} />
            </TabsContent>
          </Tabs>
        </div>

        {/* ---------- Sticky donation column ---------- */}
        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden shadow-elevated">
            <CardContent className="space-y-5 p-6">
              <div>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold brand-text-gradient">
                    {formatMoney(f?.raisedAmount ?? 0, f?.currency)}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {progress}%
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  raised of {formatMoney(f?.targetAmount ?? 0, f?.currency)}{" "}
                  goal
                </p>
                <div className="mt-3">
                  <AnimatedProgress value={progress} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border bg-muted/40 p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-lg font-bold">
                    <Users className="h-4 w-4 text-primary-600" />
                    {(f?.donorCount ?? 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">donors</div>
                </div>
                <div className="rounded-xl border bg-muted/40 p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-lg font-bold">
                    <Clock className="h-4 w-4 text-primary-600" />
                    {ended ? "0" : daysLeft}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {ended ? "ended" : "days left"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {event.status === "SUSPENDED" ? (
            <div className="rounded-xl border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              Donations are paused while this campaign is reviewed.
            </div>
          ) : (
            <>
              <DonationForm event={event} />
              <div className="flex items-center justify-center gap-2 rounded-xl border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary-600" />
                Secure payment via Paystack ·{" "}
                {formatMoney(f?.minimumAmount ?? 0, f?.currency)} minimum
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
