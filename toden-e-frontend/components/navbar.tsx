"use client";

import Link from 'next/link';
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
// import Image from 'next/image';
import {
    DropdownMenu,
    DropdownMenuItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { useState, useEffect } from 'react';
import { Separator } from "@/components/ui/separator"

const Navbar = () => {
  // const { theme } = useTheme();

  const [currentRoute, setCurrentRoute] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentRoute(window.location.pathname);
    }
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2">
        <Link href="/home" passHref>
          <div className="flex items-center">
            <span className="text-md whitespace-nowrap font-semibold dark:text-white sm:text-2xl">
              Toden-E
            </span>
          </div>
        </Link>
        
        <div className="space-x-12">
          <Link href="/home" passHref>
            <Button 
              variant="ghost" 
              size="default" 
              disabled={currentRoute === "/home"} 
              className={`${currentRoute === "/home" ? "underline" : ""}`}
            >
              Home
            </Button>
          </Link>
          <Link href="/about" passHref>
            <Button 
              variant="ghost" 
              size="default" 
              disabled={currentRoute === "/about"} 
              className={`${currentRoute === "/about" ? "underline" : ""}`}
            >
              About
            </Button>
          </Link>
        </div>

        <div className="space-x-3">
          <ThemeToggle />
          <Link href="https://github.com/qilimk/Toden-E-WEB" passHref>
            <Button variant="ghost" size="icon">
              <GitHubLogoIcon />
            </Button>
          </Link>
        </div>
      </div>
      <Separator />
    </div>
  );
};

const ThemeToggle = () => {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Navbar;
