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

  // Workaround: cast command components to any so that they accept children
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
          ref={buttonRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className=""
        >
          {selectedNode
            ? nodes.find((node) => node.value === selectedNode)?.label
            : "Select node..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" style={{ width: buttonWidth }}>
        <CommandAny>
          <CommandInputAny className="h-9" />
          <CommandListAny>
            <CommandEmptyAny>No node found.</CommandEmptyAny>
            <CommandGroupAny>
              {nodes.map((node) => (
                <CommandItemAny
                  key={node.value}
                  value={node.value}
                  onSelect={handleSelect}
                >
                  {node.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      selectedNode === node.value ? "opacity-100" : "opacity-0"
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
