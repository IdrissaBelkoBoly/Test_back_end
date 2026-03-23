import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Articles from "./pages/Articles";
import Users from "./pages/Users";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ArticleDetail from "./pages/ArticleDetail.js";
import Profile from "./pages/Profile.js";
import CheckoutPages from "./pages/CheckoutPages.js"; // ✅ Respecte le bon nom de fichier
import PurchaseSuccessPage from "./pages/PurchaseSuccessPage";
import CommentPage from "./pages/CommentPage.js";
import MyTransfers from "./pages/MyTransfers";
import MyPurchases from "./pages/MyPurchases";
import ConfirmationsPage from "./pages/ConfirmationsPage";


//import AddArticle from "./pages/AddArticle";
//import Comments from "./pages/Comments";
//import Favorites from "./pages/Favorites";
//import Chat from "./pages/Chat";

import PrivateRoute from "./utils/PrivateRoute.js";
import { AuthProvider, default as AuthContext } from "./auth/AuthContext.js";

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

const AppRoutes = () => {
  const { token } = useContext(AuthContext);

  return (
    <>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={token ? <Navigate to="/home" /> : <Navigate to="/login" />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/articles"
          element={
            <PrivateRoute>
              <Articles />
            </PrivateRoute>
          }
        />
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <Users />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
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

        <Route path="/checkout/:id" element={<CheckoutPages />} />

        <Route path="/purchase-success" element={<PurchaseSuccessPage />} />
        <Route path="/comments/:articleId" element={<CommentPage />} />
        <Route
          path="/my-transfers"
          element={
            <PrivateRoute>
              <MyTransfers />
            </PrivateRoute>
          }
        />

        <Route
          path="/my-purchases"
          element={
            <PrivateRoute>
              <MyPurchases />
            </PrivateRoute>
          }
        />

        <Route
          path="/confirmations"
          element={
            <PrivateRoute>
              <ConfirmationsPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
};

export default App;
