import Link from "next/link";
import { Heart, ShieldCheck, TrendingUp } from "lucide-react";

const LINKS: { heading: string; items: { label: string; href: string }[] }[] = [
  {
    heading: "Platform",
    items: [
      { label: "Discover", href: "/events" },
      { label: "Start a fundraiser", href: "/events/create" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    heading: "Company",
    items: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Legal",
    items: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="brand-gradient flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-soft">
                <TrendingUp className="h-5 w-5" />
              </span>
              <span className="text-xl font-bold tracking-tight brand-text-gradient">
                FlowFund
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Ghana&apos;s trusted way to raise money for the causes that matter
              — secure, transparent and fast.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary-600" />
              Payments secured by Paystack
            </div>
          </div>

          {LINKS.map((group) => (
            <div key={group.heading}>
              <h4 className="text-sm font-semibold">{group.heading}</h4>
              <ul className="mt-4 space-y-2.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary-600"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} FlowFund. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Made with{" "}
            <Heart className="h-4 w-4 fill-primary-500 text-primary-500" /> in
            Accra
          </p>
        </div>
      </div>
    </footer>
  );
}
