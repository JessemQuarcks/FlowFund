"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AdminTab } from "@/schemas/admin";

export function AdminTabs({
  activeTab,
  children,
}: {
  activeTab: AdminTab;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState(activeTab);

  useEffect(() => setTab(activeTab), [activeTab]);

  const changeTab = (value: string) => {
    const nextTab = value as AdminTab;
    setTab(nextTab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", nextTab);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs value={tab} onValueChange={changeTab}>
      {children}
    </Tabs>
  );
}

export {
  TabsContent as AdminTabsContent,
  TabsList as AdminTabsList,
  TabsTrigger as AdminTabsTrigger,
};
