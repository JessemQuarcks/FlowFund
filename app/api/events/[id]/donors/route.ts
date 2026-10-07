import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api";
import { listDonors, type DonorSort } from "@/lib/services/donations";

type Context = { params: Promise<{ id: string }> };

const SORTS: DonorSort[] = ["recent", "highest", "lowest"];

export const GET = withErrorHandling(
  async (request: Request, { params }: Context) => {
    const { id } = await params;
    const url = new URL(request.url);
    const sortParam = url.searchParams.get("sort") as DonorSort | null;
    const sort = sortParam && SORTS.includes(sortParam) ? sortParam : "recent";
    const page = Number(url.searchParams.get("page")) || 1;

    const result = await listDonors(id, { page, sort });
    return NextResponse.json({ success: true, ...result });
  },
);
