// app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // This will redirect the user to /home as soon as the component mounts
    router.push('/home');
  }, [router]); // Depend on router to ensure the effect re-runs if router instance changes (unlikely)

  // You can optionally render a loading state or nothing while the redirect happens
  return (
    <div className="flex h-screen justify-center items-center">
      <p>Redirecting to home...</p>
    </div>
  );
}

// Remove all the login form related imports and code if you no longer need them.
// For clarity, I've stripped them out in this example.