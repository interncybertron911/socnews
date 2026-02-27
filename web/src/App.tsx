import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import NavSidebar from './components/NavSidebar';
import SuggestedPage from './pages/Suggested/SuggestedPage';
import NewsPage from './pages/News/NewsPage';
import SigmaRulesPage from './pages/SigmaRules/SigmaRulesPage';
import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';
import SettingsPage from './pages/Settings/SettingsPage';
import UserManagementPage from './pages/Admin/UserManagementPage';
import HistoryPage from './pages/History/HistoryPage';
import { authService } from './services/authService';

function App() {
    const location = useLocation(); // Forces re-render on route change to update auth state
    const isLoggedIn = authService.isLoggedIn();
    const user = authService.getCurrentUser();
    const isAdmin = user?.type === 'admin';

    return (
        <Routes>
            {/* Index Route */}
            <Route path="/" element={<Navigate to={isLoggedIn ? "/news" : "/login"} replace />} />

            {/* Auth Routes */}
            <Route path="/login" element={isLoggedIn ? <Navigate to="/news" replace /> : <LoginPage />} />
            <Route path="/signup" element={isLoggedIn ? <Navigate to="/news" replace /> : <SignupPage />} />

            {/* Protected Dashboard Area */}
            <Route
                path="/news"
                element={
                    isLoggedIn ? (
                        <div className="dashboard-container">
                            <Header />
                            <main className="main-content">
                                <NavSidebar />
                                <NewsPage />
                            </main>
                        </div>
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />
            <Route
                path="/lookup"
                element={
                    isLoggedIn ? (
                        <div className="dashboard-container">
                            <Header />
                            <main className="main-content">
                                <NavSidebar />
                                <SuggestedPage />
                            </main>
                        </div>
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />

            <Route
                path="/rules"
                element={
                    isLoggedIn ? (
                        <div className="dashboard-container">
                            <Header />
                            <main className="main-content">
                                <NavSidebar />
                                <SigmaRulesPage />
                            </main>
                        </div>
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />

            <Route
                path="/settings"
                element={
                    isLoggedIn ? (
                        <div className="dashboard-container">
                            <Header />
                            <main className="main-content">
                                <NavSidebar />
                                <SettingsPage />
                            </main>
                        </div>
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />

            <Route
                path="/history"
                element={
                    isLoggedIn ? (
                        <div className="dashboard-container">
                            <Header />
                            <main className="main-content">
                                <NavSidebar />
                                <HistoryPage />
                            </main>
                        </div>
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />

            <Route
                path="/admin/users"
                element={
                    isLoggedIn && isAdmin ? (
                        <div className="dashboard-container">
                            <Header />
                            <main className="main-content">
                                <NavSidebar />
                                <UserManagementPage />
                            </main>
                        </div>
                    ) : (
                        <Navigate to={isLoggedIn ? "/lookup" : "/login"} replace />
                    )
                }
            />

            {/* Catch-all: Redirect to root */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
