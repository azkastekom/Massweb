import { Link, Outlet } from '@tanstack/react-router';
import { useAuth } from '../contexts/auth-context';
import { LogOut, User, FolderKanban, Shield, FileText } from 'lucide-react';
import { OrganizationSwitcher } from './OrganizationSwitcher';

export default function Layout() {
    const { user, logout, isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* Logo and Navigation */}
                        <div className="flex items-center space-x-8">
                            <Link to="/" className="flex items-center space-x-2">
                                <FolderKanban className="w-8 h-8 text-blue-600" />
                                <span className="text-xl font-bold text-gray-900">Massweb</span>
                            </Link>

                            {isAuthenticated && (
                                <>
                                    <OrganizationSwitcher />
                                    <div className="hidden md:flex space-x-4">
                                        <Link
                                            to="/projects"
                                            className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                            activeProps={{ className: 'text-blue-600 bg-blue-50' }}
                                        >
                                            Projects
                                        </Link>
                                        <Link
                                            to="/contents"
                                            className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
                                            activeProps={{ className: 'text-blue-600 bg-blue-50' }}
                                        >
                                            <FileText className="w-4 h-4" />
                                            Contents
                                        </Link>
                                        {user?.isSuperAdmin && (
                                            <Link
                                                to="/admin/organizations"
                                                className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
                                                activeProps={{ className: 'text-purple-600 bg-purple-50' }}
                                            >
                                                <Shield className="w-4 h-4" />
                                                Admin
                                            </Link>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* User Menu */}
                        <div className="flex items-center space-x-4">
                            {isAuthenticated && user ? (
                                <>
                                    <div className="flex items-center space-x-3 text-sm">
                                        <User className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="font-medium text-gray-900">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Logout</span>
                                    </button>
                                </>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <Link
                                        to="/login"
                                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-md transition-colors"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                                    >
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main>
                <Outlet />
            </main>
        </div>
    );
}
