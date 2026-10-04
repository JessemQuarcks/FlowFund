import { Event, Fundraiser, Prisma } from "@/lib/generated/prisma";

export type EventWithFundraiser = Prisma.EventGetPayload<{
  omit: {
    dateAdded: true;
    dateUpdated: true;
  };
  include: {
    fundraiser: {
      omit: {
        dateAdded: true;
        dateUpdated: true;
      };
    };
  };
}>;

export type EventWithFundraiserAndUser = Prisma.EventGetPayload<{
  include: {
    fundraiser: {
      omit: {
        dateAdded: true;
        dateUpdated: true;
      };
    };
    // Only public fields: this type is passed to client components.
    user: {
      select: {
        id: true;
        name: true;
      };
    };
  };
  omit: {
    dateAdded: true;
    dateUpdated: true;
  };
}>;

export type EventWithDaysLeft = Event & {
  fundraiser: Fundraiser | null;
  daysLeft: number;
};

export type DonorInfo = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
} | null;
