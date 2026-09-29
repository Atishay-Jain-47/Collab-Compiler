import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import { ThemeProvider } from "./context/ThemeContext";

/**
 * Root React Application Router.
 * Configures top-level route mappings for Home (collaborative ide), Login, and Signup,
 * wrapped within the ThemeProvider.
 */
function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
