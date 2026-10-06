import { notFound, redirect } from "next/navigation";
import { CommerceWorkspace } from "@/components/studio/CommerceWorkspace";

export default async function CommercePage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const { section } = await params;
  if (section === "bounties") redirect("/commercial/subjects");
  if (section === "match") redirect("/commercial/market?view=own");
  if (!["market", "subjects", "orders"].includes(section)) notFound();
  const marketView = (await searchParams).view === "own" ? "own" : "store";
  return <CommerceWorkspace key={section} section={section} marketView={marketView} />;
}
