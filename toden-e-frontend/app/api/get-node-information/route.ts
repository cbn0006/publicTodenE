import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const goid = searchParams.get('goid');

    // Keep the parameter validation
    if (!goid) {
      return NextResponse.json(
        { error: "Missing 'goid' parameter" },
        { status: 400 }
      );
    }

    // 2. Replace the entire file-reading block with a single database query.
    // This query is parameterized, which prevents SQL injection attacks.
    const { rows } = await sql`
      SELECT name, organism, size, link, description 
      FROM pag_info 
      WHERE goid = ${goid};
    `;
    
    // 3. Get the first row from the result.
    // Since 'goid' is a primary key, this will either be one row or undefined.
    const nodeInfo = rows[0];

    // Keep the "not found" check
    if (!nodeInfo) {
      return NextResponse.json(
        { error: `GOID ${goid} not found` },
        { status: 404 }
      );
    }
    
    // 4. Return the data directly from the database record.
    return NextResponse.json({
      name: nodeInfo.name,
      organism: nodeInfo.organism,
      size: nodeInfo.size,
      link: nodeInfo.link,
      description: nodeInfo.description
    });

  } catch (error) {
    // Updated error message for clarity
    console.error('Database query failed:', error);
    return NextResponse.json(
      { error: 'Internal server error while querying the database' },
      { status: 500 }
    );
  }
}