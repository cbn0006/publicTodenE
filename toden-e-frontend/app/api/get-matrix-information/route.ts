// app/api/get-matrix-information/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');
    const type = searchParams.get('type') || 'adj'; // Default to 'adj' if not provided
    const id_type = searchParams.get('id_type'); // 'custom' or implies 'standard'

    if (!file) {
      return NextResponse.json(
        { error: "Missing 'file' parameter" },
        { status: 400 }
      );
    }
    
    let filePath;
    if (id_type === 'custom') {
      // For custom IDs, 'file' is the tempID (basename)
      // Files are expected to be in tmp/${tempID}_${type}.csv
      filePath = path.join(
        process.cwd(),
        'tmp',
        'toden_e_py_outputs',
        `${file}`,
        'matrix',
        `${type}_${file}.csv`
      );
    } else {
      // Standard pre-generated files
      filePath = path.join(
        process.cwd(),
        'go_metadata',
        'matrix',
        `${file}_${type}.csv`
      );
    }

    const content = await fs.readFile(filePath, 'utf8');
    const rows = content.split('\n').filter(row => row.trim() !== '');
    const matrix = rows.map(row => row.split(','));
    
    if (matrix.length === 0 || matrix[0].length === 0) {
        return NextResponse.json(
            { error: 'Matrix is empty or improperly formatted' },
            { status: 404 } // Or another appropriate status
        );
    }
    const dims = [matrix.length, matrix[0].length];

    return NextResponse.json({ matrix, dims });
  } catch (error: any) {
    console.error('Error reading matrix file:', error.message, error.code);
    // If file not found (ENOENT), return a more specific error
    if (error.code === 'ENOENT') {
        return NextResponse.json(
            { error: 'Matrix file not found.' },
            { status: 404 }
        );
    }
    return NextResponse.json(
      { error: 'Error processing matrix file' },
      { status: 500 }
    );
  }
}