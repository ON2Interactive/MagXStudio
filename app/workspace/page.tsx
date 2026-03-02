"use client";

import { useEffect, useState } from "react";
import { Globe, Image, LayoutPanelTop, Presentation, Settings } from "lucide-react";
import { AppWorkspace } from "@/components/workspaces/app-workspace";
import { VisualsWorkspace } from "@/components/workspaces/visuals-workspace";
import type { ReferenceImageInput } from "@/lib/types";
import { getClientUserName } from "@/lib/user-client";

type WorkspaceKey = "websites" | "slides" | "pages" | "visuals";

const workspaces: Array<{ key: WorkspaceKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: "websites", label: "Site Design", icon: Globe },
  { key: "slides", label: "Slides", icon: Presentation },
  { key: "pages", label: "Pages", icon: LayoutPanelTop },
  { key: "visuals", label: "Visuals", icon: Image }
];

export default function HomePage() {
  const [userName, setUserName] = useState("Username");
  const [workspace, setWorkspace] = useState<WorkspaceKey>("websites");
  const [incomingPagesImage, setIncomingPagesImage] = useState<ReferenceImageInput | null>(null);
  const [incomingPagesImageVersion, setIncomingPagesImageVersion] = useState(0);

  useEffect(() => {
    const nextUserName = getClientUserName();
    if (nextUserName) setUserName(nextUserName);
  }, []);

  const openSettings = () => {
    // Placeholder action until settings modal is implemented.
    console.info("Open settings");
  };

  const handleSendVisualToPages = (image: ReferenceImageInput) => {
    setIncomingPagesImage(image);
    setIncomingPagesImageVersion((value) => value + 1);
    setWorkspace("pages");
  };

  return (
    <main className="min-h-screen bg-[#141414] text-white">
      <header className="sticky top-0 z-30 bg-[#141414]/98 backdrop-blur-sm">
        <div className="w-full border-b border-black/45 py-2">
          <nav className="grid w-full grid-cols-4 items-center gap-2">
            {workspaces.map((tab) => {
              const Icon = tab.icon;
              const active = workspace === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`inline-flex h-10 items-center justify-center gap-2 px-0 text-xs font-medium transition ${active ? "bg-[#2b2b2b] text-white" : "text-white/55 hover:bg-[#202020] hover:text-white/85"
                    }`}
                  onClick={() => setWorkspace(tab.key)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <AppWorkspace
        kind="websites"
        userName={userName}
        active={workspace === "websites"}
      />

      <AppWorkspace kind="slides" userName={userName} active={workspace === "slides"} />
      <AppWorkspace
        kind="pages"
        userName={userName}
        active={workspace === "pages"}
        incomingReferenceImage={incomingPagesImage}
        incomingReferenceImageVersion={incomingPagesImageVersion}
      />
      <VisualsWorkspace
        active={workspace === "visuals"}
        userName={userName}
        onSendToPages={handleSendVisualToPages}
      />

      <button
        type="button"
        aria-label="Open settings"
        title="Settings"
        onClick={openSettings}
        className="fixed bottom-4 left-4 z-40 inline-flex h-7 w-7 items-center justify-center text-white/55 transition hover:text-white/90"
      >
        <Settings className="h-5 w-5" />
      </button>
    </main>
  );
}
