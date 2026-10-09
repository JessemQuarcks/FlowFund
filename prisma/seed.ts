/**
 * Seed data for local development and demos.
 *
 * Run with: npm run db:seed  (or: npx prisma db seed)
 *
 * Clears campaign data (events, fundraisers, donations, updates, withdrawals,
 * payout accounts, audit log) and the demo accounts, then recreates a rich set
 * of campaigns. Non-demo user accounts are left untouched.
 *
 * All money is in integer pesewas (1 GHS = 100 pesewas). Counters are kept
 * consistent with the donation rows so reconciliation stays clean.
 */
import bcrypt from "bcryptjs";
import { PrismaClient, type Event_Category } from "../lib/generated/prisma";

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const ghs = (cedis: number) => Math.round(cedis * 100);
const img = (seed: string) => `https://picsum.photos/seed/${seed}/1200/800`;

const DEMO_PASSWORD = "Demo1234!";

type DonationSpec = {
  cedis: number;
  first?: string;
  last?: string;
  email?: string;
  anonymous?: boolean;
  daysAgo: number;
};

type UpdateSpec = { title: string; body: string; daysAgo: number };

type CampaignSpec = {
  slug: string;
  organiser: "ama" | "kwame" | "esi";
  title: string;
  description: string;
  category: Event_Category;
  goalCedis: number;
  endInDays: number;
  donations: DonationSpec[];
  updates: UpdateSpec[];
};

// A pool of named supporters reused across campaigns.
const SUPPORTERS = [
  ["Kofi", "Mensah", "kofi.mensah@example.com"],
  ["Abena", "Owusu", "abena.owusu@example.com"],
  ["Yaw", "Boateng", "yaw.boateng@example.com"],
  ["Akosua", "Asante", "akosua.asante@example.com"],
  ["Kojo", "Agyeman", "kojo.agyeman@example.com"],
  ["Adwoa", "Darko", "adwoa.darko@example.com"],
  ["Kwabena", "Appiah", "kwabena.appiah@example.com"],
  ["Efua", "Addo", "efua.addo@example.com"],
] as const;

// Builds a spread of donations that sum to roughly `raisedCedis`.
function donationsFor(raisedCedis: number, count: number): DonationSpec[] {
  const out: DonationSpec[] = [];
  let remaining = raisedCedis;
  for (let i = 0; i < count; i++) {
    const last = i === count - 1;
    const share = last
      ? remaining
      : Math.max(
          10,
          Math.round((remaining / (count - i)) * (0.6 + Math.random() * 0.8)),
        );
    remaining -= share;
    const anonymous = i % 4 === 0;
    const supporter = SUPPORTERS[i % SUPPORTERS.length];
    out.push({
      cedis: share,
      anonymous,
      first: anonymous ? undefined : supporter[0],
      last: anonymous ? undefined : supporter[1],
      email: anonymous ? undefined : supporter[2],
      daysAgo: Math.round((i / count) * 25) + 1,
    });
    if (remaining <= 0) break;
  }
  return out;
}

