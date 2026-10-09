import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Clock, Users } from "lucide-react";
import { AnimatedProgress } from "@/components/animated-progress";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

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

export type CampaignCardData = {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string | null;
  raisedAmount: number;
  targetAmount: number;
  currency: string;
  donorCount: number;
  endDate: Date | string | null;
  organiserName?: string | null;
  verified?: boolean;
};

function daysLeft(endDate: Date | string | null): number {
  if (!endDate) return 0;
  const end = new Date(endDate).getTime();
  return Math.max(0, Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24)));
}

export function CampaignCard({
  campaign,
  className,
}: {
  campaign: CampaignCardData;
  className?: string;
}) {
  const pct = campaign.targetAmount
    ? Math.min(
        100,
        Math.round((campaign.raisedAmount / campaign.targetAmount) * 100),
      )
    : 0;
  const left = daysLeft(campaign.endDate);
  const ended = left <= 0;

  return (
    <Link
      href={`/events/${campaign.id}`}
      className={cn(
        "group card-hover flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={campaign.image || "/placeholder.svg?height=400&width=640"}
          alt={campaign.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/10" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary-700 shadow-sm backdrop-blur dark:bg-black/60 dark:text-primary-300">
          {CATEGORY_LABELS[campaign.category] ?? campaign.category}
        </span>
        <span
          className={cn(
            "absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-medium text-white backdrop-blur",
            ended ? "bg-black/55" : "bg-primary-600/90",
          )}
        >
          {ended ? "Ended" : `${left} ${left === 1 ? "day" : "days"} left`}
        </span>
        {campaign.organiserName && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-medium text-white">
            <span className="opacity-90">by {campaign.organiserName}</span>
            {campaign.verified && (
              <BadgeCheck
                className="h-4 w-4 text-primary-300"
                aria-label="Verified organiser"
              />
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-1 text-lg font-semibold tracking-tight">
          {campaign.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
          {campaign.description}
        </p>

        <div className="mt-4 space-y-2">
          <AnimatedProgress value={pct} />
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">
              {formatMoney(campaign.raisedAmount, campaign.currency)}
            </span>
            <span className="text-muted-foreground">{pct}%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            raised of {formatMoney(campaign.targetAmount, campaign.currency)}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {campaign.donorCount.toLocaleString()}{" "}
            {campaign.donorCount === 1 ? "donor" : "donors"}
          </span>
          <span className="flex items-center gap-1.5 font-medium text-primary-600 transition-colors group-hover:text-primary-700">
            Donate
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
