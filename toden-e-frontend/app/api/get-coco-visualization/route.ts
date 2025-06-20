import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// Define the shape of the data being returned.
interface SimilarityData {
  GS_A_ID: string;
  GS_B_ID: string;
  SIMILARITY: number;
}

// DEFINE THE SHAPE of the incoming request body for type safety.
interface ApiRequestBody {
  node: string;
  allowedNodes: string[];
}

export async function POST(request: Request) {
  try {
    // 1. Get parameters and apply the type.
    const { node, allowedNodes } = await request.json() as ApiRequestBody;

    // 2. Keep the validation.
    if (!node) {
      return NextResponse.json({ error: 'No node provided' }, { status: 400 });
    }
    if (!allowedNodes || !Array.isArray(allowedNodes) || allowedNodes.length === 0) {
      return NextResponse.json({ error: 'No allowed nodes provided or list is empty' }, { status: 400 });
    }

    // 3. Define the query string with PostgreSQL placeholders ($1, $2).
    const queryText = `
      SELECT 
        gs_a_id AS "GS_A_ID", 
        gs_b_id AS "GS_B_ID", 
        similarity AS "SIMILARITY"
      FROM 
        similarity_scores
      WHERE 
        gs_a_id = $1 AND gs_b_id = ANY($2);
    `;

    // 4. Define the array of values to be safely passed to the query.
    const values = [node, allowedNodes];

    // 5. Execute the query using the sql.query() function.
    const { rows } = await sql.query<SimilarityData>(queryText, values);

    // 6. Return the results directly.
    return NextResponse.json({ results: rows });

  } catch (error) {
    console.error("Error in similarity scores route:", error);
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
  }
}