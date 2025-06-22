// app/api/get-matrix-information/route.ts
import { NextResponse } from 'next/server';
// 1. FIX: Import `list` instead of `get`.
import { list } from '@vercel/blob';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');
    const type = searchParams.get('type') || 'adj';
    const id_type = searchParams.get('id_type');

    if (!file) {
      return NextResponse.json(
        { error: "Missing 'file' parameter" },
        { status: 400 }
      );
    }
    
    let blobPathname: string;
    if (id_type === 'custom') {
      blobPathname = `matrices/${type}_${file}.csv`;
    } else {
      blobPathname = `matrices/${file}_${type}.csv`;
    }

    // 2. FIX: Use `list()` to find the specific blob.
    // We search by the exact pathname and limit the result to 1.
    const { blobs } = await list({
      prefix: blobPathname,
      limit: 1,
    });

    // If no blob is found, or if the found blob doesn't exactly match, return 404.
    if (blobs.length === 0 || blobs[0].pathname !== blobPathname) {
      console.error('Blob file not found:', blobPathname);
      return NextResponse.json(
          { error: 'Matrix file not found.' },
          { status: 404 }
      );
    }

    const targetBlob = blobs[0];

    // 3. FIX: Use `fetch()` to get the blob's content from its public URL.
    const response = await fetch(targetBlob.url);
    if (!response.ok) {
        throw new Error(`Failed to fetch blob: ${response.statusText}`);
    }
    const content = await response.text();

    const rows = content.split('\n').filter(row => row.trim() !== '');
    
    // 4. FIX: Add the `string` type to the 'row' parameter.
    const matrix = rows.map((row: string) => row.split(','));
    
    if (matrix.length === 0 || matrix[0].length === 0) {
        return NextResponse.json(
            { error: 'Matrix is empty or improperly formatted' },
            { status: 500 } // Changed to 500 as this indicates a server-side data issue
        );
    }
    const dims = [matrix.length, matrix[0].length];

    return NextResponse.json({ matrix, dims });

  } catch (error: unknown) {
    console.error('An unexpected error occurred:', error);
    return NextResponse.json(
      { error: 'Error processing matrix file' },
      { status: 500 }
    );
  }
}