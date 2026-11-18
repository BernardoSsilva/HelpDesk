import { Suspense, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import PageFallback from "./PageFallback";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell min-h-screen lg:flex">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-blue-700 focus:shadow-lg"
        href="#conteudo"
      >
        Pular para o conteúdo
      </a>
      <Sidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="min-w-0 flex-1 lg:pl-60">
        <Topbar onMenuClick={() => setMobileNavOpen((current) => !current)} />
        <main className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8" id="conteudo" tabIndex={-1}>
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
