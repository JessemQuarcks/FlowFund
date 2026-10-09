import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  HeartHandshake,
  LineChart,
  Lock,
  MoveRight,
  Rocket,
  ShieldCheck,
  Sparkles,
  Timer,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { CountUp } from "@/components/count-up";
import { AnimatedProgress } from "@/components/animated-progress";
import {
  CampaignCard,
  type CampaignCardData,
} from "@/components/campaign-card";
import { featuredEvents, platformStats } from "@/lib/services/events";
import { formatMoney } from "@/lib/money";

const compactGHS = (pesewas: number) =>
  new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(pesewas / 100);

const HOW_IT_WORKS = [
  {
    icon: Rocket,
    title: "Create your campaign",
    body: "Tell your story, set a goal and add a cover photo in minutes. No fees to start.",
  },
  {
    icon: HeartHandshake,
    title: "Share and raise",
    body: "Share your link anywhere. Supporters give securely with card or mobile money.",
  },
  {
    icon: Wallet,
    title: "Withdraw to your account",
    body: "Funds settle to your verified bank or MoMo account after your campaign ends.",
  },
];

const TRUST = [
  {
    icon: BadgeCheck,
    title: "Verified organisers",
    body: "Campaigns from verified organisers carry a badge so donors give with confidence.",
  },
  {
    icon: Lock,
    title: "Secure payments",
    body: "Every donation is processed by Paystack. We never touch or store card details.",
  },
  {
    icon: LineChart,
    title: "Transparent ledger",
    body: "Every cedi raised and withdrawn is recorded and reconciled to the pesewa.",
  },
  {
    icon: Timer,
    title: "Fast, fair payouts",
    body: "Withdraw to bank or mobile money with a clear, flat platform fee — no surprises.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "We rebuilt ten market stalls in under two weeks. FlowFund made it easy for people everywhere to help.",
    name: "Esi Bonsu",
    role: "Kejetia traders' fund",
  },
  {
    quote:
      "The transparency won people over. Donors could see exactly where every cedi went.",
    name: "Kwame Nkansah",
    role: "Osu Community School",
  },
  {
    quote:
      "Mobile money payouts landed the same week. I could focus on Ama's treatment, not paperwork.",
    name: "Ama Serwaa",
    role: "Help Ama Beat Leukemia",
  },
];

