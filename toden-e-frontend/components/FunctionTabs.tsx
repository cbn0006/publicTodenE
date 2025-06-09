// components/tabscontent.tsx
"use client";

import { useState, useEffect } from "react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormLabel } from "@/components/ui/form";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger,} from "@/components/ui/tabs";
import { HelpCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";

// Form Schema for Prediction Functionality
const PredictFormSchema = z
  .object({
    file: z.string().optional(),
    fileUpload: z.any().optional(),
    alpha: z.string().nonempty({ message: "Alpha value is required." }),
    clusters: z.string().nonempty({ message: "Please select the number of clusters." }),
  })
  // Ensure at least one of file or fileUpload is provided
  .refine(
    (data) => data.file || (data.fileUpload && data.fileUpload.length > 0),
    { message: "Please select a file or upload one.", path: ["fileUpload"] }
  );

// Form Schema for Visualization Functionality
const VisualizeFormSchema = z
  .object({
    file: z.string().optional(),
    fileUpload: z.any().optional(),
  })
  // Ensure at least one file input (select or upload) is provided.
  .refine(
    (data) => data.file || (data.fileUpload && data.fileUpload.length > 0),
    { message: "Please select a file or upload one.", path: ["fileUpload"] }
);

// Form Schema for Summarization Functionality
const SummarizeFormSchema = z
  .object({
    file: z.string().optional(),
    fileUpload: z.any().optional(),
  })
  .refine(
    (data) => data.file || (data.fileUpload && data.fileUpload.length > 0),
    { message: "Please select a file or upload one.", path: ["fileUpload"] }
);

interface TabsContentProps {
  setClustersData: (data: { clusters: string[] }) => void;
  setSelectedNode: (data: string) => void;
  setSelectedFile: (data: string) => void;
  handleSubmitComplete: () => void;
  setTempID: (id: string) => void;
}

// Function Tabs Component
export default function FunctionTabs({ setClustersData, setSelectedNode, setSelectedFile, handleSubmitComplete, setTempID }: TabsContentProps) {
  const [predictFileKey, setPredictFileKey] = useState(0);
  const [visualizeFileKey, setVisualizeFileKey] = useState(0);
  const [summarizeFileKey, setSummarizeFileKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [alertOpen, setAlertOpen] = useState(false);

  // Provides Progress Bar Functionality
  useEffect(() => {
    if (!isLoading) return;

    setProgress(0);
    const timer10 = setTimeout(() => setProgress(8.5), 10000);
    const timer30 = setTimeout(() => setProgress(25), 30000);
    const timer60 = setTimeout(() => setProgress(50), 60000);
    const timer100 = setTimeout(() => setProgress(83.3), 100000);
    const timer120 = setTimeout(() => setProgress(90), 120000);

    // Cleanup the timers if the request completes early.
    return () => {
      clearTimeout(timer10);
      clearTimeout(timer30);
      clearTimeout(timer60);
      clearTimeout(timer100);
      clearTimeout(timer120);
    };
  }, [isLoading]);

  // Prediction Function Form
  const PredictForm = useForm({
    resolver: zodResolver(PredictFormSchema),
    defaultValues: {
      file: "",
      fileUpload: "",
      alpha: "0.5",
      clusters: "",
    },
  });

  // Visualize Function Form
  const VisualizeForm = useForm({
    resolver: zodResolver(VisualizeFormSchema),
    defaultValues: {
      file: "",
      fileUpload: undefined,
    },
  });

  // Summarize Function Form
  const SummarizeForm = useForm({
    resolver: zodResolver(SummarizeFormSchema),
    defaultValues: {
      file: "",
      fileUpload: undefined,
    },
  });
  
  async function PredictSubmit(data: z.infer<typeof PredictFormSchema>) {
    console.log("Before normalization:", JSON.stringify(data));
    
    if (data.alpha === '0.50') {
      data.alpha = '0.5';
    }
    console.log("After normalization - data.alpha:", data.alpha, "data.file:", data.file, "data.fileUpload:", data.fileUpload);

    if (
      (data.alpha === '0.25' || data.alpha === '0.5') && 
      data.file !== '' && 
      !data.fileUpload
    ) {
      setSelectedFile(`Leukemia_${data.clusters}_${data.alpha}`);
      handleSubmitComplete();
      console.log("IF block entered for predefined file.");
      return;
    }
    console.log("IF block bypassed. Preparing to invoke script.");
    setIsLoading(true);
    setProgress(0);

    const formData = new FormData();

    formData.append('file', data.file || '');
    
    if (data.fileUpload && data.fileUpload.length > 0) {
      formData.append('fileUpload', data.fileUpload[0]);
    }
    
    formData.append('alpha', data.alpha || '');
    formData.append('clusters', data.clusters || '');

    PredictForm.reset();

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        body: formData,
      });

      if (response.status !== 200) {
        setAlertOpen(true);
      }

      const result = await response.json();
      if (result.resultId) {
        setTempID(result.resultId); 
      }
    } catch (error) {
      console.error('Error submitting predict form:', error);
    } finally {
      setIsLoading(false);
      setPredictFileKey(prev => prev + 1);
      setSelectedFile("custom");
      handleSubmitComplete();
    }
  }

  async function VisualizeSubmit(data: z.infer<typeof VisualizeFormSchema>) {
    setIsLoading(true);
    setProgress(0);
    const formData = new FormData();
    setSelectedFile(data.file || "");
    
    formData.append('file', data.file || '');
    
    if (data.fileUpload && data.fileUpload.length > 0) {
      formData.append('fileUpload', data.fileUpload[0]);
    }
  
    VisualizeForm.reset();
    
    try {
      const response = await fetch('/api/create-m-type-data', {
        method: 'POST',
        body: formData,
      });
  
      if (response.status !== 200) {
        setAlertOpen(true);
      }
  
      const result = await response.json();
      setSelectedNode(result.selectedNode);
      setClustersData({ clusters: result.allowedNodes });
      handleSubmitComplete();
    } catch (error) {
      console.error('Error submitting visualize form:', error);
    } finally {
      setIsLoading(false);
      setVisualizeFileKey(prev => prev + 1);
    }
  }

  // Function when Summarization is Submitted
  async function SummarizeSubmit(data: z.infer<typeof SummarizeFormSchema>) {
    console.log(data);
    setIsLoading(true);
    setProgress(0);
    const formData = new FormData();
  
    formData.append('file', data.file || '');
    
    if (data.fileUpload && data.fileUpload.length > 0) {
      formData.append('fileUpload', data.fileUpload[0]);
    }

    SummarizeForm.reset();
    
    try {
      const response = await fetch('http://localhost:5000/summarize', {
        method: 'POST',
        body: formData,
      });

      if (response.status !== 200) {
        setAlertOpen(true);
      }

      const result = await response.json();
      console.log('Summarize result:', result);
    } catch (error) {
      console.error('Error submitting summarize form:', error);
      setAlertOpen(true);
    } finally {
      setIsLoading(false);
      setSummarizeFileKey(prev => prev + 1);
      handleSubmitComplete();
    }
  }

  return (
    <div className="flex justify-center items-center h-full w-full">
      
      {isLoading ? (
        <div className="w-1/2">
          <Progress value={progress} max={120} />
        </div>
      )
      : 
      (
      <Tabs defaultValue="predict">
        <TabsList className="grid w-full grid-cols-3 space-x-2">
          <TabsTrigger value="predict">Predict</TabsTrigger>
          <TabsTrigger value="visualize" disabled>Visualize (Not Available)</TabsTrigger>
          <TabsTrigger value="summarize" disabled>Summarize (Not Available)</TabsTrigger>
          {/* <TabsTrigger value="partition-score">Partition Score</TabsTrigger> */}
        </TabsList>
        <TabsContent value="predict">
          <Card className="w-full">
            <CardHeader className="flex flex-row justify-between">
              <div className="flex flex-col">
                <CardTitle>Prediction Function</CardTitle>
                <CardDescription>This is the prediction tool.</CardDescription>
              </div>
              <Dialog>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <HelpCircle />
                        </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How It Works</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DialogContent className="sm:max-w-[800px]">
                  <DialogHeader>
                    <DialogTitle>How It Works</DialogTitle>
                    <DialogDescription className="flex flex-col space-y-2">
                      <p>
                        The Predict Function allows the user to select or upload a file, 
                        select or enter an alpha value, choose whether or not they want visualization, 
                        choose number of clusters, and choose whether or not they want summarization.
                        Upon submission, there will be a loading period where the user will need to wait
                        for Toden-E to complete its calculations. Then, Toden-E will forward the user to the page corresponding
                        to the user`&apos`s desired Toden-E functionality.
                      </p>
                      <p className="text-lg font-semibold leading-none tracking-tight dark:text-white">
                        Example File Format
                      </p>
                      <p>
                        Here is the format of the file needed for the tool to work properly {'(Use .txt files)'}:
                      </p>
                      <p>
                      GO: {'{id}'}
                      </p>
                      <p>
                      GO: {'{id}'}
                      </p>
                      <p>
                      ...
                      </p>
                      <p>
                      GO: {'{id}'}
                      </p>
                      <p>
                        Example of an id: 0006413
                      </p>
                      <p>
                        Visit {'(link goes here)'} to get ids
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        A file selection takes precedent over a file upload and an alpha value selection takes precedent over a custom alpha value.
                      </p>
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button>Continue</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <Form {...PredictForm}>
              <form onSubmit={PredictForm.handleSubmit(PredictSubmit)}>
                <div className="px-4 pb-4 space-y-4">
                  {/* Row 1: File selection */}
                  <div className="grid grid-cols-8 gap-4 items-center">
                    <FormLabel className="col-span-1 text-right">File Selection</FormLabel>
                    {/* Select input (choose file from dropdown) */}
                    <div className="col-span-3">
                      <FormField
                        control={PredictForm.control}
                        name="file"
                        render={({ field }) => (
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a file..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>File</SelectLabel>
                                  <SelectItem value="Leukemia">Leukemia Dataset</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </FormControl>
                        )}
                      />
                    </div>
                    {/* "or" text */}
                    <div className="col-span-1 text-center">
                      <span>or</span>
                    </div>
                    {/* File upload input */}
                    <div className="col-span-3">
                      <FormField
                        control={PredictForm.control}
                        name="fileUpload"
                        render={({ field }) => (
                          <FormControl>
                            <Input
                              key={`predict-file-${predictFileKey}`}
                              type="file"
                              onChange={(e) => field.onChange(e.target.files)}
                              accept=".txt"
                            />
                          </FormControl>
                        )}
                      />
                    </div>

                  {/* Row 2: Alpha, Visualize, and Clusters (each spanning 1 column) */}
                    <FormLabel className="text-right">Alpha</FormLabel>
                    <div className="col-span-4">
                      <FormField
                        control={PredictForm.control}
                        name="alpha"
                        render={({ field }) => (
                          <FormControl>
                            <div className="flex items-center space-x-4">
                              <Slider
                                value={[Number(field.value) * 100]}
                                onValueChange={(vals) => {
                                  field.onChange((vals[0] / 100).toFixed(2));
                                }}
                                defaultValue={[50]}
                                max={100}
                                step={1}
                                className="w-full"
                              />
                              <span>{field.value}</span>
                            </div>
                          </FormControl>
                        )}
                      />
                    </div>
                    <FormLabel className="text-right">Clusters</FormLabel>
                    <div className="col-span-2">
                      <FormField
                        control={PredictForm.control}
                        name="clusters"
                        render={({ field }) => (
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Clusters" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>Clusters</SelectLabel>
                                  <SelectItem value="2">2</SelectItem>
                                  <SelectItem value="3">3</SelectItem>
                                  <SelectItem value="4">4</SelectItem>
                                  <SelectItem value="5">5</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </FormControl>
                        )}
                      />
                    </div>
                  </div>
                </div>
                <CardFooter className="space-x-4">
                  <Button 
                    variant="destructive" 
                    onClick={() =>{
                      PredictForm.reset();
                      setPredictFileKey(prev => prev + 1);
                    }}
                  >
                    Reset
                  </Button>
                  <Button type="submit" disabled={!PredictForm.formState.isValid}>
                    Submit
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
        <TabsContent value="visualize">
          <Card className="w-[1000px]">
          <CardHeader className="flex flex-row justify-between">
              <div className="flex flex-col">
                <CardTitle>Visualize Function</CardTitle>
                <CardDescription>This will visualize results.</CardDescription>
              </div>
              <Dialog>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <HelpCircle />
                        </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How It Works</p>
                    </TooltipContent>
                  </Tooltip>
                  </TooltipProvider>
                <DialogContent className="sm:max-w-[800px]">
                  <DialogHeader>
                    <DialogTitle>How It Works</DialogTitle>
                    <DialogDescription className="flex flex-col space-y-2">
                      <p>
                        The Summarize Function allows the user to select or upload a file for summarization.
                        Upon submission, there will be a loading period where the user will need to wait
                        for Toden-E to complete its summarization. Then, Toden-E will forward the user to the page corresponding
                        to the user`&apos`s desired Toden-E functionality.
                      </p>
                      <p className="text-lg font-semibold leading-none tracking-tight dark:text-white">
                        Example File Format
                      </p>
                      <p>
                        Here is the format of the file to visualize n clusters {'(Use .csv files curated by Toden-E Predict)'}:
                      </p>
                      <p>
                      ID,0,..., n - 1
                      </p>
                      <p>
                      {'{Clustering Algorithm}'}, {'{Cluster_1_IDs}'}, ..., {'{Cluster_(n - 1)_IDs}'}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        A file selection takes precedent over a file upload.
                      </p>
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button>Continue</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <Form {...VisualizeForm}>
              <form onSubmit={VisualizeForm.handleSubmit(VisualizeSubmit)}>
                <div className="px-4 pb-4 space-y-4">
                  {/* File Selection Row */}
                  <div className="grid grid-cols-8 gap-4 items-center">
                    <FormLabel className="col-span-1 text-right">
                      File Selection
                    </FormLabel>
                    {/* Select input for file choice */}
                    <div className="col-span-3">
                      <FormField
                        control={VisualizeForm.control}
                        name="file"
                        render={({ field }) => (
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a file..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>File</SelectLabel>
                                  <SelectItem value="Leukemia_2_0.25">Leukemia (2 Clusters), (0.25 Alpha)</SelectItem>
                                  <SelectItem value="Leukemia_2_0.5">Leukemia (2 Clusters), (0.5 Alpha)</SelectItem>
                                  <SelectItem value="Leukemia_3_0.25">Leukemia (3 Clusters), (0.25 Alpha)</SelectItem>
                                  <SelectItem value="Leukemia_3_0.5">Leukemia (3 Clusters), (0.5 Alpha)</SelectItem>
                                  <SelectItem value="Leukemia_4_0.25">Leukemia (4 Clusters), (0.25 Alpha)</SelectItem>
                                  <SelectItem value="Leukemia_4_0.5">Leukemia (4 Clusters), (0.5 Alpha)</SelectItem>
                                  <SelectItem value="Leukemia_5_0.25">Leukemia (5 Clusters), (0.25 Alpha)</SelectItem>
                                  <SelectItem value="Leukemia_5_0.5">Leukemia (5 Clusters), (0.5 Alpha)</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </FormControl>
                        )}
                      />
                    </div>
                    {/* "or" text */}
                    <div className="col-span-1 text-center">
                      <span>or</span>
                    </div>
                    {/* File upload input */}
                    <div className="col-span-3">
                      <FormField
                        control={VisualizeForm.control}
                        name="fileUpload"
                        render={({ field }) => (
                          <FormControl>
                            <Input
                              key={`visualize-file-${visualizeFileKey}`}
                              type="file"
                              onChange={(e) => field.onChange(e.target.files)}
                              accept=".csv"
                            />
                          </FormControl>
                        )}
                      />
                    </div>
                  </div>
                </div>
                <CardFooter className="flex space-x-4">
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      VisualizeForm.reset();
                      setVisualizeFileKey(prev => prev + 1);
                    }}
                  >
                    Reset
                  </Button>
                  <Button type="submit" disabled={!VisualizeForm.formState.isValid}>
                    Submit
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
        <TabsContent value="summarize">
          <Card className="w-[1000px]">
          <CardHeader className="flex flex-row justify-between">
              <div className="flex flex-col">
                <CardTitle>Summarize Function</CardTitle>
                <CardDescription>This will summarize results.</CardDescription>
              </div>
              <Dialog>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <HelpCircle />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>How It Works</p>
                  </TooltipContent>
                </Tooltip>
                </TooltipProvider>
                <DialogContent className="sm:max-w-[800px]">
                  <DialogHeader>
                    <DialogTitle>How It Works</DialogTitle>
                    <DialogDescription className="flex flex-col space-y-2">
                      <p>
                        The Summarize Function allows the user to select or upload a file for summarization.
                        Upon submission, there will be a loading period where the user will need to wait
                        for Toden-E to complete its summarization. Then, Toden-E will forward the user to the page corresponding
                        to the user`&apos~s desired Toden-E functionality.
                      </p>
                      <p className="text-lg font-semibold leading-none tracking-tight dark:text-white">
                        Example File Format
                      </p>
                      <p>
                        Here is the format of the file to summarize n clusters {'(Use .csv files curated by Toden-E Predict)'}:
                      </p>
                      <p>
                      ID,0,..., n - 1
                      </p>
                      <p>
                      {'{Clustering Algorithm}'}, {'{Cluster_1_IDs}'}, ..., {'{Cluster_(n - 1)_IDs}'}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        A file selection takes precedent over a file upload.
                      </p>
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button>Continue</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <Form {...SummarizeForm}>
              <form onSubmit={SummarizeForm.handleSubmit(SummarizeSubmit)}>
                <div className="px-4 pb-4 space-y-4">
                  {/* File Selection Row */}
                  <div className="grid grid-cols-8 gap-4 items-center">
                    <FormLabel className="col-span-1 text-right">
                      File Selection
                    </FormLabel>
                    {/* Select input for file choice */}
                    <div className="col-span-3">
                      <FormField
                        control={SummarizeForm.control}
                        name="file"
                        render={({ field }) => (
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a file..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>File</SelectLabel>
                                  <SelectItem value="Leukemia_2_0.25">Leukemia (2 Clusters), (0.25 Alpha)</SelectItem>
                                  <SelectItem value="Leukemia_2_0.5">Leukemia (2 Clusters), (0.5 Alpha)</SelectItem>
                                  <SelectItem value="Leukemia_3_0.25">Leukemia (3 Clusters), (0.25 Alpha)</SelectItem>
                                  <SelectItem value="Leukemia_3_0.5">Leukemia (3 Clusters), (0.5 Alpha)</SelectItem>
                                  <SelectItem value="Leukemia_4_0.25">Leukemia (4 Clusters), (0.25 Alpha)</SelectItem>
                                  <SelectItem value="Leukemia_4_0.5">Leukemia (4 Clusters), (0.5 Alpha)</SelectItem>
                                  <SelectItem value="Leukemia_5_0.25">Leukemia (5 Clusters), (0.25 Alpha)</SelectItem>
                                  <SelectItem value="Leukemia_5_0.5">Leukemia (5 Clusters), (0.5 Alpha)</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </FormControl>
                        )}
                      />
                    </div>
                    {/* "or" text */}
                    <div className="col-span-1 text-center">
                      <span>or</span>
                    </div>
                    {/* File upload input */}
                    <div className="col-span-3">
                      <FormField
                        control={SummarizeForm.control}
                        name="fileUpload"
                        render={({ field }) => (
                          <FormControl>
                            <Input
                              key={`summarize-file-${summarizeFileKey}`}
                              type="file"
                              onChange={(e) => field.onChange(e.target.files)}
                              accept=".csv"
                            />
                          </FormControl>
                        )}
                      />
                    </div>
                  </div>
                </div>
                <CardFooter className="flex space-x-4">
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      SummarizeForm.reset();
                      setSummarizeFileKey(prev => prev + 1);
                    }}
                  >
                    Reset
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span style={{ display: 'inline-block', cursor: 'not-allowed' }}>
                          <Button type="submit" disabled={true}>
                            Submit
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                      <p>Sorry, this feature is currently disabled.</p>
                    </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
    </Tabs>
     )}
     
     <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>There was an error in fulfilling your request. Please try again.</AlertDialogTitle>
          <AlertDialogDescription>
            If this problem persists, please contact us at: xyz1234@auburn.edu. PLEASE NOTE: The file upload feature for each function of Toden-E will not work currently.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </div>
);
}