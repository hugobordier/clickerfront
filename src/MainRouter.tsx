import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from './App';
import About from './About';
import PageNotFound from './404Page/404Page';
import Pagejeu from './components/Pagejeu';

function MainRouter() {
  return (
    <Router>
      <Routes>
        <Route index element={<App />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<PageNotFound />} />
        <Route path="/Pagejeu" element={<Pagejeu />} />
      </Routes>
    </Router>
  );
}

export default MainRouter;
