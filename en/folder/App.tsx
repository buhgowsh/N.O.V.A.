import { BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import LandingPage from "./pages/LandingPage"
import RecordPage from "./pages/RecordPage"
import About from "./pages/AboutPage";
import AnalysisPage from "./pages/AnalysisPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<About/>} />
        <Route path="/record" element={<RecordPage />} />
        <Route path="/report" element={<AnalysisPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
