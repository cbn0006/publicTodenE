import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

// The serverless /tmp directory is the only writable path
const TMP_DIR = '/tmp';

// This function now just runs the Python script and reports success/failure.
// The Python script is responsible for uploading its own files to Vercel Blob.
function runPythonPredictScript(
  inputFilePath: string,
  alpha: string,
  clusters: string,
  resultId: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(process.cwd(), 'python_scripts', 'runner.py');
    const args = [pythonScriptPath, inputFilePath, alpha, clusters, resultId];

    console.log(`Spawning Python: python3 ${args.join(' ')}`);
    const pythonProcess = spawn('python3', args);
    
    let stdout = '';
    let stderr = '';
    pythonProcess.stdout.on('data', (data) => (stdout += data.toString()));
    pythonProcess.stderr.on('data', (data) => (stderr += data.toString()));

    pythonProcess.on('close', (code) => {
      console.log(`Python script for ${resultId} finished with code ${code}.`);
      if (stderr) console.error(`[Python STDERR for ${resultId}]: ${stderr}`);
      
      if (code !== 0) {
        return reject(new Error(`Python script exited with code ${code}. ${stderr}`));
      }
      try {
        // The script should print a simple JSON status on its last line
        const lastLine = stdout.trim().split('\n').pop() || '{}';
        const result = JSON.parse(lastLine);
        resolve(result);
      } catch {
        reject(new Error(`Failed to parse Python output. Raw stdout: ${stdout}`));
      }
    });
  });
}

export async function POST(request: NextRequest) {
  const resultId = uuidv4();
  let tempInputFilePath: string | null = null;

  try {
    const formData = await request.formData();
    const fileUpload = formData.get('fileUpload') as File | null;
    const alpha = formData.get('alpha') as string;
    const clusters = formData.get('clusters') as string;

    if (!fileUpload || !alpha || !clusters) {
      return NextResponse.json({ error: 'Missing required form fields (fileUpload, alpha, clusters).' }, { status: 400 });
    }

    // --- Step 1: Create the initial job record in the database ---
    await sql`
      INSERT INTO predictions (id, status, original_filename, params, blob_path_prefix, expires_at)
      VALUES (
        ${resultId},
        'processing',
        ${fileUpload.name},
        ${JSON.stringify({ alpha, clusters })},
        ${`predictions/${resultId}/`},
        NOW() + INTERVAL '1 hour'
      );
    `;
    console.log(`[${resultId}] Job record created in database.`);

    // --- Step 2: Save uploaded file to the /tmp directory to pass to Python ---
    tempInputFilePath = path.join(TMP_DIR, `${resultId}_${fileUpload.name}`);
    const fileBuffer = Buffer.from(await fileUpload.arrayBuffer());
    await fs.writeFile(tempInputFilePath, fileBuffer);
    console.log(`[${resultId}] User file saved to ${tempInputFilePath}`);

    // --- Step 3: Run the Python script ---
    // The script will now perform its own uploads to Vercel Blob
    const pythonResult = await runPythonPredictScript(tempInputFilePath, alpha, clusters, resultId);

    if (!pythonResult.success) {
      throw new Error(pythonResult.error || 'The Python script reported a failure.');
    }
    
    // --- Step 4: Finalize the job status in the database ---
    await sql`
      UPDATE predictions SET status = 'completed' WHERE id = ${resultId};
    `;
    console.log(`[${resultId}] Job status updated to 'completed'.`);

    // The 'generateMTypeRelatedDataFile' logic is removed.
    // This heavy processing should be done beforehand and stored in the database,
    // or moved into your Python data pipeline.

    return NextResponse.json({ success: true, resultId: resultId });

  } catch (error: unknown) {
    console.error(`[${resultId}] An error occurred:`, error);
    // --- Step 5: If anything fails, mark the job as 'failed' in the database ---
    await sql`
      UPDATE predictions SET status = 'failed' WHERE id = ${resultId};
    `;
    return NextResponse.json({ success: false || 'An internal server error occurred.', resultId }, { status: 500 });
  } finally {
    // --- Step 6: Clean up the temporary input file ---
    if (tempInputFilePath) {
      await fs.unlink(tempInputFilePath).catch(err => console.error(`Failed to delete temp file ${tempInputFilePath}:`, err));
    }
  }
}