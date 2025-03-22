import React, { useRef, useEffect } from 'react';

interface DisplaySettingsProps {
  isOpen: boolean;
  onClose: () => void;
  visibleColumns: Set<string>;
  onToggleColumn: (column: string) => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

const DisplaySettings: React.FC<DisplaySettingsProps> = ({
  isOpen,
  onClose,
  visibleColumns,
  onToggleColumn,
  buttonRef
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [buttonRef, onClose]);

  if (!isOpen) return null;

  const columns = [
    { key: "pairingNumber", label: "Pairing Number" },
    { key: "operatingDates", label: "Operating Dates" },
    { key: "blockTime", label: "Total Flight Credit" },
    { key: "tafb", label: "TAFB" },
    { key: "totalAllowance", label: "Total Allowance" },
  ];

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 mt-2 bg-gray-700 p-4 rounded-lg shadow-xl z-50 min-w-[250px]"
      style={{
        top: buttonRef.current ? buttonRef.current.offsetHeight : 0
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Display Settings</h2>
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
  );
};

export default DisplaySettings; 