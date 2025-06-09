// app/home/page.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

import FunctionTabs from "@/components/FunctionTabs";
import Navbar from '@/components/navbar';
import DynamicGraph from "@/components/DynamicGraph";
import AppSidebar from "@/components/AppSidebar";
import MatrixVisualization from "@/components/MatrixVisualization";

import { Edge } from "@/types/edge";
import SummaryDrawer from "@/components/SummaryDrawer";

export default function HomePage() {
  // File selected by user
  const [selectedFile, setSelectedFile] = useState<string>("");
  // Is sidebar open or not?
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  // What is the selected Node?
  const [selectedNode, setSelectedNode] = useState<string>("");
  // What is the selected Function?
  const [selectedFunction, setSelectedFunction] = useState<string>("toden-e");
  // What is the selected Edge?
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  // What is the hoveredEdge?
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  // Keeps track of what clusters each node belongs to for rendering in sidebar and graph.
  const [todenEClusters, setTodenEClusters] = useState<{ clusters: string[][]; sortedNodes: string[]; } | null>(null);
  // What is the hovered Node?
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  // What is the hovered Cluster?
  const [hoveredCluster, setHoveredCluster] = useState<string[] | null>(null);
  // What is the current view?
  const [view, setView] = useState<string>("graph");
  // What edges are available dependent upon current node?
  const [edges, setEdges] = useState<Edge[]>([]);
  // What is the selected Matrix?
  const [selectedMatrix, setSelectedMatrix] = useState<string>("adj");
  // What are the matrix dims?
  const [matrixDims, setMatrixDims] = useState<number[] | null>(null);
  // Used to set the matrix values (so user can download into csv)
  const [matrix, setMatrix] = useState<string[][]>([]);
  // Tracks what the previous view is so when the user exits FunctionTabs it takes you back there.
  const [prevView, setPrevView] = useState<string>("graph");
  // Is summarize drawer open or not?
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  // ?!?!?!
  const [clustersData, setClustersData] = useState<{ clusters: string[] } | null>(null);

  const [tempID, setTempID] = useState<string | null>(null);

  const nodesArray = useMemo(() => {
    if (!clustersData) return [];
    if (!clustersData?.clusters) return [];
    const nodesSet = new Set<string>();
    clustersData.clusters.forEach((cluster: string) => {
      cluster.split(",").forEach((n) => {
        const trimmed = n.trim();
        if (trimmed) nodesSet.add(trimmed);
      });
    });
    return Array.from(nodesSet).map((node) => ({ value: node, label: node }));
  }, [clustersData]);

  useEffect(() => {
    if (nodesArray.length > 0 && !selectedNode) {
      setSelectedNode(nodesArray[0].value);
    }
  }, [nodesArray, selectedNode]);

  // Sets previous view and goes to tabs.
  function handleGoToTabs() {
    setPrevView(view);
    setView("tabs");
  }

  // Sets view to previous view.
  function handleSubmitComplete() {
    setView(prevView);
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
        {view === "tabs" ? (
          <div className="flex flex-row h-full w-full relative">
            <Button
              variant="ghost"
              className="absolute top-4 right-4"
              onClick={() => setView(prevView)}
            >
              <X />
            </Button>
            <FunctionTabs
              setClustersData={setClustersData}
              setSelectedNode={setSelectedNode}
              setSelectedFile={setSelectedFile}
              handleSubmitComplete={handleSubmitComplete}
              setTempID={setTempID}
            />
          </div>
        ) : view == "graph" ? (
          <div className="flex flex-1 flex-row overflow-hidden">
            {sidebarOpen && 
                <AppSidebar 
                  nodes={nodesArray}
                  setSelectedNode={setSelectedNode} 
                  selectedFunction={selectedFunction}
                  setSelectedFunction={setSelectedFunction}
                  setSelectedFile={setSelectedFile}
                  selectedFile={selectedFile}
                  selectedNode={selectedNode}
                  setView={setView}
                  view={view}
                  selectedEdge={selectedEdge}
                  setSelectedEdge={setSelectedEdge}
                  setHoveredEdge={setHoveredEdge}
                  setHoveredNode={setHoveredNode}
                  selectedMatrix={selectedMatrix}
                  setSelectedMatrix={setSelectedMatrix}
                  todenEClusters={todenEClusters}
                  matrixDims={matrixDims}
                  setHoveredCluster={setHoveredCluster}
                  matrix={matrix}
                  edges={edges}
                  setEdges={setEdges}
                  tempID={tempID}
                  setTempID={setTempID}
                  setClustersData={setClustersData}
                />
            }
            <div className="flex flex-1 flex-col">
              <DynamicGraph 
                clustersData={clustersData} 
                selectedNode={selectedNode} 
                selectedFile={selectedFile} 
                setSidebarOpen={setSidebarOpen}
                view={view}
                setView={setView}
                selectedFunction={selectedFunction}
                setSelectedNode={setSelectedNode}
                setSelectedEdge={setSelectedEdge}
                selectedEdge={selectedEdge}
                hoveredEdge={hoveredEdge}
                setHoveredEdge={setHoveredEdge}
                hoveredNode={hoveredNode}
                setHoveredNode={setHoveredNode}
                setDrawerOpen={setDrawerOpen}
                drawerOpen={drawerOpen}
                handleGoToTabs={handleGoToTabs}
                setTodenEClusters={setTodenEClusters}
                todenEClusters={todenEClusters}
                hoveredCluster={hoveredCluster}
                edges={edges}
                setEdges={setEdges}
                tempID={tempID}
              />
              {drawerOpen &&
                <SummaryDrawer 
                  // setDrawerOpen={setDrawerOpen}
                  selectedFunction={selectedFunction} 
                />
              }
            </div>  
          </div>
        ) : view === "matrix" ? (
          <div className="flex flex-row h-full overflow-hidden">
            {sidebarOpen && <AppSidebar 
                              nodes={nodesArray} 
                              setSelectedNode={setSelectedNode} 
                              selectedFunction={selectedFunction}
                              setSelectedFunction={setSelectedFunction}
                              setSelectedFile={setSelectedFile}
                              selectedFile={selectedFile}
                              selectedNode={selectedNode}
                              setView={setView}
                              view={view}
                              selectedEdge={selectedEdge}
                              setSelectedEdge={setSelectedEdge}
                              setHoveredEdge={setHoveredEdge}
                              setHoveredNode={setHoveredNode}
                              selectedMatrix={selectedMatrix}
                              setSelectedMatrix={setSelectedMatrix}
                              todenEClusters={todenEClusters}
                              matrixDims={matrixDims}
                              setHoveredCluster={setHoveredCluster}
                              matrix={matrix}
                              edges={edges}
                              setEdges={setEdges}
                              tempID={tempID}
                              setTempID={setTempID}
                              setClustersData={setClustersData}
                            />
            }
            <MatrixVisualization 
              setSidebarOpen={setSidebarOpen}
              selectedFile={selectedFile}
              view={view}
              selectedMatrix={selectedMatrix}
              handleGoToTabs={handleGoToTabs}
              setMatrixDims={setMatrixDims}
              matrix={matrix}
              setMatrix={setMatrix}
              tempID={tempID}
            />
          </div>
        ) : (null)}
    </div>
  );
}
