import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Calendar from "./pages/Calendar";
import Groups from "./pages/Groups";
import Bracket from "./pages/Bracket";
import Memorial from "./pages/Memorial";
import Night from "./pages/Night";
import MatchPage from "./pages/MatchPage";
import NationPage from "./pages/NationPage";
import Methodo from "./pages/Methodo";
import Snapshot from "./pages/Snapshot";
import EmbedMap from "./pages/EmbedMap";
import Finale from "./pages/Finale";
import AdminHome from "./pages/admin/AdminHome";
import MapPreview from "./pages/admin/MapPreview";

/**
 * Routing Atlas (spec §12). Les routes sont ajoutées au fil des phases P0→P2 :
 * /, /nuit/:date, /m/:id, /n/:code, /groupes(/:letter), /tableau, /calendrier,
 * /memorial, /snapshot/:date, /fin, /methodo, /embed/map, /admin.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/calendrier" element={<Calendar />} />
        <Route path="/groupes" element={<Groups />} />
        <Route path="/groupes/:letter" element={<Groups />} />
        <Route path="/tableau" element={<Bracket />} />
        <Route path="/memorial" element={<Memorial />} />
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
    </BrowserRouter>
  );
}
