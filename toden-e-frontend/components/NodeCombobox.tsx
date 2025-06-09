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

interface Node {
  value: string;
  label: string;
}

interface NodeComboboxProps {
  nodes: Node[];
  onSelect?: (value: string) => void;
  selectedNode: string;
}

export const NodeCombobox: React.FC<NodeComboboxProps> = ({ nodes, onSelect, selectedNode }) => {
  const [open, setOpen] = React.useState(false);
  const [buttonWidth, setButtonWidth] = React.useState<number>(0);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (buttonRef.current) {
      setButtonWidth(buttonRef.current.offsetWidth);
    }
  }, [open, selectedNode]);

  const handleSelect = (selectedValue: string) => {
    setOpen(false);
    if (onSelect) onSelect(selectedValue);
  };

  // The 'any' casts have been removed. We now use the components directly
  // as they are imported, relying on their built-in type definitions.

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={buttonRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between w-full" // Added justify-between and w-full for better default styling
        >
          {selectedNode
            ? nodes.find((node) => node.value === selectedNode)?.label
            : "Select node..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" style={{ width: buttonWidth }}>
        {/* Using the original, type-safe components */}
        <Command>
          <CommandInput placeholder="Search node..." className="h-9" />
          <CommandList>
            <CommandEmpty>No node found.</CommandEmpty>
            <CommandGroup>
              {nodes.map((node) => (
                <CommandItem
                  key={node.value}
                  value={node.value}
                  onSelect={handleSelect}
                >
                  {node.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4", // Added h-4 and w-4 for consistent icon sizing
                      selectedNode === node.value ? "opacity-100" : "opacity-0"
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