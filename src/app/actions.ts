'use server';

import { getCachedPairings, setCachedPairings } from './lib/cache';

export async function parsePDFAction(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      throw new Error('No file provided');
    }

    const filename = file.name;
    const yearMonth = filename.split('.')[0];

    // Try to get cached data first
    const cachedData = await getCachedPairings(yearMonth);
    if (cachedData) {
      return {
        success: true,
        data: {
          yearMonth: cachedData.yearMonth,
          pairings: cachedData.pairings
        }
      };
    }

    // If no cache, parse the PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamically import pdf-parse
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);

    // Parse the text content
    const lines = data.text.split("\n");
    
    // Import parser function
    const { parsePairingFile } = await import('./parser');
    const pairings = await parsePairingFile(lines);

    // Cache the results
    await setCachedPairings(yearMonth, pairings);

    return {
      success: true,
      data: {
        yearMonth,
        pairings
      }
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error parsing PDF file'
    };
  }
} 