const CAMPAIGNS: CampaignSpec[] = [
  {
    slug: "ama-leukemia",
    organiser: "ama",
    title: "Help Ama Beat Leukemia",
    description:
      "Twelve-year-old Ama was diagnosed with acute leukemia in June. Her family needs support for chemotherapy, hospital stays and travel to Korle Bu Teaching Hospital. Every cedi brings her closer to recovery and back to the classroom she loves.",
    category: "MEDICAL",
    goalCedis: 120_000,
    endInDays: 23,
    donations: donationsFor(86_400, 9),
    updates: [
      {
        title: "First round of chemotherapy complete",
        body: "Ama finished her first cycle this week and is responding well. Thank you for carrying us this far — the doctors are hopeful.",
        daysAgo: 3,
      },
      {
        title: "We reached 70% of the goal!",
        body: "Overwhelmed by the generosity of strangers who have become family. The next treatment is now fully funded.",
        daysAgo: 9,
      },
    ],
  },
  {
    slug: "osu-school",
    organiser: "kwame",
    title: "Books & Laptops for Osu Community School",
    description:
      "Our 400 pupils share 30 outdated textbooks and have never touched a computer. We're raising funds for a library refresh and a 20-laptop digital lab so these bright children can compete with any school in the country.",
    category: "EDUCATIONAL",
    goalCedis: 75_000,
    endInDays: 40,
    donations: donationsFor(51_200, 11),
    updates: [
      {
        title: "Classroom cleared for the new lab",
        body: "Parents volunteered all weekend to prepare the room. Photos coming soon — it already looks transformed.",
        daysAgo: 5,
      },
    ],
  },
  {
    slug: "kumasi-fire",
    organiser: "esi",
    title: "Rebuild After the Kumasi Market Fire",
    description:
      "A midnight fire destroyed 60 stalls at Kejetia, wiping out the livelihoods of traders who support entire families. Funds go directly to rebuilding stalls and restocking inventory so these women can trade again.",
    category: "EMERGENCY",
    goalCedis: 200_000,
    endInDays: 12,
    donations: donationsFor(141_750, 14),
    updates: [
      {
        title: "First 10 stalls rebuilt",
        body: "Construction started Monday. Ten traders are back at work and the rest are next in line.",
        daysAgo: 2,
      },
      {
        title: "Local hardware store matched donations",
        body: "A generous supplier matched every cedi raised last week. Thank you!",
        daysAgo: 7,
      },
    ],
  },
  {
    slug: "dodowa-water",
    organiser: "ama",
    title: "Clean Water for Dodowa Village",
    description:
      "Families in Dodowa walk two hours each day for water that still makes their children sick. We're drilling a borehole and installing a solar-powered pump to bring safe water to 1,200 people.",
    category: "COMMUNITY",
    goalCedis: 90_000,
    endInDays: 31,
    donations: donationsFor(43_900, 8),
    updates: [
      {
        title: "Geological survey passed",
        body: "Engineers confirmed a strong water table. Drilling begins as soon as we hit the halfway mark.",
        daysAgo: 6,
      },
    ],
  },
  {
    slug: "volta-trees",
    organiser: "kwame",
    title: "Plant 10,000 Trees Along the Volta",
    description:
      "Erosion is swallowing farmland along the Volta. Together with local youth groups we'll plant 10,000 indigenous trees to protect the riverbanks, restore habitats and capture carbon for generations.",
    category: "ENVIRONMENT",
    goalCedis: 60_000,
    endInDays: 54,
    donations: donationsFor(22_300, 7),
    updates: [],
  },
  {
    slug: "accra-dogs",
    organiser: "esi",
    title: "Accra Street Dogs Rescue Shelter",
    description:
      "We rescue, treat and rehome abandoned dogs across Accra. This campaign funds a proper shelter with a clinic, kennels and a feeding program so no rescue has to be turned away.",
    category: "ANIMALS",
    goalCedis: 45_000,
    endInDays: 18,
    donations: donationsFor(29_800, 10),
    updates: [
      {
        title: "15 dogs rehomed this month",
        body: "Our best month yet. Each adoption makes room to rescue another.",
        daysAgo: 4,
      },
    ],
  },
  {
    slug: "sanitary-pads",
    organiser: "ama",
    title: "Sanitary Pads for 5,000 Schoolgirls",
    description:
      "One in four girls misses school during her period for lack of sanitary products. We're distributing a year's supply of reusable pads and running dignity workshops in 20 rural schools.",
    category: "NONPROFIT",
    goalCedis: 50_000,
    endInDays: 27,
    donations: donationsFor(47_600, 12),
    updates: [
      {
        title: "First 1,200 girls reached",
        body: "We've completed distribution in the first six schools. Attendance is already climbing.",
        daysAgo: 8,
      },
    ],
  },
  {
    slug: "tamale-wheelchairs",
    organiser: "kwame",
    title: "Wheelchairs for Tamale Clinic",
    description:
      "The regional clinic in Tamale serves hundreds of patients with mobility needs but owns just four wheelchairs. We're funding 40 durable, all-terrain wheelchairs fitted to each patient.",
    category: "MEDICAL",
    goalCedis: 65_000,
    endInDays: 5,
    donations: donationsFor(61_200, 13),
    updates: [],
  },
  {
    slug: "ada-solar",
    organiser: "esi",
    title: "Solar Lights for Ada Fishing Community",
    description:
      "Fishing families in Ada mend nets and study by dangerous kerosene lamps. We're distributing 800 solar lanterns so children can read after dark and fishers can work safely at dawn.",
    category: "COMMUNITY",
    goalCedis: 40_000,
    endInDays: -3, // ended, to show a completed campaign
    donations: donationsFor(40_000, 15),
    updates: [
      {
        title: "Campaign closed — goal reached!",
        body: "Every lantern is funded and distribution is underway. Thank you, Ghana.",
        daysAgo: 1,
      },
    ],
  },
];

