import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
// import fs from 'fs/promises';
// import path from 'path';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fileIdentifier = searchParams.get('file');
        const id_type = searchParams.get('id_type');

        if (!fileIdentifier) {
            return NextResponse.json({ error: "Missing 'file' parameter" }, { status: 400 });
        }

        if (id_type === 'standard') {
            const { rows } = await sql`
                SELECT algorithm_name, go_ids 
                FROM dataset_clusters 
                WHERE dataset_name = ${fileIdentifier} 
                ORDER BY cluster_id ASC;
            `;

            if (rows.length === 0) {
                return NextResponse.json({ error: 'Visualization data not found for this dataset.' }, { status: 404 });
            }

            const algorithm = rows[0].algorithm_name;
            const numClusters = rows.length;
            const clusters: string[][] = rows.map(row => row.go_ids);

            const allNodesSet = new Set<string>();
            clusters.forEach(cluster => {
                cluster.forEach(node => allNodesSet.add(node));
            });
            const sortedNodes = Array.from(allNodesSet).sort();

            return NextResponse.json({
                algorithm,
                clusters,
                sortedNodes,
                numClusters,
            });

        } else {
            // const filePath = path.join(process.cwd(), 'tmp', 'toden_e_py_outputs', `${fileIdentifier}`, `clusters_${fileIdentifier}.csv`);
            // const fileContent = await fs.readFile(filePath, 'utf8');
            // ... your existing custom file parsing logic here ...
            return NextResponse.json({ message: "Custom logic would run here" });
        }

    } catch {
        return NextResponse.json({ error: 'Error processing Toden-E visualization data' }, { status: 500 });
    }
}