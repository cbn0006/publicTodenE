"use client";

import React, { useMemo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Plus, Minus, TableOfContents, Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Edge } from "@/types/edge";
import { UMAP } from "umap-js";
import seedrandom from "seedrandom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DynamicGraphProps {
  clustersData: { clusters: string[] } | null;
  selectedNode: string;
  selectedFile: string | null;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  view: string;
  setView: (view: string) => void;
  selectedFunction: string;
  setSelectedNode: (view: string) => void;
  setSelectedEdge: (edge: Edge) => void;
  selectedEdge: Edge | null;
  hoveredEdge: string | null;
  setHoveredEdge: (edge: string | null) => void;
  hoveredNode: string | null;
  setHoveredNode: (node: string | null) => void;
  setDrawerOpen: (open: boolean) => void;
  drawerOpen: boolean;
  handleGoToTabs: () => void;
  setTodenEClusters: (clusters: { clusters: string[][]; sortedNodes: string[] } | null) => void;
  todenEClusters: { clusters: string[][]; sortedNodes: string[] } | null;
  hoveredCluster: string[] | null;
  edges: Edge[];
  setEdges: (edges: Edge[]) => void;
  tempID: string | null;
}

interface CoCoNode {
  GS_A_ID: string;
  GS_B_ID: string;
  SIMILARITY: string;
}

