/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import StoryDetail from "./pages/StoryDetail";
import Level2ObservationDetail from "./pages/Level2ObservationDetail";
import MatchDetail from "./pages/MatchDetail";
import StoriesArchive from "./pages/StoriesArchive";
import MatchesCalendar from "./pages/MatchesCalendar";
import EntityDetail from "./pages/EntityDetail";
import Explorer from "./pages/Explorer";
import Observatory from "./pages/Observatory";
import Methodology from "./pages/Methodology";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import SourceCode from "./pages/SourceCode";
import Contact from "./pages/Contact";
import Search from "./pages/Search";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/story/:slug" element={<StoryDetail />} />
        <Route path="/observation/:slug" element={<Level2ObservationDetail />} />
        <Route path="/match/:slug" element={<MatchDetail />} />
        <Route path="/stories" element={<StoriesArchive />} />
        <Route path="/matches" element={<MatchesCalendar />} />
        <Route path="/entity/:slug" element={<EntityDetail />} />
        <Route path="/explorer" element={<Explorer />} />
        <Route path="/observatoire" element={<Observatory />} />
        <Route path="/methodology" element={<Methodology />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/source" element={<SourceCode />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/search" element={<Search />} />
      </Routes>
    </BrowserRouter>
  );
}
