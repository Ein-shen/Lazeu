import { Link } from 'react-router-dom'
import Search from '../Home/Search'

const Upperbar = () => {
  return (
    <div className="flex flex-row items-center gap-1 sm:gap-4 text-black">
      {/* Search sits right beside the bell; short on phones, normal width on md+ */}
      <div className="w-28 sm:w-44 md:w-auto [&>*]:w-full md:[&>*]:w-auto">
        <Search />
      </div>

      <Link to="/notification" className="rounded-lg p-1.5 transition hover:bg-black/10">
        <img
          src="https://img.icons8.com/?size=100&id=nY7Q73ERmlBS&format=png&color=000000"
          alt="Notification"
          className="h-5 w-5 sm:h-6 sm:w-6"
        />
      </Link>

      <Link to="/message" className="rounded-lg p-1.5 transition hover:bg-black/10">
        <img
          src="https://img.icons8.com/?size=100&id=jOjH1Mt48Fp1&format=png&color=000000"
          alt="Messenger"
          className="h-5 w-5 sm:h-6 sm:w-6"
        />
      </Link>
    </div>
  )
}

export default Upperbar