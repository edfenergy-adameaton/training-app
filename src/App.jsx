import "./App.css";
import Home from "./Home";
import Game from "./Games";
import Database from "./Database";
import { SearchTennis, SearchFilm } from "./Search";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter basename="/training-app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games" element={<Game />} />
        <Route path="/database" element={<Database />} />
        <Route path="/search-tennis" element={<SearchTennis />} />
        <Route path="/search-film" element={<SearchFilm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
