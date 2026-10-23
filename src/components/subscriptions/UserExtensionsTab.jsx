import React, { useMemo } from "react";
import { CompanyCell, DataTable, EXTENSION_COLUMNS } from "./SubscriptionsTab";

function UserExtensionsTab({ rows, loading }) {
  const extensionRows = useMemo(
    () =>
      rows.flatMap((r) =>
        r.userExtensions.map((e, i) => ({
          ...e,
          rowKey: `${r.id}-${e.service_id}-${i}`,
          companyName: r.name,
          companyEmail: r.email,
        })),
      ),
    [rows],
  );

  const columns = [
    {
      key: "companyName",
      header: "Company",
      render: (r) => (
        <CompanyCell name={r.companyName} email={r.companyEmail} />
      ),
    },
    ...EXTENSION_COLUMNS,
  ];

  return (
    <div className="px-4 sm:px-6 flex flex-col gap-3">
      <div>
        <p className="text-gray-900">User Extensions</p>
        <p className="text-[11px] text-gray-500">
          Additional users purchased on top of the included limit
        </p>
      </div>
      <DataTable
        columns={columns}
        rows={extensionRows}
        loading={loading}
        emptyText="No user extensions found"
      />
    </div>
  );
}

export default UserExtensionsTab;
