import "./App.css";
import Home from "./Home";
import Game from "./Games";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter basename="/training-app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games" element={<Game />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
