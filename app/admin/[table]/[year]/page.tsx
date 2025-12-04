import AdminTable from "@/app/admin/components/AdminTable";

type PageProps = {
  params: Promise<{
    table: string;
    year: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const { table, year } = resolvedParams;

  // Validate table name
  if (!/^tcas_[1-4]$/.test(table)) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-bold text-red-600">Invalid table name</h2>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-xl font-bold">
        ตาราง {table.toUpperCase()} ปี {year}
      </h2>
      <AdminTable apiPath={`/api/tcas/${table}?year=${year}`} />
    </div>
  );
}