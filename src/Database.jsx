import "./Database.css";

import { Link } from "react-router-dom";

function Game() {
  return (
    <div className={`Database`}>
      <div className="database-header">
        <h1>Database</h1>
        <Link to="/">
          <button className="button">Go Home</button>
        </Link>
      </div>
    </div>
  );
}

export default Game;
