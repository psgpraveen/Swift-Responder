import HospitalSuggester from "../hospital-suggester";
import { Activity, Shield } from "lucide-react";
import { Badge } from "../ui/badge";

export default function Header() {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-card/95 backdrop-blur-sm z-20 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-md"></div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="relative text-primary h-9 w-9 drop-shadow-lg">
              <path d="M10.2 2.5c.3-.2.5-.5.8-.5s.6.2.8.5l8.1 5.4c.4.2.6.5.6.9v10.3c0 .5-.4 1-1 1H4.5c-.6 0-1-.5-1-1V8.8c0-.4.2-.7.6-.9l8.1-5.4z"></path>
              <path d="M12 21V11l-10-7"></path>
              <path d="M12 11l10-7"></path>
              <path d="M17 21v-4.5h-2.3"></path>
              <path d="M12 3v2.3"></path>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Swift Responder
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Emergency Medical Services
            </p>
          </div>
        </div>
        <div className="border-l pl-4 hidden sm:block">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs text-muted-foreground">Organization: India</p>
            <Badge variant="outline" className="text-xs py-0 h-4">
              <Activity className="h-2.5 w-2.5 mr-1 text-green-500" />
              Live
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            ID: 3128-2810-3755
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <HospitalSuggester />
      </div>
    </header>
  );
}
