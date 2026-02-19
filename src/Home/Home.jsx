import Greetings from "../components/Greetings";
import StudyChat from "../Home/StudyChat";

const Home = () => {
  return (
    <main className="relative min-h-full w-full overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Welcome section */}
        <section className="flex w-full flex-col items-center pb-6 text-center sm:pb-8">
          <h1 className="flex flex-row flex-wrap items-center justify-center gap-x-2 text-2xl font-bold leading-tight tracking-tight text-gray-500 [&_*]:text-inherit sm:text-3xl md:text-4xl">
            <Greetings /> Let's go study?
            <img
              src="/mortarboard.png"
              alt="Graduation cap"
              className="h-10 w-10   sm:h-12 sm:w-12"
            />
          </h1>
        </section>

        {/* Square study chatbot */}
        <section className="flex w-full min-w-0 justify-center">
          <StudyChat />
        </section>
      </div>
    </main>
  );
};

export default Home;