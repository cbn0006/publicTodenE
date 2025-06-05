import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { node, allowedNodes, fileName } = await request.json();
    if (!node) {
      return NextResponse.json({ error: 'No node provided' }, { status: 400 });
    }
    if (!allowedNodes || !Array.isArray(allowedNodes)) {
      return NextResponse.json({ error: 'No allowed nodes provided or invalid' }, { status: 400 });
    }
    if (!fileName) {
      return NextResponse.json({ error: 'No fileName provided' }, { status: 400 });
    }

    const cacheFilePath = path.join(process.cwd(), 'go_metadata', 'data', `${fileName}Data.csv`);
    let cachedRows: any[] = [];
    let cacheExists = false;
    try {
      await fs.access(cacheFilePath);
      cacheExists = true;
      const cacheContent = await fs.readFile(cacheFilePath, 'utf8');
      const lines = cacheContent.split('\n').filter(line => line.trim() !== '');
      const header = lines[0].split(',');
      cachedRows = lines.slice(1).map(line => {
        const cols = line.split(',');
        let obj: any = {};
        header.forEach((key, idx) => {
          obj[key] = cols[idx];
        });
        return obj;
      });
    } catch (err) {
      cacheExists = false;
    }

    let results = cachedRows.filter(item => item['GS_A_ID'] === node && allowedNodes.includes(item['GS_B_ID']));

    if (results.length === 0) {
      const filePath = path.join(process.cwd(), 'go_metadata', 'm_type_biological_process.txt');
      const fileContent = await fs.readFile(filePath, 'utf8');
      const lines = fileContent.split('\n').filter(line => line.trim() !== '');
      const newResults = [];
      
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split('\t');
        
        if (cols[0] === node && allowedNodes.includes(cols[1])) {
          newResults.push({
            GS_A_ID: cols[0],
            GS_B_ID: cols[1],
            SIMILARITY: cols[6]
          });
        }
      }
      results = newResults;
      // Prepare CSV lines to append
      let csvLines = results.map(r => `${r.GS_A_ID},${r.GS_B_ID},${r.SIMILARITY}`).join('\n') + '\n';
      if (cacheExists) {
        await fs.appendFile(cacheFilePath, csvLines, 'utf8');
      } else {
        // Create the file with header and new rows
        const headerLine = 'GS_A_ID,GS_B_ID,SIMILARITY\n';
        await fs.writeFile(cacheFilePath, headerLine + csvLines, 'utf8');
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error in get-visualization route:", error);
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
  }
}
