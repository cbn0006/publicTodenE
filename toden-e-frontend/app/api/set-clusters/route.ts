// app/api/create-m-type-data/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// This function splits a CSV line correctly, handling commas within quoted fields.
function splitCSV(line: string): string[] {
  return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
}

// This function extracts nodes from the content of a CSV file.
// It assumes the CSV structure:
// - Line 0: Header (e.g., "ID,0,1,2,...") which is skipped.
// - Line 1..n: Data rows (e.g., "AlgorithmName","NodeA,NodeB","NodeC,NodeD",...)
//   where the first column is an identifier/name to be skipped, and subsequent
//   columns contain comma-separated node lists (possibly quoted).
function extractAllowedNodesFromFileContent(datasetContent: string): Set<string> {
  const datasetLines = datasetContent.split('\n').filter(line => line.trim() !== '');
  const nodesSet = new Set<string>();

  for (let i = 1; i < datasetLines.length; i++) { // Start from i=1 to skip header line
    const cols = splitCSV(datasetLines[i]);
    for (let j = 1; j < cols.length; j++) { // Start from j=1 to skip first column (e.g., AlgorithmName)
      const cleaned = cols[j].replace(/"/g, ''); // Remove quotes from node lists
      const tokens = cleaned.split(',').map(s => s.trim()).filter(Boolean);
      tokens.forEach(n => nodesSet.add(n));
    }
  }
  return nodesSet;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fileIdentifier = formData.get('file')?.toString() || ''; // Can be a preset fileName or a custom resultId
    const id_type = formData.get('id_type')?.toString() || 'standard'; // Default to 'standard' if not provided

    if (!fileIdentifier) {
      return NextResponse.json({ error: 'No file identifier provided' }, { status: 400 });
    }
    
    let actualDatasetFilePath;

    if (id_type === 'custom') {
      // For custom type, fileIdentifier is the resultId.
      // Path to the Toden-E output cluster file.
      actualDatasetFilePath = path.join(process.cwd(), 'tmp', 'toden_e_py_outputs', `${fileIdentifier}`, `clusters_${fileIdentifier}.csv`);
      console.log(`create-m-type-data (custom): Reading from ${actualDatasetFilePath}`);
    } else {
      // For standard type, fileIdentifier is the preset fileName.
      actualDatasetFilePath = path.join(process.cwd(), 'go_metadata', 'data', `${fileIdentifier}.csv`);
      console.log(`create-m-type-data (standard): Reading from ${actualDatasetFilePath}`);
    }

    let datasetContent;
    try {
      datasetContent = await fs.readFile(actualDatasetFilePath, 'utf8');
    } catch (err: any) {
      console.error(`Error reading dataset file ${actualDatasetFilePath}: ${err.message}`, err.code);
      if (err.code === 'ENOENT') {
        return NextResponse.json({ error: `Source file for node extraction not found: ${path.basename(actualDatasetFilePath)}` }, { status: 404 });
      }
      return NextResponse.json({ error: 'Error reading source file for node extraction' }, { status: 500 });
    }
    
    const nodesSet = extractAllowedNodesFromFileContent(datasetContent);
    const allowedNodes = Array.from(nodesSet).sort();
    
    const firstNode = allowedNodes[0] || ''; // Select the first node as default
    
    return NextResponse.json({ 
      selectedNode: firstNode, 
      allowedNodes, 
    });

  } catch (error: any) {
    console.error("Error in create-m-type-data route:", error.message);
    return NextResponse.json({ error: 'Error processing request in create-m-type-data route' }, { status: 500 });
  }
}