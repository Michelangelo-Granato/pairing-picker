'use server';

import { getCachedPairings, setCachedPairings } from './lib/cache';
import fs from 'fs';
import path from 'path';

export async function parsePDFAction(formData: FormData) {
  try {
    const file = formData.get('file');
    if (!file) {
      throw new Error('No file provided');
    }

    let buffer: Buffer;
    let filename: string;

    if (file instanceof File) {
      // Handle browser File object
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      filename = file.name;
    } else if (typeof file === 'string') {
      // Handle file path from data folder
      console.log('Processing file path:', file);
      // Use the path as-is if it's absolute, otherwise join with cwd
      const filePath = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
      console.log('Full file path:', filePath);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found at path: ${filePath}`);
      }
      
      buffer = fs.readFileSync(filePath);
      filename = path.basename(filePath);
      console.log('Processed filename:', filename);
    } else {
      throw new Error('Invalid file format');
    }

    const yearMonth = filename.split('.')[0];
    console.log('Extracted yearMonth:', yearMonth);

    // Try to get cached data first
    const cachedData = await getCachedPairings(yearMonth);
    if (cachedData) {
      console.log('Using cached data for:', yearMonth);
      return {
        success: true,
        data: {
          yearMonth: cachedData.yearMonth,
          pairings: cachedData.pairings
        }
      };
    }

    // If no cache, parse the PDF
    console.log('Parsing PDF for:', yearMonth);
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);

    // Parse the text content
    const lines = data.text.split("\n");
    
    // Import parser function
    const { parsePairingFile } = await import('./utils/parser');
    const pairings = await parsePairingFile(lines);
    console.log(`Parsed ${pairings.length} pairings from ${yearMonth}`);

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