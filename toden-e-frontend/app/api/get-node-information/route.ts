import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';

// FIX 1: Define an interface for the shape of a single CSV record.
// This makes your code type-safe and easier to work with.
interface NodeInfoRecord {
  GOID: string;
  NAME: string;
  ORGANISM: string;
  SIZE: string;
  LINK:string;
  DESCRIPTION: string;
  [key: string]: string; // Allows for other columns in the CSV
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const goid = searchParams.get('goid');
    const normalizedGoid = goid?.trim().toUpperCase();

    if (!goid) {
      return NextResponse.json(
        { error: "Missing 'goid' parameter" },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), 'go_metadata', 'filterpaginf2024.csv');
    const csvContent = await fs.readFile(filePath, 'utf8');

    // FIX 2: Apply the interface to the parsed records.
    // Now TypeScript knows exactly what each 'record' looks like.
    const records: NodeInfoRecord[] = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        bom: true,
        trim: true
      });
    
    // FIX 3 (Error on line 29): Remove ': any'. TypeScript now infers the correct type.
    // The 'r' parameter is automatically known to be of type 'NodeInfoRecord'.
    const row = records.find((r) => r.GOID?.trim().toUpperCase() === normalizedGoid);

    if (!row) {
      return NextResponse.json(
        { error: `GOID ${goid} not found` },
        { status: 404 }
      );
    }

    const { NAME, ORGANISM, SIZE, LINK, DESCRIPTION } = row;

    return NextResponse.json({
      name: NAME,
      organism: ORGANISM,
      size: SIZE,
      link: LINK,
      description: DESCRIPTION
    });
  } catch (error) {
    console.error('Error reading node info:', error);
    return NextResponse.json(
      { error: 'Error processing node information' },
      { status: 500 }
    );
  }
}