export default async function Home() {
  const [featured, stats] = await Promise.all([
    featuredEvents(6),
    platformStats(),
  ]);

  const cards: CampaignCardData[] = featured
    .filter((e) => e.fundraiser)
    .map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      category: e.category,
      image: e.fundraiser!.image,
      raisedAmount: e.fundraiser!.raisedAmount,
      targetAmount: e.fundraiser!.targetAmount,
      currency: e.fundraiser!.currency,
      donorCount: e.fundraiser!.donorCount,
      endDate: e.fundraiser!.endDate,
      organiserName: e.user?.name,
      verified: e.user?.isVerifiedOrganiser,
    }));

  const hero = cards[0];
  const heroPct = hero
    ? Math.min(100, Math.round((hero.raisedAmount / hero.targetAmount) * 100))
    : 0;

  return (
    <div className="flex flex-col">
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden hero-pattern">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="container relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-2">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-4 py-1.5 text-sm font-medium text-primary-700 shadow-sm backdrop-blur dark:text-primary-300">
              <Sparkles className="h-4 w-4" />
              Verified · Secure · Transparent
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl xl:text-6xl">
              Fund what matters,{" "}
              <span className="brand-text-gradient">together</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Raise money for medical bills, school fees, emergencies and
              community projects across Ghana. Start in minutes, share
              everywhere, and withdraw securely.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/events/create">
                <Button size="lg" variant="gradient" className="group gap-2">
                  Start a fundraiser
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/events">
                <Button size="lg" variant="outline" className="gap-2">
                  Explore campaigns <MoveRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-3">
                {["a", "b", "c", "d"].map((s) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={s}
                    src={`https://picsum.photos/seed/donor-${s}/80/80`}
                    alt=""
                    className="h-10 w-10 rounded-full border-2 border-background object-cover"
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Join{" "}
                <span className="font-semibold text-foreground">
                  <CountUp end={stats.donors} />+
                </span>{" "}
                donors already giving
              </p>
            </div>
          </div>

          {/* Floating featured preview */}
          {hero && (
            <div className="relative lg:pl-8">
              <div className="animate-float rounded-3xl border bg-card p-3 shadow-elevated">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={hero.image || "/placeholder.svg"}
                  alt={hero.title}
                  className="aspect-[16/11] w-full rounded-2xl object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-primary-700 dark:text-primary-300">
                    <BadgeCheck className="h-4 w-4" />
                    {hero.verified ? "Verified organiser" : "Live campaign"}
                  </div>
                  <h3 className="mt-1 line-clamp-1 text-lg font-semibold">
                    {hero.title}
                  </h3>
                  <div className="mt-3">
                    <AnimatedProgress value={heroPct} />
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="font-semibold">
                        {formatMoney(hero.raisedAmount, hero.currency)}
                      </span>
                      <span className="text-muted-foreground">
                        {heroPct}% funded
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-3 hidden rounded-2xl border bg-card px-4 py-3 shadow-elevated sm:block">
                <p className="text-xs text-muted-foreground">Raised so far</p>
                <p className="text-lg font-bold brand-text-gradient">
                  <CountUp
                    end={stats.totalRaised / 100}
                    format={() => compactGHS(stats.totalRaised)}
                  />
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ---------- Stats band ---------- */}
      <section className="border-y bg-muted/30">
        <div className="container grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
          {[
            {
              label: "Raised on FlowFund",
              node: (
                <CountUp
                  end={stats.totalRaised / 100}
                  format={() => compactGHS(stats.totalRaised)}
                />
              ),
            },
            {
              label: "Active campaigns",
              node: <CountUp end={stats.campaigns} />,
            },
            {
              label: "Generous donors",
              node: (
                <>
                  <CountUp end={stats.donors} />+
                </>
              ),
            },
            { label: "Payment uptime", node: <>99.9%</> },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 80} className="text-center">
              <div className="text-3xl font-bold tracking-tight brand-text-gradient sm:text-4xl">
                {s.node}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {s.label}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Featured campaigns ---------- */}
      <section className="container py-16 md:py-24">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="brand-text-gradient">Featured</span> fundraisers
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Real causes making a difference in communities across Ghana right
              now.
            </p>
          </div>
          <Link href="/events">
            <Button variant="outline" className="gap-2">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={c.id} delay={(i % 3) * 90}>
              <CampaignCard campaign={c} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="border-y bg-muted/30">
        <div className="container py-16 md:py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How <span className="brand-text-gradient">FlowFund</span> works
            </h2>
            <p className="mt-3 text-muted-foreground">
              From idea to payout in three simple steps.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <Reveal key={step.title} delay={i * 100}>
                <div className="relative h-full rounded-2xl border bg-card p-6 shadow-soft">
                  <div className="brand-gradient mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-soft">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <span className="absolute right-5 top-5 text-4xl font-bold text-primary-100 dark:text-primary-900/60">
                    {i + 1}
                  </span>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Trust & safety ---------- */}
      <section className="container py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium text-primary-700 dark:text-primary-300">
              <ShieldCheck className="h-4 w-4" /> Trust &amp; safety
            </span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Built so donors give with confidence
            </h2>
            <p className="mt-4 text-muted-foreground">
              Trust is everything in giving. FlowFund verifies organisers,
              secures every payment and keeps a transparent record of where the
              money goes — so your generosity reaches the people who need it.
            </p>
            <Link href="/events" className="mt-6 inline-block">
              <Button variant="gradient" className="gap-2">
                Find a cause to support <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2">
            {TRUST.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <div className="h-full rounded-2xl border bg-card p-5 shadow-soft card-hover">
                  <f.icon className="h-6 w-6 text-primary-600" />
                  <h3 className="mt-3 font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {f.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Testimonials ---------- */}
      <section className="border-y bg-muted/30">
        <div className="container py-16 md:py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Loved by organisers and donors
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 90}>
                <figure className="flex h-full flex-col rounded-2xl border bg-card p-6 shadow-soft">
                  <div className="text-4xl leading-none text-primary-300">
                    “
                  </div>
                  <blockquote className="-mt-2 flex-1 text-sm leading-relaxed">
                    {t.quote}
                  </blockquote>
                  <figcaption className="mt-4 border-t pt-4">
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.role}
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Final CTA ---------- */}
      <section className="container py-16 md:py-24">
        <Reveal className="brand-gradient animate-gradient relative overflow-hidden rounded-3xl px-8 py-14 text-center text-white shadow-glow md:py-20">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Your cause deserves to be heard
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/90">
              Start a fundraiser in minutes. It&apos;s free to create, and
              you&apos;ll have the tools to reach your goal.
            </p>
            <Link href="/events/create" className="mt-8 inline-block">
              <Button
                size="lg"
                className="gap-2 bg-white text-primary-700 hover:bg-white/90"
              >
                Start your fundraiser <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
