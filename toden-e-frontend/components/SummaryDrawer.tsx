// components/SummaryDrawer.tsx

"use client";

// import React, { useState, useRef } from "react";
// import { ChevronUp, ChevronDown } from "lucide-react";
// import { Button } from "@/components/ui/button";


interface SummaryDrawerProps {
    // setDrawerOpen: (open: boolean) => void;
    selectedFunction: string;
}

export default function SummaryDrawer ({ 
        // setDrawerOpen,
        selectedFunction, 
    }: SummaryDrawerProps) {
    return (
        <div className="flex flex-col p-2 space-y-2">
            {selectedFunction === "CoCo" ? (
                <p className="text-center">
                    No Summarization for CoCo.
                </p>
            ) : selectedFunction === "toden-e" ? (
                <p>Testing</p>
            ) : (null)}
        </div>
    );
}