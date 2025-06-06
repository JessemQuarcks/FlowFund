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

export type EventWithDaysLeft = Event & {
  fundraiser: Fundraiser | null;
  daysLeft: Number;
};
