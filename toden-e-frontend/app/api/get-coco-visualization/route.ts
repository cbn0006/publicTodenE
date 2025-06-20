import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// Define the shape of the data being returned.
// This ensures type safety and matches your original API's output.
interface SimilarityData {
  GS_A_ID: string;
  GS_B_ID: string;
  SIMILARITY: number;
}

export async function POST(request: Request) {
  try {
    // 1. Get the parameters from the request body.
    // The 'fileName' parameter is no longer needed.
    const { node, allowedNodes } = await request.json();

    // 2. Keep the validation to ensure the frontend sends the correct data.
    if (!node) {
      return NextResponse.json({ error: 'No node provided' }, { status: 400 });
    }
    if (!allowedNodes || !Array.isArray(allowedNodes) || allowedNodes.length === 0) {
      return NextResponse.json({ error: 'No allowed nodes provided or list is empty' }, { status: 400 });
    }

    // 3. Construct and execute a single, efficient database query.
    // This replaces all file reading, parsing, and caching logic.
    const { rows } = await sql<SimilarityData>`
      SELECT 
        gs_a_id AS "GS_A_ID", 
        gs_b_id AS "GS_B_ID", 
        similarity AS "SIMILARITY"
      FROM 
        similarity_scores
      WHERE 
        gs_a_id = ${node} AND gs_b_id = ANY(${allowedNodes});
    `;

    // The 'rows' variable now contains the exact results.
    // The SQL query aliases the lowercase column names (e.g., gs_a_id)
    // to uppercase ("GS_A_ID") to match your original API response.

    // 4. Return the results directly.
    return NextResponse.json({ results: rows });

  } catch (error) {
    console.error("Error in similarity scores route:", error);
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
  }
}