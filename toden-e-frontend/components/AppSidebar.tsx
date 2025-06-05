"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NodeCombobox } from "@/components/NodeCombobox";
import { EdgeCombobox } from "@/components/EdgeCombobox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edge } from "@/types/edge";
import { z } from "zod";
import { Form, FormControl, FormField, FormLabel, FormDescription, FormMessage, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CopyIcon } from "@radix-ui/react-icons";

const IDFormSchema = z.object({
  id: z.string().nonempty({ message: "ID value required." }),
})
interface AppSidebarProps {
  nodes: { value: string; label: string }[];
  setSelectedNode: (node: string) => void;
  selectedFunction: string;
  setSelectedFunction: (fn: string) => void;
  setSelectedFile: (file: string) => void;
  selectedFile: string;
  selectedNode: string;
  setView: (view: string) => void;
  view: string;
  selectedEdge: Edge | null;
  setSelectedEdge: (edge: Edge | null) => void;
  hoveredEdge: string | null;
  setHoveredEdge: (edge: string | null) => void;
  setHoveredNode: (node: string | null) => void;
  selectedMatrix: string;
  setSelectedMatrix: (matrix: string) => void;
  todenEClusters: { clusters: string[][]; sortedNodes: string[] } | null;
  matrixDims: number[] | null;
  setHoveredCluster: (cluster: string[] | null) => void;
  matrix: string[][];
  edges: Edge[];
  setEdges: (edges: Edge[]) => void;
  tempID: string | null;
  setTempID: (id: string) => void;
  setClustersData: (clustersData: { clusters: string[] } | null) => void;
}

