"use client";

import { useEffect, useState } from "react";
import { Globe, Image, LayoutPanelTop, Presentation, Settings } from "lucide-react";
import { AppWorkspace } from "@/components/workspaces/app-workspace";
import { VisualsWorkspace } from "@/components/workspaces/visuals-workspace";
import type { ReferenceImageInput } from "@/lib/types";
import { getClientUserName, setClientUserName } from "@/lib/user-client";
import { createClient } from "@/lib/supabase/client";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { CreditsProvider, useCredits } from "@/components/workspaces/credits-provider";

type WorkspaceKey = "websites" | "slides" | "pages" | "visuals";

function AutoOpenSettings({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { credits, isLoading } = useCredits();

  useEffect(() => {
    if (!isLoading && typeof credits === "number" && credits <= 0) {
      onOpenSettings();
    }
  }, [credits, isLoading, onOpenSettings]);

  return null;
}

const workspaces: Array<{ key: WorkspaceKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: "websites", label: "Site Design", icon: Globe },
  { key: "slides", label: "Slides", icon: Presentation },
  { key: "pages", label: "Pages", icon: LayoutPanelTop },
  { key: "visuals", label: "Visuals", icon: Image }
];

export default function HomePage() {
  const [userName, setUserName] = useState("Username");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [workspace, setWorkspace] = useState<WorkspaceKey>("websites");
  const [incomingPagesImage, setIncomingPagesImage] = useState<ReferenceImageInput | null>(null);
  const [incomingPagesImageVersion, setIncomingPagesImageVersion] = useState(0);

  useEffect(() => {
    // Show stored name instantly (avoids flash)
    const stored = getClientUserName();
    if (stored) setUserName(stored);

    // Fetch authoritative name from Supabase session
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "User";
        const name = fullName.split(" ")[0];
        setClientUserName(name);
        setUserName(name);
      }
    };
    fetchUser();
  }, []);

  const openSettings = () => setSettingsOpen(true);

  const handleSendVisualToPages = (image: ReferenceImageInput) => {
    setIncomingPagesImage(image);
    setIncomingPagesImageVersion((value) => value + 1);
    setWorkspace("pages");
  };

  return (
    <main className="min-h-screen bg-[#141414] text-white">
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
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

      <CreditsProvider>
        <AutoOpenSettings onOpenSettings={openSettings} />

        <AppWorkspace
          kind="websites"
          userName={userName}
          active={workspace === "websites"}
          onOpenSettings={openSettings}
        />

        <AppWorkspace kind="slides" userName={userName} active={workspace === "slides"} onOpenSettings={openSettings} />
        <AppWorkspace
          kind="pages"
          userName={userName}
          active={workspace === "pages"}
          incomingReferenceImage={incomingPagesImage}
          incomingReferenceImageVersion={incomingPagesImageVersion}
          onOpenSettings={openSettings}
        />
        <VisualsWorkspace
          active={workspace === "visuals"}
          userName={userName}
          onSendToPages={handleSendVisualToPages}
          onOpenSettings={openSettings}
        />
      </CreditsProvider>

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
