import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'src', 'data');
    console.log('Looking for data directory at:', dataDir);
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      console.log('Data directory does not exist, creating it...');
      try {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('Data directory created successfully');
      } catch (error) {
        console.error('Error creating data directory:', error);
        return NextResponse.json({ error: 'Failed to create data directory' }, { status: 500 });
      }
    }

    // Check if directory is readable
    try {
      fs.accessSync(dataDir, fs.constants.R_OK);
      console.log('Data directory is readable');
    } catch (error) {
      console.error('Error accessing data directory:', error);
      return NextResponse.json({ error: 'Data directory is not accessible' }, { status: 500 });
    }

    // Read directory contents
    const allFiles = fs.readdirSync(dataDir);
    console.log('All files in directory:', allFiles);
    
    const pdfFiles = allFiles.filter(file => file.endsWith('.pdf'));
    console.log('PDF files found:', pdfFiles);

    const files = pdfFiles.map(file => {
      const filePath = path.join(dataDir, file);
      const stats = fs.statSync(filePath);
      console.log(`File details for ${file}:`, {
        path: filePath,
        size: stats.size,
        lastModified: stats.mtime
      });
      return {
        name: file,
        path: filePath,
        size: stats.size,
        lastModified: stats.mtime
      };
    })
    .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

    console.log('Final processed files:', files);
    return NextResponse.json(files);
  } catch (error) {
    console.error('Error reading data directory:', error);
    return NextResponse.json({ 
      error: 'Failed to load data files',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 