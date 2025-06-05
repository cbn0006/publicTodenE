import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';

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

    const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        bom: true,
        trim: true
      });
    
    const row = records.find((r: any) => r.GOID?.trim().toUpperCase() === normalizedGoid);

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
