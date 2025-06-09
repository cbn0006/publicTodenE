// app/page.tsx
import { redirect } from 'next/navigation';

// This component now handles the redirect on the server before any HTML is sent.
// It's more efficient and the standard way to do this with the App Router.
export default function RootPage() {
  redirect('/home');
}