import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');
    const id_type = searchParams.get('id_type');

    if (!file) {
      return NextResponse.json(
        { error: "Missing 'file' parameter" },
        { status: 400 }
      );
    }

    let filePath;
    if (id_type === 'custom') {
      
      filePath = path.join(
        process.cwd(),
        'tmp',
        'toden_e_py_outputs',
        `${file}`,
        `clusters_${file}.csv`
      );
      console.log(`Custom file path (toden-e-visualization): ${filePath}`);
    } else {
      
      filePath = path.join(process.cwd(), 'go_metadata', 'data', `${file}.csv`);
      console.log(`Standard file path (toden-e-visualization): ${filePath}`);
    }

    const fileContent = await fs.readFile(filePath, 'utf8');

    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'File does not contain enough data for Toden-E visualization.' },
        { status: 400 }
      );
    }

    const splitCSV = (line: string) =>
      line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

    const headers = splitCSV(lines[0]).map(h => h.trim());
    const numClusters = headers.length - 1;

    const dataRow = splitCSV(lines[1]);
    const algorithm = dataRow[0].trim();

    const clusters: string[][] = [];
    for (let i = 1; i < dataRow.length; i++) {
      const cleaned = dataRow[i].trim().replace(/^"|"$/g, '');
      const clusterNodes = cleaned.split(',').map(node => node.trim()).filter(Boolean);
      clusters.push(clusterNodes);
    }

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

  } catch (error: unknown) { // FIX: Changed 'any' to 'unknown'
    // By checking the error's structure, we can safely access its properties.
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const nodeError = error as { code: string; message: string };
      console.error('Error in get-toden-e-visualization API:', nodeError.message, nodeError.code);
      
      if (nodeError.code === 'ENOENT') {
        return NextResponse.json(
          { error: 'Toden-E visualization data file not found.' },
          { status: 404 }
        );
      }
    } else {
      // Fallback for unexpected error types
      console.error('An unexpected error occurred in get-toden-e-visualization API:', error);
    }
    
    return NextResponse.json(
      { error: 'Error processing Toden-E visualization data file' },
      { status: 500 }
    );
  }
}