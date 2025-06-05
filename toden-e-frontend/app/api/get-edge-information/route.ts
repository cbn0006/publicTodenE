import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function POST(req: NextRequest) {
  try {
    const { selectedNode, selectedFile } = await req.json();

    if (!selectedNode || !selectedFile) {
      return NextResponse.json(
        { error: "Missing selectedNode or selectedFile" },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), "go_metadata", 'data', `${selectedFile}Data.csv`);
    const fileContents = await fs.readFile(filePath, "utf-8");

    const lines = fileContents.trim().split("\n");
    const edges = lines
      .map((line) => {
        const [from, to, similarity] = line.split(",");
        return { from, to, similarity: parseFloat(similarity) };
      })
      .filter((edge) => edge.from === selectedNode);

    return NextResponse.json({ edges });
  } catch (error) {
    return NextResponse.json(
      { error: `Error reading file: ${error}` },
      { status: 500 }
    );
  }
}
