import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import fs from 'fs/promises';
import path from 'path';

function extractAllowedNodesFromFileContent(datasetContent: string): Set<string> {
    const datasetLines = datasetContent.split('\n').filter(line => line.trim() !== '');
    const nodesSet = new Set<string>();
    for (let i = 1; i < datasetLines.length; i++) {
        const cols = datasetLines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        for (let j = 1; j < cols.length; j++) {
            const cleaned = cols[j].replace(/"/g, '');
            const tokens = cleaned.split(',').map(s => s.trim()).filter(Boolean);
            tokens.forEach(n => nodesSet.add(n));
        }
    }
    return nodesSet;
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const fileIdentifier = formData.get('file')?.toString() || '';
        const id_type = formData.get('id_type')?.toString() || 'standard';

        if (!fileIdentifier) {
            return NextResponse.json({ error: 'No file identifier provided' }, { status: 400 });
        }

        const nodesSet = new Set<string>();

        if (id_type === 'standard') {
            const { rows } = await sql`
                SELECT go_ids FROM dataset_clusters WHERE dataset_name = ${fileIdentifier};
            `;

            for (const row of rows) {
                for (const go_id of row.go_ids) {
                    nodesSet.add(go_id);
                }
            }
        } else {
            const actualDatasetFilePath = path.join(process.cwd(), 'tmp', 'toden_e_py_outputs', `${fileIdentifier}`, `clusters_${fileIdentifier}.csv`);
            try {
                const datasetContent = await fs.readFile(actualDatasetFilePath, 'utf8');
                const customNodesSet = extractAllowedNodesFromFileContent(datasetContent);
                customNodesSet.forEach(node => nodesSet.add(node));
            } catch (err) {
                return NextResponse.json({ error: 'Custom source file not found' }, { status: 404 });
            }
        }

        const allowedNodes = Array.from(nodesSet).sort();
        const firstNode = allowedNodes[0] || '';

        return NextResponse.json({
            selectedNode: firstNode,
            allowedNodes,
        });

    } catch (error) {
        return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
    }
}