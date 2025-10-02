import "./Home.css";
import { Link } from "react-router-dom";
import { useImageUrls, getImageUrl } from "./hooks/useImageUrls";

const GameImages = [
  {
    name: "snake",
    // This will use local file since Snake.jpeg is not in S3
    img: `${import.meta.env.BASE_URL}/Snake.jpeg`,
    url: "https://editor.p5js.org/Adsa2/full/SNx0iJ8tq",
  },
  {
    name: "aim-trainer",
    // This will use pre-signed URL for chess.png from S3
    s3Image: "chess.png",
    img: `${import.meta.env.BASE_URL}/chess.png`, // fallback
    url: "https://editor.p5js.org/Adsa2/full/lrpPC4nIt",
  },
  {
    name: "flappy-bird",
    // This will use local file since flappy.png is not in S3
    img: `${import.meta.env.BASE_URL}/flappy.png`,
    url: "https://editor.p5js.org/Adsa2/full/7sfQIq1yp",
  },
  {
    name: "pong",
    // This will use local file since pong.png is not in S3
    img: `${import.meta.env.BASE_URL}/pong.png`,
    url: "https://editor.p5js.org/Adsa2/full/WRYvYDXT-",
  },
];

const DataImages = [
  {
    name: "tennis",
    img: `${import.meta.env.BASE_URL}/tennis.jpg`,
    link: "/search-tennis",
  },
  {
    name: "film",
    img: `${import.meta.env.BASE_URL}/film.jpg`,
    link: "/search-film",
  },
  {
    name: "database",
    // This will use pre-signed URL if frog.png exists in S3
    s3Image: "frog.png",
    img: `${import.meta.env.BASE_URL}/database.jpg`, // fallback
    link: "/database",
  },
];

function Home() {
  const { imageUrls, loading, error } = useImageUrls();

  // Show loading state while fetching pre-signed URLs
  if (loading) {
    return (
      <div className="home-container">
        <div className="loading-container">
          <h2>Loading images...</h2>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // Show error state if pre-signed URLs failed to load
  if (error) {
    console.warn('Failed to load S3 images, using fallback URLs:', error);
  }

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Home</h1>
        <img
          className="header-image"
          src={`${import.meta.env.BASE_URL}//EDF_Energy_logo.svg.png`}
          alt="edf logo"
        />
      </header>
      <h2>Games</h2>
      <div className="image-container">
        {GameImages.map((image) => {
          // Get the appropriate image URL (pre-signed or fallback)
          const imageUrl = image.s3Image 
            ? getImageUrl(imageUrls, image.s3Image, image.img)
            : image.img;

          return (
            <Link
              key={image.name}
              to={"/games"}
              state={{ name: image.name, url: image.url }}
            >
              <img className="image" src={imageUrl} alt={image.name} />
            </Link>
          );
        })}
      </div>
      <h2>Databases</h2>
      <div className="image-container">
        {DataImages.map((image) => {
          // Get the appropriate image URL (pre-signed or fallback)
          const imageUrl = image.s3Image 
            ? getImageUrl(imageUrls, image.s3Image, image.img)
            : image.img;

          return (
            <Link key={image.name} to={image.link}>
              <img className="image" src={imageUrl} alt={image.name} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default Home;
