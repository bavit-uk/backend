// services/gtin.service.ts
import { Gtin } from "@/models";
import * as XLSX from "xlsx";

export const gtinService = {
  // Parse CSV and save GTINs to database

  createGtinsFromXlsx: async (fileBuffer: Buffer): Promise<string[]> => {
    const gtins: string[] = [];

    try {
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });

      if (workbook.SheetNames.length === 0) {
        throw new Error("No sheets found in the XLSX file");
      }

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      if (!sheet) {
        throw new Error(`Sheet "${sheetName}" is empty or missing`);
      }

      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      console.log("Parsed data from XLSX (first 5 rows):", data.slice(0, 5));

      // Process all rows, including duplicates
      data.forEach((row: any, index) => {
        const gtin = row[0]?.toString().trim();

        // Basic GTIN validation - accept all valid format GTINs
        if (gtin && /^[0-9]{8}$|^[0-9]{12}$|^[0-9]{13}$|^[0-9]{14}$/.test(gtin)) {
          gtins.push(gtin); // Add all GTINs, including duplicates
        } else if (gtin) {
          console.log(`Row ${index + 1}: Invalid or missing GTIN: ${gtin}`);
        }
      });

      console.log(
        `Extracted ${gtins.length} GTINs (including duplicates):`,
        gtins.slice(0, 10),
        gtins.length > 10 ? `...and ${gtins.length - 10} more` : ""
      );

      if (gtins.length === 0) {
        throw new Error("No valid GTINs found in the file");
      }

      return gtins;
    } catch (error: any) {
      console.error("Error processing XLSX file:", error);
      throw new Error(`Failed to process XLSX file: ${error.message}`);
    }
  },
  // Get all unused GTINs
  getAllGtins: async () => {
    return await Gtin.find().sort({ createdAt: 1 });
  },

  // Mark a GTIN as used and associate it with a listing
  useGtin: async (gtin: string, listingId: string) => {
    const gtinDoc = await Gtin.findOneAndUpdate(
      { gtin, isUsed: false },
      {
        isUsed: true,
        usedInListing: listingId,
        confirmedAt: new Date(),
      },
      { new: true }
    );

    // if (!gtinDoc) {
    //   throw new Error("GTIN not found or already used");
    // }

    return gtinDoc;
  },
  getAndReserveGtin: async (listingId: string) => {
    const gtinDoc = await Gtin.findOneAndUpdate(
      { isUsed: false }, // Find unused GTIN
      {
        isUsed: true,
        usedInListing: listingId,
        reservedAt: new Date(),
      }, // Mark as used immediately
      {
        new: true, // Return updated document
        sort: { createdAt: 1 }, // Get oldest GTIN first (FIFO)
      }
    );

    if (!gtinDoc) {
      throw new Error("No unused GTINs available");
    }

    return gtinDoc;
  },

  // Confirm GTIN usage after successful Amazon API call
  confirmGtinUsage: async (gtin: string, listingId: string) => {
    const gtinDoc = await Gtin.findOneAndUpdate(
      { gtin, usedInListing: listingId },
      {
        confirmedAt: new Date(),
        // Remove reservedAt since it's now confirmed
        $unset: { reservedAt: 1 },
      },
      { new: true }
    );

    if (!gtinDoc) {
      throw new Error(`GTIN ${gtin} not found or not reserved for listing ${listingId}`);
    }

    return gtinDoc;
  },

  // Release GTIN back to available pool if listing fails
  releaseGtin: async (gtin: string) => {
    const gtinDoc = await Gtin.findOneAndUpdate(
      { gtin },
      {
        isUsed: false,
        usedInListing: null,
        $unset: { reservedAt: 1, confirmedAt: 1 },
      },
      { new: true }
    );

    if (!gtinDoc) {
      throw new Error(`GTIN ${gtin} not found`);
    }

    return gtinDoc;
  },
};
