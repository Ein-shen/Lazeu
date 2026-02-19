import Greetings from "../components/Greetings";
import StudyChat from "../Home/StudyChat";

const Home = () => {
  return (
    <main className="relative min-h-full w-full overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Welcome section */}
        <section className="flex w-full flex-col items-center text-center">
          <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl md:text-4xl">
            <Greetings /> Let's go study?
          </h1>

          <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-500 sm:text-base">
            Make today count. Take a step closer to your learning goals.
          </p>

          <div className="my-7 flex items-center justify-center sm:my-10">
            <img
              src="/mortarboard.png"
              alt="Graduation cap"
              className="h-20 w-20 object-contain sm:h-28 sm:w-28 md:h-32 md:w-32"
            />
          </div>
        </section>

        {/* Square study chatbot (replaces the recent decks list) */}
        <section className="flex w-full min-w-0 justify-center">
          <StudyChat />
        </section>
      </div>
    </main>
  );
};

export default Home;