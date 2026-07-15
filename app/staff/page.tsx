import type { Metadata } from "next";
import { StaffApp, type StaffMember } from "@/components/staff/StaffApp";
import { getStationData, resolveShowHosts } from "@/lib/station";
import { parseHostSocials } from "@/lib/hosts";
import { SITE, staffJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Staff",
  description: `Conocé al equipo de ${SITE.name}: los locutores que te acompañan cada día desde ${SITE.city}, ${SITE.region}.`,
  alternates: { canonical: "/staff" },
};

// REQUIRED: without this Next would try to prerender at build time, which calls
// getStationData() → MySQL. The CI runner has no database, so the build breaks.
export const dynamic = "force-dynamic";

type ShowRow = { id: string; name: string; host: string; hostIds: string | null; startTime: string; endTime: string; isOn: boolean };
type HostRow = { id: string; name: string; alias: string; hue: string; photoUrl: string | null; bio: string | null; socials: string | null };

export default async function StaffPage() {
  // the shim returns RowDataPacket[]; shape is guaranteed by prisma/schema.prisma
  const data = await getStationData();
  const shows = data.shows as unknown as ShowRow[];
  const hosts = data.hosts as unknown as HostRow[];

  // Reverse index host → programs. Only possible thanks to Show.hostIds; the
  // shim can't join, but getStationData already loaded both lists.
  const members: StaffMember[] = hosts.map((h) => {
    const programs = shows
      .filter((s) => s.isOn && resolveShowHosts(s, hosts).hosts.some((x) => x.id === h.id))
      .map((s) => ({ name: s.name, time: `${s.startTime} – ${s.endTime}` }));
    return {
      id: h.id,
      name: h.name,
      alias: h.alias,
      hue: h.hue,
      photoUrl: h.photoUrl ?? null,
      bio: h.bio ?? null,
      socials: parseHostSocials(h.socials),
      programs,
    };
  });

  return (
    <>
      <StaffApp members={members} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(staffJsonLd(members)) }}
      />
    </>
  );
}
