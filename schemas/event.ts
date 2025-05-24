import { Event_Category } from "@/lib/generated/prisma";
import { z } from "zod";
import { zfd } from "zod-form-data";

export const createEventSchema = zfd.formData({
  event: z.object({
    category: z.nativeEnum(Event_Category),
    description: zfd.text(),
    title: zfd.text(),
    userId: zfd.text(),
    date: z.date().min(new Date()),
    image: zfd.file(z.instanceof(File).optional()),
  }),
  fundraiser: z.object({
    targetAmount: zfd.numeric(z.number().min(1)),
    anonymity: zfd.checkbox(),
    minimumAmount: zfd.numeric(z.number().min(0.1)),
    endDate: z.date(),
  }),
});
