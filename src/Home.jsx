import "./Home.css";
import { Link } from "react-router-dom";

const GameImages = [
  {
    name: "snake",
    img: `${import.meta.env.BASE_URL}/Snake.jpeg`,
    url: "https://editor.p5js.org/Adsa2/full/SNx0iJ8tq",
  },
  {
    name: "aim-trainer",
    img: `${import.meta.env.BASE_URL}/chess.png`,
    url: "https://editor.p5js.org/Adsa2/full/lrpPC4nIt",
  },
  {
    name: "flappy-bird",
    img: `${import.meta.env.BASE_URL}/flappy.png`,
    url: "https://editor.p5js.org/Adsa2/full/7sfQIq1yp",
  },
  {
    name: "pong",
    img: `${import.meta.env.BASE_URL}/pong.png`,
    url: "https://editor.p5js.org/Adsa2/full/WRYvYDXT-",
  },
];

const DataImages = [
  {
    name: "tennis",
    img: `${import.meta.env.BASE_URL}/tennis.jpg`,
    link: "/Database/tennis",
  },
  {
    name: "aim-trainer",
    img: `${import.meta.env.BASE_URL}/film.jpg`,
    link: "/Database/film",
  },
];

function Home() {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Home</h1>
        <img className="header-image" src="/EDF_Energy_logo.svg.png" />
      </header>
      <h2>Games</h2>
      <div className="image-container">
        {GameImages.map((image) => (
          <Link
            key={image.name}
            to={"/games"}
            state={{ name: image.name, url: image.url }}
          >
            <img className="image" src={image.img} />
          </Link>
        ))}
      </div>
      <h2>Databases</h2>
      <div className="image-container">
        {DataImages.map((image) => (
          <img className="image" src={image.img} />
        ))}
      </div>
    </div>
  );
}

export default Home;
