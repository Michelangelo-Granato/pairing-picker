import React from 'react';

interface DisplaySettingsProps {
  isOpen: boolean;
  onClose: () => void;
  visibleColumns: Set<string>;
  onToggleColumn: (column: string) => void;
}

const DisplaySettings: React.FC<DisplaySettingsProps> = ({
  isOpen,
  onClose,
  visibleColumns,
  onToggleColumn,
}) => {
  if (!isOpen) return null;

  const columns = [
    { key: "pairingNumber", label: "Pairing Number" },
    { key: "operatingDates", label: "Operating Dates" },
    { key: "blockTime", label: "Total Flight Credit" },
    { key: "tafb", label: "TAFB" },
    { key: "totalAllowance", label: "Total Allowance" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-700 p-6 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Display Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4">
          <h3 className="font-medium">Visible Columns</h3>
          <div className="space-y-2">
            {columns.map((column) => (
              <label key={column.key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={visibleColumns.has(column.key)}
                  onChange={() => onToggleColumn(column.key)}
                  className="rounded"
                />
                {column.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisplaySettings; 