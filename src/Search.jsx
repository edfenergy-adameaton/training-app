import "./Search.css";
import { Link } from "react-router-dom";

function DisplayData(subject) {
  return (
    <div>
      <h1>{subject} Database</h1>
      <Link to="/">
        <button>Home</button>
      </Link>
    </div>
  );
}

export function SearchTennis() {
  return DisplayData("Tennis");
}

export function SearchFilm() {
  return DisplayData("Film");
}
