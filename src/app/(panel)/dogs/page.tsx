import Link from "next/link";
import { Suspense } from "react";
import { listDogs, type DogFilter } from "@/lib/queries/dogs";
import { PageHeader, Card, Pagination, EmptyState, SearchInput, cn } from "@/components/ui";
import { Skeleton } from "@/components/Skeleton";
import { RemoteImage } from "@/components/RemoteImage";
import { DogActiveBadge } from "@/components/badges";
import { DogActiveToggle } from "@/components/DogActiveToggle";
import { IconPaw, IconHeart, IconFlag } from "@/components/icons";
import { formatNumber } from "@/lib/format";
import { DOG_SEX_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 24;

const FILTERS: { key: DogFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Activos" },
  { key: "inactive", label: "Inactivos" },
  { key: "reported", label: "Reportados" },
];

export default async function DogsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; filter?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const filter = (FILTERS.some((f) => f.key === sp.filter) ? sp.filter : "all") as DogFilter;
  const q = sp.q ?? "";

  return (
    <>
      <PageHeader
        title="Perros"
        subtitle="Moderación de perfiles"
        actions={<SearchInput placeholder="Perro, dueño o ID" />}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/dogs" : `/dogs?filter=${f.key}`}
            prefetch
            className={cn(
              "rounded-(--radius-button) border px-3 py-1.5 text-sm transition",
              filter === f.key
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-border text-muted hover:text-text",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Suspense key={`${q}|${filter}|${page}`} fallback={<DogsGridSkeleton />}>
        <DogsContent q={q} filter={filter} page={page} />
      </Suspense>
    </>
  );
}

async function DogsContent({
  q,
  filter,
  page,
}: {
  q: string;
  filter: DogFilter;
  page: number;
}) {
  const { items, hasNext } = await listDogs({ q, filter, page, pageSize: PAGE_SIZE });

  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (filter !== "all") params.set("filter", filter);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/dogs${s ? `?${s}` : ""}`;
  };

  return (
    <>
      {items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconPaw className="h-8 w-8" />}
            title={q ? "Sin resultados" : "Sin perros"}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((d) => (
            <Card key={d.id} className="overflow-hidden">
              <div className="relative">
                <RemoteImage
                  src={d.image_url}
                  alt={d.name ?? ""}
                  className="aspect-square w-full object-cover"
                />
                <div className="absolute left-2 top-2">
                  <DogActiveBadge active={d.is_active === 1} />
                </div>
              </div>
              <div className="space-y-2 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-medium">{d.name ?? "Sin nombre"}</p>
                  <span className="shrink-0 text-xs text-subtle">
                    {d.sex ? DOG_SEX_LABELS[d.sex] : ""}
                  </span>
                </div>
                <Link
                  href={`/users/${d.owner_id}`}
                  prefetch
                  className="block truncate text-xs text-muted hover:text-primary"
                >
                  {d.owner_name ?? d.owner_email}
                </Link>
                <div className="flex items-center gap-3 text-xs text-subtle">
                  <span className="flex items-center gap-1">
                    <IconHeart className="h-3.5 w-3.5" /> {formatNumber(d.like_count)}
                  </span>
                  {d.report_count > 0 && (
                    <span className="flex items-center gap-1 text-warning">
                      <IconFlag className="h-3.5 w-3.5" /> {formatNumber(d.report_count)}
                    </span>
                  )}
                </div>
                <div className="pt-1">
                  <DogActiveToggle dogId={d.id} active={d.is_active === 1} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-4">
        <Card>
          <Pagination page={page} hasNext={hasNext} build={buildHref} />
        </Card>
      </div>
    </>
  );
}

function DogsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-7 w-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}
