import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/contexts/UserContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Landing from "./pages/Landing";
import ChooseHero from "./pages/ChooseHero";
import SetupPin from "./pages/SetupPin";
import EnterPin from "./pages/EnterPin";
import LearningQuiz from "./pages/LearningQuiz";
import ProfileReveal from "./pages/ProfileReveal";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import LogicLab from "./pages/LogicLab";
import GameZone from "./pages/GameZone";
import VoiceMode from "./pages/VoiceMode";
import Progress from "./pages/Progress";
import Social from "./pages/Social";
import CharacterGallery from "./pages/CharacterGallery";
import PdfLab from "./pages/PdfLab";
import VisualMethod from "./pages/VisualMethod";
import NarrativeMethod from "./pages/NarrativeMethod";
import VisualLab from "./components/VisualLab";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <UserProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/choose-hero" element={<ChooseHero />} />
              <Route path="/setup-pin" element={<SetupPin />} />
              <Route path="/enter-pin" element={<EnterPin />} />
              <Route path="/learning-quiz" element={<LearningQuiz />} />
              <Route path="/profile-reveal" element={<ProfileReveal />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/logic-lab" element={<LogicLab />} />
              <Route path="/game-zone" element={<GameZone />} />
              <Route path="/voice-mode" element={<VoiceMode />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/social" element={<Social />} />
              <Route path="/character-gallery" element={<CharacterGallery />} />
              <Route path="/pdf-lab" element={<PdfLab />} />
              <Route path="/visual-method" element={<VisualMethod />} />
              <Route path="/narrative-method" element={<NarrativeMethod />} />
              <Route path="/visual-lab" element={<VisualLab />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </UserProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
