import heroImage from "../assets/hero.png";

const Hero = () => {
  return (
    <div className="w-full">
      <img
        src={heroImage}
        alt="Hero section"
        className="w-full max-h-[260px] object-cover object-center"
      />
    </div>
  );
};

export default Hero;
