import { cn } from "../../lib/utils";

export default function AmbulanceIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("lucide lucide-ambulance", className)}>
      <path d="M10 10H6" />
      <path d="M8 8V12" />
      <path d="M9 17a2 2 0 1 0-4 0" />
      <path d="M19 17a2 2 0 1 0-4 0" />
      <path d="M10 17H5.5A1.5 1.5 0 0 1 4 15.5V9.3a1.5 1.5 0 0 1 1.1-1.4L10 5.4a1.5 1.5 0 0 1 2 0l4.9 2.5A1.5 1.5 0 0 1 18 9.3V17h-3" />
      <path d="M14 12V8" />
      <path d="m18 8-4.3-2.7" />
      <path d="M7 17h1" />
      <path d="M17 17h-5" />
    </svg>
  );
}
