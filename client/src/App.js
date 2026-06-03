import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ArticleDetail from "./pages/ArticleDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateArticle from "./pages/CreateArticle";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";
import { useAuth } from "./auth/AuthContext";
import { useContext, useEffect } from "react";
import "./App.css";
import CallComponent from "./components/CallComponent";
import GlobalCallUI from "./components/GlobalCallUI";
import CallContext from "./context/CallContext";
import CallsPage from "./pages/CallsPage";


// 🔐 Protection des routes
const PrivateRoute = ({ children }) => {
  const { token, loading } = useAuth();
 
  if(loading) return <p>chargement...</p>

  return token ? children : <Navigate to="/login" />;
};


function App() {

  const { currentCallUser, callAccepted, callData } = useContext(CallContext);
   
  useEffect(() => {
    const unlockAudio = () => {
      document.querySelectorAll("audio").forEach((audio) => {
        audio
          .play()
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
          })
          .catch(() => {});
      });

      window.removeEventListener("click", unlockAudio);
    };

    window.addEventListener("click", unlockAudio);
  }, []);

  return (
    <>
      <Navbar />

      <Routes>
        {/* 🔓 PUBLIC */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/calls" element={<CallsPage />} />

        {/* 🔒 PRIVÉ */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />

        <Route
          path="/article/:id"
          element={
            <PrivateRoute>
              <ArticleDetail />
            </PrivateRoute>
          }
        />

        <Route
          path="/create"
          element={
            <PrivateRoute>
              <CreateArticle />
            </PrivateRoute>
          }
        />

        {/* 📩 LISTE DES CONVERSATIONS */}
        <Route
          path="/messages"
          element={
            <PrivateRoute>
              <Messages />
            </PrivateRoute>
          }
        />

        {/* 💬 CONVERSATION AVEC UN USER */}
        <Route
          path="/messages/:userId"
          element={
            <PrivateRoute>
              <Messages />
            </PrivateRoute>
          }
        />
      </Routes>

      {(callAccepted || callData) && (
        <CallComponent key={currentCallUser?._id || "call"} />
      )}

      <GlobalCallUI />
    </>
  );
}

export default App;
