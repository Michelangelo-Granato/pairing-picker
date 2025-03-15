import { parsePDF } from "./parser";
import fs from "fs";
import path from "path";
import { describe, it, expect } from "@jest/globals";

describe("parsePDF", () => {
  it("should parse the PDF and return the correct pairings", async () => {
    const filePath = path.resolve(__dirname, "../../test/data/sample.pdf");
    const fileBuffer = fs.readFileSync(filePath);
    const file = new File([fileBuffer], "sample.pdf", {
      type: "application/pdf",
    });

    const pairings = await parsePDF(file);

    expect(pairings).toBeDefined();
    expect(pairings.length).toBeGreaterThan(0);

    const firstPairing = pairings[0];
    expect(firstPairing.pairingNumber).toBe("T123");
    expect(firstPairing.operatingDates).toBe("01JAN - 02JAN");
    expect(firstPairing.flights.length).toBeGreaterThan(0);

    const firstFlight = firstPairing.flights[0];
    expect(firstFlight.aircraft).toBe("A320");
    expect(firstFlight.flightNumber).toBe("1234");
    expect(firstFlight.departure).toBe("JFK");
    expect(firstFlight.arrival).toBe("LAX");
    expect(firstFlight.departureTime).toBe("0800");
    expect(firstFlight.arrivalTime).toBe("1100");
    expect(firstFlight.duration).toBe("300");
  });
});
