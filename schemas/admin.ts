export const ADMIN_QUEUE_PAGE_SIZE = 20;

export type RawAdminSearchParams = Record<
  string,
  string | string[] | undefined
>;

const TABS = ["verifications", "reports", "campaigns", "users"] as const;
const REPORT_STATUSES = ["OPEN", "ACTIONED", "DISMISSED"] as const;
const CAMPAIGN_STATUSES = [
  "DRAFT",
  "PENDING_REVIEW",
  "ACTIVE",
  "ENDED",
  "SUSPENDED",
] as const;
const VERIFICATION_STATUSES = [
  "UNVERIFIED",
  "PENDING",
  "VERIFIED",
  "REJECTED",
] as const;

export type AdminTab = (typeof TABS)[number];
export type ReportStatusFilter = (typeof REPORT_STATUSES)[number] | "all";
export type CampaignStatusFilter = (typeof CAMPAIGN_STATUSES)[number] | "all";
export type VerificationStatusFilter =
  (typeof VERIFICATION_STATUSES)[number] | "all";

export type AdminQueueParams = {
  q?: string;
  page: number;
  tab: AdminTab;
  reportStatus: ReportStatusFilter;
  campaignStatus: CampaignStatusFilter;
  verificationStatus: VerificationStatusFilter;
  banned: "all" | "banned" | "active";
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function oneOf<const T extends readonly string[]>(
  value: string | undefined,
  options: T,
): T[number] | undefined {
  return value && options.includes(value) ? (value as T[number]) : undefined;
}

export function parseAdminQueueParams(
  raw: RawAdminSearchParams,
): AdminQueueParams {
  const tab = oneOf(first(raw.tab), TABS) ?? "verifications";
  const reportStatusRaw = first(raw.reportStatus);
  let reportStatus: ReportStatusFilter = "OPEN";
  if (reportStatusRaw === "all") {
    reportStatus = "all";
  } else {
    reportStatus = oneOf(reportStatusRaw, REPORT_STATUSES) ?? "OPEN";
  }
  const campaignStatusRaw = first(raw.campaignStatus);
  let campaignStatus: CampaignStatusFilter = "all";
  if (campaignStatusRaw !== "all") {
    campaignStatus = oneOf(campaignStatusRaw, CAMPAIGN_STATUSES) ?? "all";
  }
  const verificationStatusRaw = first(raw.verificationStatus);
  let verificationStatus: VerificationStatusFilter =
    tab === "verifications" ? "PENDING" : "all";
  if (verificationStatusRaw === "all") {
    verificationStatus = "all";
  } else if (verificationStatusRaw) {
    verificationStatus =
      oneOf(verificationStatusRaw, VERIFICATION_STATUSES) ?? verificationStatus;
  }
  const bannedRaw = first(raw.banned);
  const banned =
    bannedRaw === "banned" || bannedRaw === "active" || bannedRaw === "all"
      ? bannedRaw
      : "all";
  const pageRaw = Number(first(raw.page));
  const page = Number.isSafeInteger(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  const q = first(raw.q)?.trim();

  return {
    q: q ? q.slice(0, 100) : undefined,
    page,
    tab,
    reportStatus,
    campaignStatus,
    verificationStatus,
    banned,
  };
}
