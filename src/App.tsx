import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";

// Code-split par route (budget perf §14) : seule la home est dans le bundle
// initial, le reste se charge à la navigation.
const Calendar = lazy(() => import("./pages/Calendar"));
const Groups = lazy(() => import("./pages/Groups"));
const Bracket = lazy(() => import("./pages/Bracket"));
const Memorial = lazy(() => import("./pages/Memorial"));
const Night = lazy(() => import("./pages/Night"));
const Snapshot = lazy(() => import("./pages/Snapshot"));
const Multiverse = lazy(() => import("./pages/Multiverse"));
const Gazette = lazy(() => import("./pages/Gazette"));
const MatchPage = lazy(() => import("./pages/MatchPage"));
const NationPage = lazy(() => import("./pages/NationPage"));
const Methodo = lazy(() => import("./pages/Methodo"));
const EmbedMap = lazy(() => import("./pages/EmbedMap"));
const Finale = lazy(() => import("./pages/Finale"));
const AdminHome = lazy(() => import("./pages/admin/AdminHome"));
const MapPreview = lazy(() => import("./pages/admin/MapPreview"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center font-mono text-xs uppercase tracking-widest text-navy/40">
      Chargement…
    </div>
  );
}

/**
 * Routing Atlas (spec §12). Les routes sont ajoutées au fil des phases P0→P2 :
 * /, /nuit/:date, /m/:id, /n/:code, /groupes(/:letter), /tableau, /calendrier,
 * /memorial, /snapshot/:date, /fin, /methodo, /embed/map, /admin.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/calendrier" element={<Calendar />} />
          <Route path="/groupes" element={<Groups />} />
          <Route path="/groupes/:letter" element={<Groups />} />
          <Route path="/tableau" element={<Bracket />} />
          <Route path="/multivers" element={<Multiverse />} />
          <Route path="/memorial" element={<Memorial />} />
          <Route path="/gazette" element={<Gazette />} />
          <Route path="/gazette/:date" element={<Gazette />} />
          <Route path="/nuit" element={<Night />} />
          <Route path="/nuit/:date" element={<Night />} />
          <Route path="/snapshot" element={<Snapshot />} />
          <Route path="/snapshot/:date" element={<Snapshot />} />
          <Route path="/m/:id" element={<MatchPage />} />
          <Route path="/n/:code" element={<NationPage />} />
          <Route path="/methodo" element={<Methodo />} />
          <Route path="/embed/map" element={<EmbedMap />} />
          <Route path="/fin" element={<Finale />} />
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/map-preview" element={<MapPreview />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