function donorCountFor(donations: DonationSpec[]): number {
  const namedEmails = new Set<string>();
  let anonymous = 0;
  for (const d of donations) {
    if (!d.anonymous && d.email) namedEmails.add(d.email);
    else anonymous += 1;
  }
  return namedEmails.size + anonymous;
}

async function main() {
  console.log("Clearing existing campaign data…");
  await prisma.auditLog.deleteMany();
  await prisma.update.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.withdrawal.deleteMany();
  await prisma.payoutAccount.deleteMany();
  await prisma.fundraiser.deleteMany();
  await prisma.event.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const organisers = {
    ama: {
      email: "ama@flowfund.demo",
      name: "Ama Serwaa",
      verified: true,
      image: img("organiser-ama"),
    },
    kwame: {
      email: "kwame@flowfund.demo",
      name: "Kwame Nkansah",
      verified: true,
      image: img("organiser-kwame"),
    },
    esi: {
      email: "esi@flowfund.demo",
      name: "Esi Bonsu",
      verified: false,
      image: img("organiser-esi"),
    },
  };

  const organiserIds: Record<string, string> = {};
  for (const [key, o] of Object.entries(organisers)) {
    const user = await prisma.user.upsert({
      where: { email: o.email },
      update: {
        name: o.name,
        password: passwordHash,
        image: o.image,
        isVerifiedOrganiser: o.verified,
        emailVerified: new Date(),
      },
      create: {
        email: o.email,
        name: o.name,
        password: passwordHash,
        image: o.image,
        isVerifiedOrganiser: o.verified,
        emailVerified: new Date(),
      },
    });
    organiserIds[key] = user.id;
  }

  // A demo donor whose gifts link to their account (for "My donations").
  const donor = await prisma.user.upsert({
    where: { email: "donor@flowfund.demo" },
    update: {
      name: "Nana Mensah",
      password: passwordHash,
      emailVerified: new Date(),
    },
    create: {
      email: "donor@flowfund.demo",
      name: "Nana Mensah",
      password: passwordHash,
      emailVerified: new Date(),
    },
  });

  for (const c of CAMPAIGNS) {
    const raised = c.donations.reduce((sum, d) => sum + ghs(d.cedis), 0);
    const event = await prisma.event.create({
      data: {
        userId: organiserIds[c.organiser],
        title: c.title,
        description: c.description,
        category: c.category,
        date: new Date(Date.now() + c.endInDays * DAY),
        fundraiser: {
          create: {
            targetAmount: ghs(c.goalCedis),
            minimumAmount: ghs(10),
            endDate: new Date(Date.now() + c.endInDays * DAY),
            anonymity: true,
            image: img(c.slug),
            raisedAmount: raised,
            donorCount: donorCountFor(c.donations),
            totalWithdrawn: 0,
            currency: "GHS",
          },
        },
      },
      include: { fundraiser: true },
    });

    // Donations (link roughly every third named gift to the demo donor).
    let i = 0;
    for (const d of c.donations) {
      const linkToDonor = !d.anonymous && i % 3 === 0;
      await prisma.donation.create({
        data: {
          reference: `seed_${c.slug}_${i}`,
          amount: ghs(d.cedis),
          currency: "GHS",
          fundraiserId: event.fundraiser!.id,
          isAnonymous: !!d.anonymous,
          userId: linkToDonor ? donor.id : undefined,
          donorFirstName: d.anonymous ? undefined : d.first,
          donorLastName: d.anonymous ? undefined : d.last,
          donorEmail: d.anonymous ? undefined : d.email,
          paymentDetails: { seeded: true },
          dateAdded: new Date(Date.now() - d.daysAgo * DAY),
        },
      });
      i++;
    }

    for (const u of c.updates) {
      await prisma.update.create({
        data: {
          eventId: event.id,
          title: u.title,
          body: u.body,
          dateAdded: new Date(Date.now() - u.daysAgo * DAY),
        },
      });
    }

    console.log(`  • ${c.title} — ${c.donations.length} donations`);
  }

  console.log("\nSeed complete.");
  console.log("Demo logins (password for all): " + DEMO_PASSWORD);
  console.log(
    "  Organisers: ama@flowfund.demo, kwame@flowfund.demo, esi@flowfund.demo",
  );
  console.log("  Donor:      donor@flowfund.demo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