export default function DynamicGraph({ 
    clustersData, 
    selectedNode, 
    selectedFile, 
    setSidebarOpen, 
    view,
    // setView, 
    selectedFunction,
    setSelectedNode,
    setSelectedEdge,
    selectedEdge,
    hoveredEdge,
    setHoveredEdge,
    hoveredNode,
    setHoveredNode,
    // setDrawerOpen,
    // drawerOpen,
    handleGoToTabs,
    setTodenEClusters,
    todenEClusters,
    hoveredCluster,
    // edges,
    setEdges,
    tempID
  }: DynamicGraphProps) {

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [cocoData, setCocoData] = useState<CoCoNode[] | null>(null);
  const [umapCoords, setUmapCoords] = useState<number[][]>([]);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [nodeCardOpen, setNodeCardOpen] = useState<boolean>(false);
  const [nodeDetails, setNodeDetails] = useState<{
    name: string;
    organism: string;
    size: string;
    link: string;
    description: string;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const overlayWidth = dimensions ? dimensions.width : (containerRef.current ? containerRef.current.clientWidth : 1000);
  const overlayHeight = dimensions ? dimensions.height : (containerRef.current ? containerRef.current.clientHeight : 800);
  const centerX = dimensions ? dimensions.width / 2 : overlayWidth / 2;
  const centerY = dimensions ? dimensions.height / 2 : overlayHeight / 2;

  const surroundingNodes = useMemo(() => {
    if (!cocoData || cocoData.length === 0) return [];
  
    return cocoData.map((item: CoCoNode, index: number) => {
      const sim = parseFloat(item.SIMILARITY);
      const radius = 100 + 325 * (1 - sim);
      const angle = (2 * Math.PI * index) / cocoData.length;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return { ...item, x, y, normSim: sim };
    });
  }, [cocoData, centerX, centerY]);

  useEffect(() => {
    if (selectedFunction === "CoCo" && selectedNode && dimensions) {
      if (surroundingNodes.length > 0) {
        const newEdges: Edge[] = surroundingNodes.map((node: { GS_B_ID: string; normSim: number; x: number; y: number; }) => ({
        from: selectedNode,
        to: node.GS_B_ID,
        similarity: node.normSim,
        x: (centerX + node.x) / 2,
        y: (centerY + node.y) / 2,
      }));
        setEdges(newEdges);
      } 
      else if (cocoData && cocoData.length === 0) {
        setEdges([]);
      }
    } 
    else if (selectedFunction !== "CoCo") {
    
    }
  }, [selectedFunction, surroundingNodes, selectedNode, setEdges, centerX, centerY, cocoData, dimensions]);

  // Measure container dimensions once the component mounts.
  useLayoutEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    }
  }, []);

  const fetchCocoData = async () => {
    try {
      const allowedNodes = clustersData
        ? clustersData.clusters
            .flatMap((cluster) => cluster.split(",").map((n) => n.trim()))
            .filter((n) => n !== "")
        : [];
      const response = await fetch("/api/get-coco-visualization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ node: selectedNode, allowedNodes, fileName: selectedFile }),
      });
      if (!response.ok) {
        const text = await response.text();
        console.error("Error response:", text);
        throw new Error("Error fetching CoCo data");
      }
      const data = await response.json();
      console.log("CoCo Data", data.results);
      setCocoData(data.results);
    } catch (error) {
      console.error("Error fetching CoCo visualization data:", error);
    }
  };

  useEffect(() => {
    const fetchNodeDetails = async () => {
      if (!selectedNode || (selectedFunction !== "toden-e" && selectedFunction !== "CoCo")) {
        setNodeDetails(null);
        return;
      }
  
      try {
        const res = await fetch(`/api/get-node-information?goid=${encodeURIComponent(selectedNode)}`);
        if (!res.ok) {
          console.warn(`No node data found for GOID: ${selectedNode}`);
          setNodeDetails(null);
          return;
        }
        const data = await res.json();
        setNodeDetails(data);
      } catch (error) {
        console.error("Error fetching node details:", error);
        setNodeDetails(null);
      }
    };
  
    fetchNodeDetails();
  }, [selectedNode, selectedFunction]);

  const fetchConMatrixAndComputeUMAP = async () => {
    let fileToFetch: string | null;
    let idTypeForApi: 'standard' | 'custom';

    if (selectedFile === "custom") {
      if (!tempID || tempID === "Invalid") {
        console.error("fetchConMatrixAndComputeUMAP: 'custom' mode selected, but valid tempID is not available.");
        setUmapCoords([]);
        return;
      }
      fileToFetch = tempID;
      idTypeForApi = 'custom';
    } else if (selectedFile) {
      fileToFetch = selectedFile;
      idTypeForApi = 'standard';
    } else {
      console.log("fetchConMatrixAndComputeUMAP: No file selected (selectedFile is null or empty).");
      setUmapCoords([]);
      return;
    }

    try {
      const queryParams = new URLSearchParams({
        file: fileToFetch,
        type: 'con',
        id_type: idTypeForApi
      });

      const apiPath = `/api/get-matrix-information?${queryParams.toString()}`;
      console.log("Fetching matrix for UMAP from:", apiPath);

      const response = await fetch(apiPath);

      if (!response.ok) {
        const text = await response.text();
        console.error("Error response from get-matrix-information:", response.status, text);
        setUmapCoords([]);
        return;
      }

      const data = await response.json();

      if (data.error) {
        console.error("API returned an error for get-matrix-information:", data.error);
        setUmapCoords([]);
        return;
      }

      if (!data.matrix || data.matrix.length === 0) {
        console.error("Fetched matrix is empty or undefined from get-matrix-information.");
        setUmapCoords([]);
        return;
      }

      const conMatrix = data.matrix.map((row: string[]) => row.map((cell: string) => parseFloat(cell)));

      if (conMatrix.some((row: number[]) => row.some(isNaN))) {
        console.error("Matrix for UMAP contains NaN values after parsing.");
        setUmapCoords([]);
        return;
      }
      if (conMatrix.length === 0) {
          console.error("Matrix for UMAP is effectively empty after parsing.");
          setUmapCoords([]);
          return;
      }
      
      const rng = seedrandom("toden-e-layout-v1");
      const umapNeighborsSetting = 15;
      const umapInstance = new UMAP({ 
        nComponents: 2, 
        nNeighbors: umapNeighborsSetting,
        minDist: 0.1, 
        random: rng 
      });
      
      if (conMatrix.length > 0 && conMatrix.length < umapNeighborsSetting + 1) {
          console.warn(`Matrix for UMAP has ${conMatrix.length} data points, which is less than UMAP nNeighbors+1 (${umapNeighborsSetting + 1}). UMAP results might be suboptimal or error out.`);
      }
      
      const coords = umapInstance.fit(conMatrix);
      console.log("Computed UMAP coordinates:", coords);
      setUmapCoords(coords);

    } catch (error) {
      console.error("Error in fetchConMatrixAndComputeUMAP:", error);
      setUmapCoords([]);
    }
  };

  const fetchTodenEClusters = async () => {
    let fileToUse;
    let idTypeForApi;

    if (selectedFile === "custom") {
      if (!tempID) {
        console.error("fetchTodenEClusters: selectedFile is 'custom' but tempID (custom result ID) is not available.");
        setTodenEClusters(null);
        return;
      }
      fileToUse = tempID;
      idTypeForApi = 'custom';
    } 
    else {
      if (!selectedFile) {
        console.error("fetchTodenEClusters: selectedFile is not 'custom' and is not set.");
        setTodenEClusters(null);
        return;
      }
      fileToUse = selectedFile;
      idTypeForApi = 'standard';
    }

    try {
      const queryParams = new URLSearchParams({
        file: fileToUse,
        id_type: idTypeForApi
      });

      const response = await fetch(`/api/get-toden-e-visualization?${queryParams.toString()}`, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from /api/get-toden-e-visualization (${response.status}):`, errorText);
        throw new Error(`Failed to fetch Toden‑E cluster data. Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Toden‑E Cluster Data fetched successfully:", data);
      setTodenEClusters(data);

    } catch (error) {
      console.error("Error in fetchTodenEClusters:", error);
      setTodenEClusters(null);
    }
  };

  useEffect(() => {
    if (view !== "graph") {
      setTodenEClusters(null);
      return;
    }
    
    if (!selectedNode || !selectedFile) {
      console.log("useEffect: Prerequisites (selectedNode, selectedFile) not met.");
      setTodenEClusters(null);
      return;
    }
    
    if (selectedFunction === "CoCo") {
      fetchCocoData();
      setTodenEClusters(null);
    } else if (selectedFunction === "toden-e") {
      fetchConMatrixAndComputeUMAP();
      fetchTodenEClusters();
    } else if (selectedFunction === "toden-e-2") {
      setTodenEClusters(null);
    } else {
      setTodenEClusters(null);
    }

  }, [view, selectedFunction, selectedNode, selectedFile, tempID, clustersData]);

  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scale > 1) {
      isDraggingRef.current = true;
      lastPosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    const newOffset = { x: offset.x + dx, y: offset.y + dy };
    if (containerRef.current) {
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const minX = cw - cw * scale;
      const minY = ch - ch * scale;
      newOffset.x = clamp(newOffset.x, minX, 0);
      newOffset.y = clamp(newOffset.y, minY, 0);
    }
    setOffset(newOffset);
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const openNodeCard = () => { setNodeCardOpen(!nodeCardOpen) };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = -e.deltaY;
    let newScale = delta > 0 ? scale * 1.1 : scale * 0.9;
    newScale = Math.min(Math.max(newScale, 1), 5.0);
    const factor = newScale / scale - 1;
    let newOffsetX = offset.x - factor * mx;
    let newOffsetY = offset.y - factor * my;
    if (containerRef.current) {
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const minX = cw - cw * newScale;
      const minY = ch - ch * newScale;
      newOffsetX = clamp(newOffsetX, minX, 0);
      newOffsetY = clamp(newOffsetY, minY, 0);
    }
    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  const handleZoomIn = () => {
    let newScale = scale * 1.1;
    newScale = Math.min(newScale, 5.0);
    setScale(newScale);
    if (containerRef.current) {
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const minX = cw - cw * newScale;
      const minY = ch - ch * newScale;
      setOffset((prev) => ({
        x: clamp(prev.x, minX, 0),
        y: clamp(prev.y, minY, 0),
      }));
    }
  };

  const handleZoomOut = () => {
    let newScale = scale * 0.9;
    newScale = Math.max(newScale, 1);
    setScale(newScale);
    if (newScale === 1) {
      setOffset({ x: 0, y: 0 });
    } else if (containerRef.current) {
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const minX = cw - cw * newScale;
      const minY = ch - ch * newScale;
      setOffset((prev) => ({
        x: clamp(prev.x, minX, 0),
        y: clamp(prev.y, minY, 0),
      }));
    }
  };

  const getColorForSimilarity = (sim: number) => {

    const hue = sim * 120;
    return `hsl(${hue}, 100%, 50%)`;
  };

  if (!dimensions) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center relative">
        <div className="text-white text-lg font-bold">Loading...</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      style={{ cursor: scale > 1 ? (isDraggingRef.current ? "grabbing" : "grab") : "default" }}
    >
      {!clustersData && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-lg font-bold z-10">
          No graph data available
        </div>
      )}
      <div className="flex absolute top-4 left-4 z-10 items-start space-x-1">
        <Button
            onClick={() => setSidebarOpen((prev: boolean) => !prev)}
            variant="outline"
          >
          <TableOfContents/>
        </Button>
        <Button
            onClick={handleGoToTabs}
            variant="outline"
          >
          Select Functionality
        </Button>
        {selectedFunction === "toden-e" && todenEClusters && (
          <Card>
            <CardHeader>
              <CardTitle>Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {todenEClusters.clusters?.map((_, idx) => {
                const clusterColors = ["red", "green", "blue", "orange", "purple", "cyan", "magenta", "yellow"];
                const color = clusterColors[idx % clusterColors.length];
                return (
                  <div key={idx} className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                    <span>Cluster {idx + 1}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
      {/* <Button
        //@ts-ignore
          onClick={() => setDrawerOpen(prev => !prev)}
          className="absolute bottom-4 right-4 z-10"
          variant="outline"
        >
        {drawerOpen ? <ChevronDown /> : <ChevronUp />}
      </Button> */}
      {/* Transformed Container: Background and Graph Content Scale Together */}
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "top left",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "#2f2f2f",
            backgroundImage: "radial-gradient(circle, #fff 1.25px, transparent 0)",
            backgroundSize: "25px 25px",
          }}
        />
        {/* Overlay: Central and Surrounding Nodes */}
        {clustersData && (
          selectedFunction === "CoCo" ? (
            <>
              {/* SVG for edges from the central node to each surrounding node */}
              <svg className="absolute inset-0" width={overlayWidth} height={overlayHeight}>
                  {surroundingNodes.map((node, idx: number) => {
                    // Assume node.GS_B_ID uniquely identifies the edge's target.
                    const isSelected = selectedEdge && selectedEdge.to === node.GS_B_ID;
                    const isHovered = hoveredEdge === node.GS_B_ID;
                    const strokeColor = isSelected || isHovered ? "blue" : "black";

                    return (
                      <line
                        key={idx}
                        x1={centerX}
                        y1={centerY}
                        x2={node.x}
                        y2={node.y}
                        stroke={strokeColor}
                        strokeWidth="2"
                        style={{ pointerEvents: 'visibleStroke', cursor: 'pointer' }}
                        onClick={() =>
                          setSelectedEdge({
                            from: selectedNode,
                            to: node.GS_B_ID,
                            similarity: Number(node.SIMILARITY),
                            x: (centerX + node.x) / 2,
                            y: (centerY + node.y) / 2,
                          })
                        }
                        onMouseEnter={() => setHoveredEdge(node.GS_B_ID)}
                        onMouseLeave={() => setHoveredEdge(null)}
                      />
                    );
                  })}
                </svg>
              {/* Fixed Central Node */}
              <div className="absolute" style={{ left: centerX - 40, top: centerY - 20 }}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button className="border-2 border-black text-sm px-2 py-1 pointer-events-auto">
                        {selectedNode}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {selectedNode}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {/* Surrounding Nodes as Buttons */}
              {surroundingNodes.map((node, idx: number) => (
                <div
                  key={idx}
                  className="absolute pointer-events-auto"
                  style={{ left: node.x - 30, top: node.y - 15 }}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="border-2 border-black text-xs px-2 py-1"
                          style={{ backgroundColor: getColorForSimilarity(node.normSim) }}
                          onClick={() => setSelectedNode(node.GS_B_ID)}
                        >
                          {node.GS_B_ID}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{node.GS_B_ID}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ))}
            </>
          ) : selectedFunction === "toden-e" ? (
            <>
              {umapCoords.length > 0 && todenEClusters && todenEClusters.sortedNodes ? (
                (() => {
                  const margin = 100;
                  const { width, height } = dimensions!;
                  
                  
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const xs = umapCoords.map(([x, _]) => x);
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const ys = umapCoords.map(([_, y]) => y);
                  const minX = Math.min(...xs);
                  const maxX = Math.max(...xs);
                  const minY = Math.min(...ys);
                  const maxY = Math.max(...ys);
                  
                  const bboxWidth = maxX - minX;
                  const bboxHeight = maxY - minY;
                  
                  
                  const availableWidth = width - 2 * margin;
                  const availableHeight = height - 2 * margin;
                  
                  
                  const newScaleFactor = Math.min(availableWidth / bboxWidth, availableHeight / bboxHeight);
                  
                  
                  const offsetX = margin + (availableWidth - bboxWidth * newScaleFactor) / 2 - newScaleFactor * minX;
                  const offsetY = margin + (availableHeight - bboxHeight * newScaleFactor) / 2 - newScaleFactor * minY;
                  
                  return umapCoords.map((coord, index) => {
                    const sortedNodes: string[] = todenEClusters.sortedNodes;
                    const nodeId = sortedNodes[index];
                    
                    let clusterIndex = -1;
                    if (todenEClusters.clusters && Array.isArray(todenEClusters.clusters)) {
                      for (let i = 0; i < todenEClusters.clusters.length; i++) {
                        if (todenEClusters.clusters[i].includes(nodeId)) {
                          clusterIndex = i;
                          break;
                        }
                      }
                    }
                    const clusterColors = ["red", "green", "blue", "orange", "purple", "cyan", "magenta", "yellow"];
                    const color = clusterIndex >= 0 ? clusterColors[clusterIndex % clusterColors.length] : "red";

                    const isInHoveredCluster = hoveredCluster?.includes(nodeId);
                    const isActive = hoveredNode === nodeId || selectedNode === nodeId || isInHoveredCluster;

                    const borderStyle = isActive ? "3px solid white" : "2px solid black";
              
                    
                    const xPos = coord[0] * newScaleFactor + offsetX;
                    const yPos = coord[1] * newScaleFactor + offsetY;
              
                    return (
                      <TooltipProvider key={index}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              style={{
                                position: "absolute",
                                left: `${xPos}px`,
                                top: `${yPos}px`,
                                backgroundColor: color,
                                width: "20px",
                                height: "20px",
                                padding: 0,
                                border: borderStyle,
                                borderRadius: "50%",
                              }}
                              onMouseEnter={() => setHoveredNode(nodeId)}
                              onMouseLeave={() => setHoveredNode(null)}
                              onClick={() => setSelectedNode(nodeId)}
                            />
                          </TooltipTrigger>
                          <TooltipContent>{nodeId}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  });
                })()
              ) : (
                <div className="text-white">Loading visualization...</div>
              )}
            </>
          ) : selectedFunction === "toden-e-2" ? (
            null
          ) : ( null )
        )}
      </div>

      {/* Zoom Controls (outside the transformed container) */}
      <div className="absolute top-4 right-4 flex flex-col items-end space-y-2">
        <Button onClick={handleZoomIn} variant="outline" disabled={scale >= 5.0} className="p-2 rounded-full">
          <Plus />
        </Button>
        <Button onClick={handleZoomOut} variant="outline" disabled={scale <= 1} className="p-2 rounded-full">
          <Minus />
        </Button>
        {nodeCardOpen ? (
          <>
            <Button onClick={openNodeCard} variant="outline" className="p-2 rounded-full">
              <Minimize />
            </Button>
            {selectedNode ? (
              <Card style={{ maxWidth: `${(dimensions?.width ?? 1000) / 3}px`, width: "100%" }}>
                <CardHeader>
                  <CardTitle>Node {selectedNode} Details</CardTitle>
                  <CardDescription>
                    Here are the relevant PAGER details for node {selectedNode}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {nodeDetails ? (
                    <div className="grid grid-cols-3 gap-2">
                      <p className="col-span-1 font-medium">Name:</p>
                      <p className="col-span-2">{nodeDetails.name}</p>

                      <p className="col-span-1 font-medium">Organism:</p>
                      <p className="col-span-2">{nodeDetails.organism}</p>

                      <p className="col-span-1 font-medium">Size:</p>
                      <p className="col-span-2">{nodeDetails.size}</p>

                      <p className="col-span-1 font-medium">Description:</p>
                      <p className="col-span-2 row-span-2">{nodeDetails.description}</p>

                      {/* {nodeDetails.link && (
                        <a
                          href={nodeDetails.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="col-span-3 text-blue-600 hover:underline text-sm mt-2"
                        >
                          Go To Link
                        </a>
                      )} */}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Loading or no details found.</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Please select a Node.</CardTitle>
                </CardHeader>
              </Card>
            )}
            
          </>
          ) : (
            <Button onClick={openNodeCard} variant="outline" className="p-2 rounded-full">
              <Maximize />
            </Button>
          )}
      </div>
    </div>
  );
}
