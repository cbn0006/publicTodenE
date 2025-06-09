"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Edge } from "@/types/edge";

interface EdgeComboboxProps {
  edges: Edge[];
  onSelect?: (edge: Edge) => void;
  selectedEdge: Edge | null;
}

export const EdgeCombobox: React.FC<EdgeComboboxProps> = ({ edges, onSelect, selectedEdge }) => {
  const [open, setOpen] = React.useState(false);
  const [buttonWidth, setButtonWidth] = React.useState<number>(0);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useLayoutEffect(() => {
    if (buttonRef.current) {
      setButtonWidth(buttonRef.current.offsetWidth);
    }
  }, [open, selectedEdge]);

  const handleSelect = (selectedEdgeValue: string) => {
    const edge = edges.find((edge) => edge.to === selectedEdgeValue);
    setOpen(false);
    if (edge && onSelect) {
      onSelect(edge);
    }
  };

  // The 'any' casts have been removed to use the original, type-safe components.

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          ref={buttonRef}
          className="justify-between w-full" // Added for consistent styling
        >
          {selectedEdge
            ? `${selectedEdge.to}`
            : "Select edge..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" style={{ width: buttonWidth }}>
        <Command>
          <CommandInput className="h-9" placeholder="Search edges..." />
          <CommandList>
            <CommandEmpty>No edge found.</CommandEmpty>
            <CommandGroup>
              {edges.map((edge) => (
                <CommandItem
                  key={edge.to}
                  value={edge.to}
                  onSelect={handleSelect}
                >
                  {`${edge.to}`}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedEdge?.to === edge.to ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};