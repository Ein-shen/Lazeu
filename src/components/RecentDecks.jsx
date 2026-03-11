 
export default function RecentDecks() {
  return (
    <section
      className="relative flex h-full min-h-[320px] w-full min-w-0
                 flex-1 items-center justify-center overflow-hidden
                 rounded-3xl border border-white/40
                 bg-cover bg-center bg-no-repeat p-6
                 sm:p-8 lg:p-10"
      style={{
        backgroundImage: "url('/bg.png')",
      }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Centered message */}
      <div className="relative z-10 flex w-full items-center justify-center text-center">
        <h2 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl">
          Goodluck babe,
          <br />
          make me proud ♡
        </h2>
      </div>
    </section>
  );
}
 