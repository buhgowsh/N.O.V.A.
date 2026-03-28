import { Menu } from "lucide-react";
import { Link } from "react-router-dom"; // Fixed import

export default function Navbar() {
  return (
    <header className="fixed top-8 left-1/2 -translate-x-1/2 w-[90%] max-5xl px-8 py-3 flex items-center font-theme justify-between border border-blue-700 rounded-3xl shadow-2xl z-50 bg-white/90 backdrop-blur-sm">
      {/* Logo */}
      <Link to="/">
        <div className="text-2xl font-bold tracking-wide text-blue-800 pl-2">
          NOVA
        </div>
      </Link>
      
      {/* Navigation Links */}
      <nav className="hidden md:flex items-center space-x-6 pr-2">
        <Link 
          to="/about" 
          className="text-xl font-bold font-extrabold hover:text-blue-600 transition-colors"
        >
          About
        </Link>
        <Link 
          to="/record" 
          className="text-xl font-bold font-extrabold hover:text-blue-600 transition-colors"
        >
          Focus
        </Link>
      </nav>
      
      {/* Mobile Menu Button */}
      <div className="md:hidden pr-2">
        <Menu className="w-6 h-6" />
      </div>
    </header>
  );
}