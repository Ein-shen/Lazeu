 
import Greetings from "../components/Greetings";
import StudyChat from "./StudyChat";
import Stats from "../components/Stats";
import RecentDecks from "../components/RecentDecks";

const Home = () => {
  return (
    <main className="min-h-screen w-full overflow-x-hidden">
      <div className="mx-auto flex w-full flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* Greeting */}
        <section className="mb-8 flex w-full justify-center text-center">
          <h1 className="flex flex-wrap items-center justify-center gap-2 text-2xl font-bold tracking-tight text-gray-500 sm:text-3xl md:text-4xl">
            <Greetings />

            <span>Let's go study?</span>

            <img
              src="/mortarboard.png"
              alt="Graduation cap"
              className="h-8 w-8 shrink-0 sm:h-10 sm:w-10 md:h-12 md:w-12"
            />
          </h1>
        </section>

        {/* Stats */}
        <section className="mb-6 w-full min-w-0 sm:mb-8">
          <Stats />
        </section>

        {/* Banner and Study Chat */}
     
          <section className="w-full min-w-0">
            <div className="w-full min-w-0 rounded-3xl border border-white/40 bg-div-theme p-3 text-dark-theme shadow-[0_8px_30px_rgba(58,68,81,0.10)] sm:p-5">

              <div className="grid w-full min-w-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-2 lg:gap-5">

                {/* Goodluck Banner */}
                <div className="flex h-full min-h-[400px] w-full min-w-0">
                  <RecentDecks />
                </div>

                {/* Study Chat */}
                <div className="flex h-full min-h-[400px] w-full min-w-0">
                  <StudyChat />
                </div>

              </div>

            </div>
          </section>
 

      </div>
    </main>
  );
};

export default Home;
 