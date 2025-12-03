import AdminTable from "@/app/admin/components/AdminTable";

type PageProps = {
  params: Promise<{
    table: string;
    year: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params; // unwrap Promise
  const table = resolvedParams.table;
  const year = resolvedParams.year;

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-xl font-bold">
        ตาราง {table.toUpperCase()} ปี {year}
      </h2>
      <AdminTable apiPath={`/api/${table}?year=${year}`} />
    </div>
  );
}
