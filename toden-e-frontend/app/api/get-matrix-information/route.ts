// app/api/get-matrix-information/route.ts
import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file'); // e.g., "leukemia_2_clusters"
    const type = searchParams.get('type') || 'adj'; // "adj" or "con"
    const alpha = searchParams.get('alpha'); // e.g., "0.25" or "0.50"

    if (!file) {
      return NextResponse.json({ error: "Missing 'file' parameter" }, { status: 400 });
    }
    
    let blobPathname: string;

    // --- NEW LOGIC ---
    // Check for the special cases first.

    if (type === 'adj' && file.toLowerCase().startsWith('leukemia')) {
      // If an adjacency matrix for any Leukemia dataset is requested,
      // serve the single shared file.
      blobPathname = 'matrices/leukemia_shared_adj.csv';
      console.log(`Serving shared Leukemia ADJ matrix.`);

    } else if (type === 'con') {
      // If a connectivity matrix is requested, determine which one based on alpha.
      if (alpha === '0.25') {
        blobPathname = 'matrices/con_alpha_0.25.csv';
      } else if (alpha === '0.50' || alpha === '0.5') { // accept both 0.5 and 0.50
        blobPathname = 'matrices/con_alpha_0.50.csv';
      } else {
        // If the 'con' type is requested but alpha is missing or unsupported
        return NextResponse.json({ error: "Missing or invalid 'alpha' parameter for 'con' matrix type" }, { status: 400 });
      }
      console.log(`Serving shared CON matrix for alpha=${alpha}.`);

    } else {
      // Fallback for all other datasets that don't have shared files.
      blobPathname = `matrices/${file}_${type}.csv`;
      console.log(`Serving standard matrix: ${blobPathname}`);
    }
    // --- END NEW LOGIC ---


    const { blobs } = await list({ prefix: blobPathname, limit: 1 });

    if (blobs.length === 0 || blobs[0].pathname !== blobPathname) {
      console.error('Blob file not found:', blobPathname);
      return NextResponse.json({ error: 'Matrix file not found.' }, { status: 404 });
    }

    const targetBlob = blobs[0];
    const response = await fetch(targetBlob.url);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch blob: ${response.statusText}`);
    }
    const content = await response.text();

    const rows = content.split('\n').filter(row => row.trim() !== '');
    const matrix = rows.map((row: string) => row.split(','));
    
    if (matrix.length === 0 || matrix[0].length === 0) {
        return NextResponse.json({ error: 'Matrix is empty or improperly formatted' }, { status: 500 });
    }
    const dims = [matrix.length, matrix[0].length];

    return NextResponse.json({ matrix, dims });

  } catch (error: unknown) {
    console.error('An unexpected error occurred:', error);
    return NextResponse.json({ error: 'Error processing matrix file' }, { status: 500 });
  }
}