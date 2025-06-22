// scripts/migrate-matrices.mjs
import { put } from '@vercel/blob';
import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';

// --- CONFIGURATION ---
// Load environment variables from your .env.development.local file
dotenv.config({ path: '.env.development.local' });

// The absolute path to your local matrix files
const SOURCE_DIRECTORY = '/Users/codybnic/Development/publicTodenE/toden-e-frontend/go_metadata/matrix';

// The "folder" you want to store these files under in Vercel Blob
const BLOB_PREFIX = 'matrices'; 
// --- END CONFIGURATION ---


async function migrateFiles() {
  console.log(`Starting migration from: ${SOURCE_DIRECTORY}`);

  try {
    const files = await fs.readdir(SOURCE_DIRECTORY);

    if (files.length === 0) {
      console.log('No files found in the source directory. Nothing to migrate.');
      return;
    }

    console.log(`Found ${files.length} files. Beginning upload to Vercel Blob...`);

    for (const file of files) {
      const localFilePath = path.join(SOURCE_DIRECTORY, file);
      const fileContent = await fs.readFile(localFilePath);
      const blobPath = `${BLOB_PREFIX}/${file}`;

      console.log(`Uploading ${file} to blob path: ${blobPath}`);

      const blob = await put(blobPath, fileContent, {
        access: 'public',
        addRandomSuffix: false, // CRITICAL: ensures predictable URLs
      });

      console.log(`  ✅ Uploaded successfully! URL: ${blob.url}`);
    }

    console.log('\nMigration finished!');

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`\n❌ ERROR: The directory "${SOURCE_DIRECTORY}" was not found. Please double-check the path in the script.`);
    } else {
      console.error('\n❌ An unexpected error occurred:', error);
    }
  }
}

migrateFiles();