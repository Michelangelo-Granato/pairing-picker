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
    const numPairings = 4;
    const pairings = await parsePDF(file, numPairings);

    expect(pairings).toBeDefined();
    expect(pairings.length).toBe(numPairings);

    const firstPairing = pairings[0];
    expect(firstPairing.pairingNumber).toBe("T5001");
    expect(firstPairing.operatingDates).toBe("15APR - 25APR");
    expect(firstPairing.flights.length).toBe(2);
    expect(firstPairing.layovers).toBe(0);
    expect(firstPairing.tafb).toBe("1350");
    expect(firstPairing.totalAllowance).toBe("0.00");
    expect(firstPairing.blockTime).toBe("1050");

    const firstFlight = firstPairing.flights[0];
    expect(firstFlight.departure).toBe("YYZ");
    expect(firstFlight.arrival).toBe("BGI");
    expect(firstFlight.departureTime).toBe("0815");
    expect(firstFlight.arrivalTime).toBe("1315");
    expect(firstFlight.flightTime).toBe("500");
    const secondFlight = firstPairing.flights[1];
    expect(secondFlight.departure).toBe("BGI");
    expect(secondFlight.arrival).toBe("YYZ");
    expect(secondFlight.departureTime).toBe("1450");
    expect(secondFlight.arrivalTime).toBe("2040");
    expect(secondFlight.flightTime).toBe("550");

    // Second pairing
    const fourthPairing = pairings[3];
    expect(fourthPairing.pairingNumber).toBe("T5004");
    expect(fourthPairing.operatingDates).toBe("19APR - 19APR");
    expect(fourthPairing.flights.length).toBe(4);
    expect(fourthPairing.layovers).toBe(3);
    expect(fourthPairing.tafb).toBe("10618");
    expect(fourthPairing.totalAllowance).toBe("480.78");
    expect(fourthPairing.blockTime).toBe("2600");

    const fourthFlight = fourthPairing.flights[0];
    expect(fourthFlight.departure).toBe("YYZ");
    expect(fourthFlight.departureTime).toBe("0900");
    expect(fourthFlight.arrival).toBe("YUL");
    expect(fourthFlight.arrivalTime).toBe("1021");
    expect(fourthFlight.flightTime).toBe("41");

    const firstLayover = fourthFlight.layover;
    expect(firstLayover).toBeDefined();
    expect(firstLayover?.hotel).toBe("Le Centre Sheraton Montreal Ho");
    expect(firstLayover?.duration).toBe("2519");

    const fifthFlight = fourthPairing.flights[1];
    expect(fifthFlight.departure).toBe("YUL");
    expect(fifthFlight.departureTime).toBe("1250");
    expect(fifthFlight.arrival).toBe("NRT");
    expect(fifthFlight.arrivalTime).toBe("1525");
    expect(fifthFlight.flightTime).toBe("1335");

    const secondLayover = fifthFlight.layover;
    expect(secondLayover).toBeDefined();
    expect(secondLayover?.hotel).toBe("Hilton Tokyo Narita Airport");
    expect(secondLayover?.duration).toBe("2445");

    const sixthFlight = fourthPairing.flights[2];
    expect(sixthFlight.departure).toBe("NRT");
    expect(sixthFlight.departureTime).toBe("1735");
    expect(sixthFlight.arrival).toBe("YUL");
    expect(sixthFlight.arrivalTime).toBe("1700");
    expect(sixthFlight.flightTime).toBe("1225");

    const thirdLayover = sixthFlight.layover;
    expect(thirdLayover).toBeDefined();
    expect(thirdLayover?.hotel).toBe("Le Centre Sheraton Montreal Ho");
    expect(thirdLayover?.duration).toBe("2400");

    const seventhFlight = fourthPairing.flights[3];
    expect(seventhFlight.departure).toBe("YUL");
    expect(seventhFlight.departureTime).toBe("1715");
    expect(seventhFlight.arrival).toBe("YYZ");
    expect(seventhFlight.arrivalTime).toBe("1848");
    expect(seventhFlight.flightTime).toBe("47");
  });
});
