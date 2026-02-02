import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

// Back arrow.
//   to         a path like `/decks/${deckId}`, or "back" to go back one page. Defaults to "/".
//   className  extra classes for the button
const Return = ({ to = "/", className = "" }) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (to === "back") {
      navigate(-1)
      return
    }

    // a literal ":param" means the id was never filled in by the caller
    if (typeof to === "string" && to.includes(":")) {
      console.warn(`Return: "to" contains a route pattern (${to}). Build the path with the real id.`)
    }

    navigate(to)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Go back"
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-black/10 ${className}`}
    >
      <ArrowLeft size={24} color="black" />
    </button>
  )
}

export default Return