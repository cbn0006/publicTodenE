// app/api/predictions/cleanup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { list, del } from '@vercel/blob';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { rows: expiredPredictions } = await sql`
      SELECT id, blob_path_prefix FROM predictions
      WHERE expires_at < NOW() AND status = 'completed';
    `;

    if (expiredPredictions.length === 0) {
      return NextResponse.json({ success: true, message: 'No expired predictions to clean up.' });
    }

    console.log(`Found ${expiredPredictions.length} expired predictions to clean up.`);

    const expiredIds = expiredPredictions.map(p => p.id);
    const prefixes = expiredPredictions.map(p => p.blob_path_prefix).filter(Boolean);

    // Delete all associated files from Vercel Blob
    for (const prefix of prefixes) {
        const { blobs } = await list({ prefix });
        if (blobs.length > 0) {
            const urlsToDelete = blobs.map(b => b.url);
            await del(urlsToDelete);
            console.log(`Deleted ${urlsToDelete.length} blobs for prefix ${prefix}`);
        }
    }

    // --- FIX: Use sql.query() to handle the array of IDs ---
    const deleteQuery = 'DELETE FROM predictions WHERE id = ANY($1::uuid[])';
    await sql.query(deleteQuery, [expiredIds]);
    // --- END FIX ---
    
    console.log(`Cleaned up ${expiredIds.length} records from the database.`);
    return NextResponse.json({ success: true, cleanedUpCount: expiredIds.length });

  } catch (error: unknown) {
    console.error('Error during cleanup cron job:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}