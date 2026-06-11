import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
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
        <Route path="/admin/map-preview" element={<MapPreview />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
