import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import '@/App.css';
import '@/index.css';

import RoutingInterface from './components/RoutingInterface';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import TestEvaluation from './components/TestEvaluation';
import { Toaster } from '@/components/ui/sonner';
import { Activity, BarChart3, TestTube2, Zap } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Route', icon: Zap },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/test', label: 'Evaluate', icon: TestTube2 },
  ];
  
  return (
    <nav className="border-b border-[#1F1F1F] bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center glow-primary">
              <Activity className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{fontFamily: 'Azeret Mono, monospace'}}>AI GATEWAY</h1>
              <p className="text-xs text-muted-foreground">Intelligent Routing System</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary text-black font-medium'
                      : 'hover:bg-white/10 text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <div className="App">
      <div className="hero-bg"></div>
      <div className="content-wrapper">
        <BrowserRouter>
          <Navigation />
          <Routes>
            <Route path="/" element={<RoutingInterface />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/test" element={<TestEvaluation />} />
          </Routes>
          <Toaster position="bottom-right" />
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;