export default function AppSidebar({ 
    nodes, 
    setSelectedNode, 
    selectedFunction, 
    setSelectedFunction, 
    setSelectedFile, 
    selectedFile, 
    selectedNode,
    setView,
    view,
    selectedEdge,
    setSelectedEdge,
    hoveredEdge,
    setHoveredEdge,
    setHoveredNode,
    selectedMatrix,
    setSelectedMatrix,
    todenEClusters,
    matrixDims,
    setHoveredCluster,
    matrix,
    edges,
    setEdges,
    tempID,
    setTempID,
    setClustersData
  }: AppSidebarProps) {

  const IDForm = useForm({
      resolver: zodResolver(IDFormSchema),
      defaultValues: {
        id: "",
      },
    });

  async function handleFileSelect(currentFileSelection: string) {

    let fileIdentifierForApi: string | null;
    let idTypeForApi: 'standard' | 'custom';

    if (currentFileSelection === "custom") {

      if (!tempID) { 
        console.error('handleFileSelect: Mode is "custom" but tempID (resultId) is not available.');
        setSelectedNode(''); 
        setClustersData(null);
        return;
      }
      fileIdentifierForApi = tempID;
      idTypeForApi = 'custom';
    } else if (currentFileSelection) {
      fileIdentifierForApi = currentFileSelection;
      idTypeForApi = 'standard';
    } else {
      console.error('handleFileSelect: No file selection provided.');
      setSelectedNode(''); 
      setClustersData(null);
      return;
    }

    const formData = new FormData();
    formData.append('file', fileIdentifierForApi);
    formData.append('id_type', idTypeForApi);

    try {
      const response = await fetch('/api/set-clusters', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error response from create-m-type-data" }));
        console.error(`Error fetching allowed nodes: ${response.status}`, errorData.error || response.statusText);
        setSelectedNode(''); 
        setClustersData(null); 
        return;
      }

      const result = await response.json();
      if (result.error) {
          console.error('API error from /api/create-m-type-data:', result.error);
          setSelectedNode('');
          setClustersData(null);
          return;
      }

      setSelectedNode(result.selectedNode);
      setClustersData({ clusters: result.allowedNodes });

    } catch (error) {
      console.error('Network or other error in handleFileSelect calling /api/create-m-type-data:', error);
      setSelectedNode('');
      setClustersData(null);
    }
  }

  useEffect(() => {
    setSelectedEdge(null);

    if (selectedFunction === "toden-e") {
      setEdges([]);
    }
    
  }, [selectedFunction, setSelectedEdge, setEdges]);

  const handleDownloadCSV = async () => {
      if (!matrix || matrix.length === 0) {
          alert("No matrix data available to download.");
          return;
      }

      const currentFileName = `${selectedFile}_${selectedMatrix}.csv`;
      const csvContent = matrix.map(row => {
          return row.map(cell => {
              const cellString = String(cell ?? '');
              if (/[",\n]/.test(cellString)) {
                  return `"${cellString.replace(/"/g, '""')}"`;
              }
              return cellString;
          }).join(',');
      }).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      await saveData(blob, currentFileName);
  };

  async function saveData(blob: Blob, suggestedName: string) {
    try {
      if (window.showSaveFilePicker) {
        const options: SaveFilePickerOptions = {
          suggestedName: suggestedName,
          types: [{
            description: 'CSV files',
            accept: { 'text/csv': ['.csv'] },
          }],
        };
        const fileHandle = await window.showSaveFilePicker(options);
        const writableStream = await fileHandle.createWritable();
        await writableStream.write(blob);
        await writableStream.close();
        return;
      }
      throw new Error('File System Access API not supported.');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('File save dialog was cancelled by the user.');
        return;
      }
      console.warn('File System Access API failed or not supported, falling back to legacy download:', err.message);

      const link = document.createElement('a');
      if (typeof link.download === 'string') {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', suggestedName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (window.navigator.msSaveBlob) {
        window.navigator.msSaveBlob(blob, suggestedName);
      } else {
        alert("CSV download is not fully supported in your browser, or the operation was cancelled.");
      }
    }
  }

  const handleCopyID = async (idToCopy: string | null) => {
    if (idToCopy) {
      try {
        await navigator.clipboard.writeText(idToCopy);
      } catch (err) {
        console.error("Failed to copy ID: ", err);
      }
    }
  };

  async function IDSubmit(data: z.infer<typeof IDFormSchema>) {
    try {
      const response = await fetch('/api/validate-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: data.id }),
      });

      const result = await response.json();
      console.log(result)

      if (response.ok && result.isValid) {
        setTempID(data.id);
      } else {
        setTempID("Invalid");
      }
    } catch (error) {
      console.error('Failed to validate ID:', error);
      setTempID("Invalid"); 
    }
  };

  // Rendering of sidebar.
  return (
    <div className="flex flex-row">
      <ScrollArea className="px-2 pt-2">
        <Tabs defaultValue={view} onValueChange={setView} className="px-2 py-2">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="graph">Graphing</TabsTrigger>
            <TabsTrigger value="matrix">Matrix</TabsTrigger>
          </TabsList>
          <TabsContent value="graph" className="space-y-2">
            <Card>
              <CardHeader>
                <CardTitle>Clustering</CardTitle>
                <CardDescription>
                  Choose the clustering function.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                    <Label className="col-span-1">Choose Function</Label>
                    <div className="col-span-2">
                      <Select onValueChange={setSelectedFunction} value={selectedFunction}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup >
                            <SelectLabel>Functions</SelectLabel>
                            <SelectItem value="toden-e">Toden-E</SelectItem>
                            <SelectItem value="CoCo">CoCo</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  <Label className="col-span-1">Choose File</Label>
                    <div className="col-span-2">
                      <Select onValueChange={(value) => {
                              setSelectedFile(value);
                              handleFileSelect(value);
                              }}
                              value={selectedFile}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a file..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Files</SelectLabel>
                            <SelectItem value="Leukemia_2_0.25">Leukemia (2 Clusters), (0.25 Alpha)</SelectItem>
                            <SelectItem value="Leukemia_2_0.5">Leukemia (2 Clusters), (0.5 Alpha)</SelectItem>
                            <SelectItem value="Leukemia_3_0.25">Leukemia (3 Clusters), (0.25 Alpha)</SelectItem>
                            <SelectItem value="Leukemia_3_0.5">Leukemia (3 Clusters), (0.5 Alpha)</SelectItem>
                            <SelectItem value="Leukemia_4_0.25">Leukemia (4 Clusters), (0.25 Alpha)</SelectItem>
                            <SelectItem value="Leukemia_4_0.5">Leukemia (4 Clusters), (0.5 Alpha)</SelectItem>
                            <SelectItem value="Leukemia_5_0.25">Leukemia (5 Clusters), (0.25 Alpha)</SelectItem>
                            <SelectItem value="Leukemia_5_0.5">Leukemia (5 Clusters), (0.5 Alpha)</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedFile === "custom" ? (
                      <>
                      <Label className="col-span-1">
                        File Selection
                      </Label>
                      <div className="col-span-2">
                      <Form {...IDForm}>
                        <form onSubmit={IDForm.handleSubmit(IDSubmit)} className="flex items-center space-x-2 justify-between">                      
                            <FormField
                              control={IDForm.control}
                              name="id"
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input placeholder="ID" {...field}/>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" disabled={!IDForm.formState.isValid}>
                              Submit
                            </Button>
                          </form>
                      </Form>
                      </div>
                      {tempID !== null ? (
                        <>
                          <Label className="col-span-1">
                            Temporary ID:
                          </Label>
                          <div className="flex col-span-2 items-center space-x-1">
                            <p className="flex-1 text-sm">{tempID}</p>
                            <Button 
                              className=""
                              variant="ghost"
                              onClick={() => handleCopyID(tempID)}
                            >
                              <CopyIcon />
                            </Button>
                          </div>
                        </>
                      ) : (null)}
                      </>
                    ) : (null)}
                </div>
              </CardContent>
              {selectedFunction === "CoCo" ? (
                <CardFooter className="text-muted-foreground sm:text-sm">
                  *CoCo clustering is same for all files.
                </CardFooter>
              ) : (null)}
            </Card>
            {selectedFunction === "toden-e" && todenEClusters ? (
              <Card>
                <CardHeader>
                  <CardTitle>Toden-E Clustering</CardTitle>
                </CardHeader>
                <CardContent>
                {selectedFunction === "toden-e" && todenEClusters && todenEClusters.clusters.length > 0 && (
                  <div className="space-y-4">
                    {todenEClusters.clusters.map((cluster, clusterIndex) => (
                      <ScrollArea className="h-64">
                      <Table key={clusterIndex} className="w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead
                              onMouseEnter={() => setHoveredCluster(cluster)}
                              onMouseLeave={() => setHoveredCluster(null)}
                            >
                              Cluster {clusterIndex + 1}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cluster.map((node, nodeIndex) => (
                            <TableRow 
                              key={nodeIndex} 
                              className="cursor-pointer hover:bg-muted" 
                              onClick={() => setSelectedNode(node)}
                              onMouseEnter={() => setHoveredNode(node)}
                              onMouseLeave={() => setHoveredNode(null)}
                            >
                              <TableCell>{node}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      </ScrollArea>
                    ))}
                  </div>
                )}
                </CardContent>
              </Card>
            ) : selectedFunction === "CoCo" && selectedFile !== "" ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>CoCo Clustering</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      <Label className="col-span-1">Choose Node</Label>
                      <div className="col-span-2">
                        <NodeCombobox 
                          nodes={nodes} 
                          onSelect={setSelectedNode}
                          selectedNode={selectedNode}
                        />
                      </div>
                      <Label className="col-span-1">Choose Edge</Label>
                      <div className="col-span-2">
                      <EdgeCombobox
                        edges={edges}
                        onSelect={setSelectedEdge}
                        selectedEdge={selectedEdge}
                      />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Selected Edge Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                  {selectedEdge ? (
                    <div className="grid grid-cols-3 gap-2">
                      <p className="col-span-1">From:</p>  
                      <div className="col-span-2">{selectedNode}</div>
                      <p className="col-span-1">To:</p>
                      <div className="col-span-2">{selectedEdge.to}</div>
                      <p className="col-span-1">Similarity:</p>
                      <div className="col-span-2">{selectedEdge.similarity.toFixed(4)}</div>
                    </div>
                  ) : (
                    <p>No edge selected</p>
                  )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {selectedNode} Relationships
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                  <ScrollArea className="h-64">
                  <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Node</TableHead>
                          <TableHead>Similarity</TableHead>
                        </TableRow>
                      </TableHeader>
                        {edges && edges.length > 0 ? (
                          edges.map((edge, index) => (
                            <TableBody>
                            <TableRow 
                              key={index}
                              onClick={() => setSelectedEdge(edge)}
                              onMouseEnter={() => setHoveredEdge(edge.to)}
                              onMouseLeave={() => setHoveredEdge(null)}
                              className="cursor-pointer hover:bg-muted"
                            >
                              <TableCell>{edge.to}</TableCell>
                              <TableCell>
                                {edge.similarity.toFixed(4)}
                              </TableCell>
                            </TableRow>
                            </TableBody>
                          ))
                        ) : (
                          <TableCaption>No edges found.</TableCaption>
                        )}
                    </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            ) : (
              null
            )}
          </TabsContent>
          <TabsContent value="matrix" className="space-y-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  Matrix Selection
                </CardTitle>
                <CardDescription>
                  Choose what matrix you want for your dataset.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  <Label className="col-span-1">Choose File</Label>
                  <div className="col-span-2">
                    <Select onValueChange={(value) => {
                            setSelectedFile(value);
                            handleFileSelect(value);
                            }}
                            value={selectedFile}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a file..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Files</SelectLabel>
                          <SelectItem value="Leukemia_2_0.25">Leukemia (2 Clusters), (0.25 Alpha)</SelectItem>
                          <SelectItem value="Leukemia_2_0.5">Leukemia (2 Clusters), (0.5 Alpha)</SelectItem>
                          <SelectItem value="Leukemia_3_0.25">Leukemia (3 Clusters), (0.25 Alpha)</SelectItem>
                          <SelectItem value="Leukemia_3_0.5">Leukemia (3 Clusters), (0.5 Alpha)</SelectItem>
                          <SelectItem value="Leukemia_4_0.25">Leukemia (4 Clusters), (0.25 Alpha)</SelectItem>
                          <SelectItem value="Leukemia_4_0.5">Leukemia (4 Clusters), (0.5 Alpha)</SelectItem>
                          <SelectItem value="Leukemia_5_0.25">Leukemia (5 Clusters), (0.25 Alpha)</SelectItem>
                          <SelectItem value="Leukemia_5_0.5">Leukemia (5 Clusters), (0.5 Alpha)</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <Label className="col-span-1">Select Matrix</Label>
                  <div className="col-span-2">
                    <Select onValueChange={(value) => {
                            setSelectedMatrix(value);
                            }}
                            value={selectedMatrix}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a matrix..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Matrices</SelectLabel>
                          <SelectItem value="adj">Adj Matrix</SelectItem>
                          <SelectItem value="con">Con Matrix</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedFile === "custom" ? (
                      <>
                      <Label className="col-span-1">
                        File Selection
                      </Label>
                      <div className="col-span-2">
                      <Form {...IDForm}>
                        <form onSubmit={IDForm.handleSubmit(IDSubmit)} className="flex items-center space-x-2 justify-between">                      
                            <FormField
                              control={IDForm.control}
                              name="id"
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input placeholder="ID" {...field}/>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" disabled={!IDForm.formState.isValid}>
                              Submit
                            </Button>
                          </form>
                      </Form>
                      </div>
                      {tempID !== null ? (
                        <>
                          <Label className="col-span-1">
                            Temporary ID:
                          </Label>
                          <div className="flex col-span-2 items-center space-x-1">
                            <p className="flex-1 text-sm">{tempID}</p>
                            <Button 
                              className=""
                              variant="ghost"
                              onClick={() => handleCopyID(tempID)}
                            >
                              <CopyIcon />
                            </Button>
                          </div>
                        </>
                      ) : (null)}
                      </>
                    ) : (null)}
                </div>
              </CardContent>
            </Card>
            {selectedFile !== "" ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Matrix Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      <p className="col-span-1">Dimensions</p>
                      { matrixDims ? (
                        <p className="col-span-2 text-center">{matrixDims[0]} x {matrixDims[1]}</p>
                      ) : (<p className="col-span-2">Select a matrix to load.</p>)
                    }
                    </div>
                  </CardContent>
                  <CardFooter className="">
                    <Button 
                      className="col-span-2 underline underline-offset-2" 
                      variant="ghost"
                      onClick={handleDownloadCSV}
                    > 
                      Download as CSV 
                    </Button>
                  </CardFooter>
                </Card>
              </>
            ) : (null)}
          </TabsContent>
        </Tabs>
        </ScrollArea>
      <Separator orientation="vertical" />
    </div>
  );
}
