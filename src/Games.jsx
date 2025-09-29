import "./Games.css";

import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";

function Game() {
  const location = useLocation();
  const { name, url } = location.state || {};
  return (
    <div className={`game-page ${name}-page`}>
      <div className="game-header">
        <h1>{name}</h1>
        <Link to="/">
          <button className="button">Go Home</button>
        </Link>
      </div>
      <div className={`iframe-crop-container crop-${name}`}>
        <iframe src={url} className={`iframe-cropped cropped-${name}`}></iframe>
      </div>
    </div>
  );
}

export default Game;
