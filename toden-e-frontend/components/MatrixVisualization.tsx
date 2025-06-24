"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { TableOfContents } from "lucide-react";
import { FixedSizeGrid as Grid } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

// 1. UPDATE THE PROPS INTERFACE
interface MatrixVisualizationProps {
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  selectedFile: string;
  view: string;
  selectedMatrix: string;
  handleGoToTabs: () => void;
  setMatrixDims: (dimensions: number[] | null) => void;
  matrix: string[][];
  setMatrix: (matrix: string[][]) => void;
  tempID: string | null;
  alpha: string;
}

export default function MatrixVisualization({ 
  setSidebarOpen,
  selectedFile,
  view,
  selectedMatrix,
  handleGoToTabs,
  setMatrixDims,
  matrix,
  setMatrix,
  tempID,
  alpha // 2. RECEIVE THE PROP
}: MatrixVisualizationProps) {

  useEffect(() => {
    if (view !== "matrix") return;

    async function fetchMatrix() {
      let fileToFetch = selectedFile;
      let apiPath = `/api/get-matrix-information?type=${encodeURIComponent(selectedMatrix)}`;

      if (selectedMatrix === 'con') {
        if (!alpha) {
          console.error("Cannot fetch 'con' matrix without an alpha value.");
          setMatrix([]);
          setMatrixDims(null);
          return;
        }
        apiPath += `&alpha=${encodeURIComponent(alpha)}`;
      }

      if (selectedFile === "custom") {
        if (tempID && tempID !== "Invalid") {
          fileToFetch = tempID;
          apiPath += `&file=${encodeURIComponent(fileToFetch)}&id_type=custom`;
        } else {
          setMatrix([]);
          setMatrixDims(null);
          console.log("Custom file selected, but Temp ID is invalid or not set. Cleared matrix.");
          return;
        }
      } else {
        if (!selectedFile) {
            setMatrix([]);
            setMatrixDims(null);
            return;
        }
        apiPath += `&file=${encodeURIComponent(fileToFetch)}`;
      }
      
      try {
        console.log("Fetching matrix from:", apiPath); // Log the final path for debugging
        const response = await fetch(apiPath);
        if (!response.ok) {
          console.error("Failed to fetch matrix data:", response.status, await response.text());
          setMatrix([]);
          setMatrixDims(null);
          return;
        }
        const data = await response.json();
        if (data.error) {
            console.error("Error from API:", data.error);
            setMatrix([]);
            setMatrixDims(null);
            return;
        }
        setMatrix(data.matrix || []);
        setMatrixDims(data.dims || null);
      } catch (error) {
        console.error("Error fetching matrix:", error);
        setMatrix([]);
        setMatrixDims(null);
      }
    }
    fetchMatrix();
  }, [selectedFile, view, selectedMatrix, tempID, setMatrix, setMatrixDims, alpha]); // 4. ADD currentAlpha TO THE DEPENDENCY ARRAY

  const rowHeight = 35;
  const columnWidth = 100;
  const rowCount = matrix.length;
  const columnCount = matrix[0]?.length || 0;

  return (
    <div className="flex flex-1 overflow-hidden relative">
      <div className="flex absolute top-4 left-4 z-10 space-x-1">
        <Button onClick={
            () => setSidebarOpen((prev: boolean) => !prev)} 
            variant="outline"
        >
          <TableOfContents />
        </Button>
        <Button onClick={handleGoToTabs} variant="outline">
          Select Functionality
        </Button>
      </div>
      {(selectedFile !== "" && !(selectedFile === "custom" && (!tempID || tempID === "Invalid"))) && rowCount > 0 ? (
        <div className="mt-16 flex-1 p-2">
          <AutoSizer>
            {({ height, width }) => (
              <Grid
                columnCount={columnCount}
                columnWidth={columnWidth}
                height={height}
                rowCount={rowCount}
                rowHeight={rowHeight}
                width={width}
                itemKey={({ rowIndex, columnIndex }) => `${rowIndex}-${columnIndex}`}
              >
                {
                  ({ columnIndex, rowIndex, style }) => (
                  <div style={style} className="border p-1 whitespace-nowrap overflow-hidden text-ellipsis">
                    {isNaN(Number(matrix[rowIndex][columnIndex]))
                      ? matrix[rowIndex][columnIndex]
                      : Number(matrix[rowIndex][columnIndex]).toFixed(5)}
                  </div>
                )}
              </Grid>
            )}
          </AutoSizer>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center font-semibold text-xl">
          {selectedFile === "custom" && (!tempID || tempID === "Invalid") 
            ? "Please enter and submit a valid Custom ID in the sidebar." 
            : "Choose a file to view matrix or ensure data is available."}
        </div>
      )}
    </div>
  );
}