import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageTransition } from "@/components/PageTransition";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Home } from "@/pages/Home";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { Dashboard } from "@/pages/Dashboard";
import { JobProfileNew } from "@/pages/JobProfileNew";
import { JobProfileDetail } from "@/pages/JobProfileDetail";
import { InterviewTranscript } from "@/pages/InterviewTranscript";
import { InterviewLanding } from "@/pages/InterviewLanding";
import { Practice } from "@/pages/Practice";
import { InterviewSession } from "@/pages/InterviewSession";
import { Scorecard } from "@/pages/Scorecard";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <PageTransition><Dashboard /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/job-profiles/new"
          element={
            <ProtectedRoute>
              <PageTransition><JobProfileNew /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/job-profiles/:id"
          element={
            <ProtectedRoute>
              <PageTransition><JobProfileDetail /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/interviews/:id/transcript"
          element={
            <ProtectedRoute>
              <PageTransition><InterviewTranscript /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route path="/interview/:interviewLink" element={<PageTransition><InterviewLanding /></PageTransition>} />
        <Route path="/practice" element={<PageTransition><Practice /></PageTransition>} />
        <Route path="/interview-session/:interviewId" element={<PageTransition><InterviewSession /></PageTransition>} />
        <Route path="/scorecard/:interviewId" element={<PageTransition><Scorecard /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <AnimatedRoutes />
      </Layout>
      <InstallPrompt />
    </BrowserRouter>
  );
}
