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

  const CommandAny = Command as any;
  const CommandInputAny = CommandInput as any;
  const CommandListAny = CommandList as any;
  const CommandEmptyAny = CommandEmpty as any;
  const CommandGroupAny = CommandGroup as any;
  const CommandItemAny = CommandItem as any;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          role="combobox" 
          aria-expanded={open} 
          ref={buttonRef}
        >
          {selectedEdge
            ? `${selectedEdge.to}`
            : "Select edge..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" style={{ width: buttonWidth }}>
        <CommandAny>
          <CommandInputAny className="h-9" placeholder="Search edges..." />
          <CommandListAny>
            <CommandEmptyAny>No edge found.</CommandEmptyAny>
            <CommandGroupAny>
              {edges.map((edge) => (
                <CommandItemAny
                  key={edge.to}
                  value={edge.to}
                  onSelect={handleSelect}
                >
                  {`${edge.to}`}
                  <Check
                    className={cn(
                      "ml-auto",
                      selectedEdge?.to === edge.to ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItemAny>
              ))}
            </CommandGroupAny>
          </CommandListAny>
        </CommandAny>
      </PopoverContent>
    </Popover>
  );
};
