"use client";
import { useState } from "react";
import { Pairing, parsePDF } from "./parser";
import PairingTable from "./PairingTable";

export default function Home() {
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsParsing(true);
      const parsedPairings = await parsePDF(file);
      setIsParsing(false);
      setPairings(parsedPairings);
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-2xl font-bold">Pairing Picker</h1>
        <p className="text-lg text-center">
          Welcome Fauve, please upload your pairing file to get started.
        </p>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileUpload}
          className="mb-4"
        />
        {isParsing && <p className="text-lg">Loading...</p>}
        {!isParsing && pairings.length > 0 && (
          <p className="text-lg">
            {pairings.length} Pairings loaded successfully!
          </p>
        )}
        <PairingTable data={pairings} />
      </main>
    </div>
  );
}
