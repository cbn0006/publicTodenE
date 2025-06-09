import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

function splitCSV(line: string): string[] {
  return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
}

function extractAllowedNodesFromFileContent(datasetContent: string): Set<string> {
  const datasetLines = datasetContent.split('\n').filter(line => line.trim() !== '');
  const nodesSet = new Set<string>();

  for (let i = 1; i < datasetLines.length; i++) { 
    const cols = splitCSV(datasetLines[i]);
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
    
    let actualDatasetFilePath;

    if (id_type === 'custom') {
      actualDatasetFilePath = path.join(process.cwd(), 'tmp', 'toden_e_py_outputs', `${fileIdentifier}`, `clusters_${fileIdentifier}.csv`);
      console.log(`create-m-type-data (custom): Reading from ${actualDatasetFilePath}`);
    } else {
      actualDatasetFilePath = path.join(process.cwd(), 'go_metadata', 'data', `${fileIdentifier}.csv`);
      console.log(`create-m-type-data (standard): Reading from ${actualDatasetFilePath}`);
    }

    let datasetContent;
    try {
      datasetContent = await fs.readFile(actualDatasetFilePath, 'utf8');
      // FIX (Error on line 48): Change 'any' to 'unknown' and add a type guard.
    } catch (err: unknown) {
      // Safely check for properties before using them.
      if (typeof err === 'object' && err !== null && 'code' in err && 'message' in err) {
        const nodeError = err as { code: string; message: string };
        console.error(`Error reading dataset file ${actualDatasetFilePath}: ${nodeError.message}`, nodeError.code);
        if (nodeError.code === 'ENOENT') {
          return NextResponse.json({ error: `Source file for node extraction not found: ${path.basename(actualDatasetFilePath)}` }, { status: 404 });
        }
      } else {
        console.error(`An unexpected error occurred reading ${actualDatasetFilePath}`, err);
      }
      return NextResponse.json({ error: 'Error reading source file for node extraction' }, { status: 500 });
    }
    
    const nodesSet = extractAllowedNodesFromFileContent(datasetContent);
    const allowedNodes = Array.from(nodesSet).sort();
    
    const firstNode = allowedNodes[0] || '';
    
    return NextResponse.json({ 
      selectedNode: firstNode, 
      allowedNodes, 
    });

    // FIX (Error on line 66): Change 'any' to 'unknown' and use 'instanceof Error' to check the type.
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error in create-m-type-data route:", error.message);
    } else {
      console.error("An unexpected error occurred in create-m-type-data route:", error);
    }
    return NextResponse.json({ error: 'Error processing request in create-m-type-data route' }, { status: 500 });
  }
}