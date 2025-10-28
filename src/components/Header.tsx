import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, User, Menu, X, Home, Search, Building2, Shield, Compass, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  variant?: 'hero' | 'page';
}

const Header: React.FC<HeaderProps> = ({ variant = 'page' }) => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout().then(() => {
      navigate('/');
      setIsUserMenuOpen(false);
    });
  };

  const isHeroVariant = variant === 'hero';
  const textColor = isHeroVariant ? 'text-white' : 'text-gray-800';
  const hoverTextColor = isHeroVariant ? 'hover:text-blue-200' : 'hover:text-blue-600';
  const logoTextColor = isHeroVariant ? 'text-white' : 'text-blue-600';
  const logoAccentColor = isHeroVariant ? 'text-orange-300' : 'text-orange-500';
  const dropShadow = isHeroVariant ? 'drop-shadow-lg' : '';
  const buttonBg = isHeroVariant ? 'bg-white/20 backdrop-blur-sm border-white/30' : 'bg-blue-600 border-blue-600';
  const buttonText = isHeroVariant ? 'text-white' : 'text-white';
  const buttonHover = isHeroVariant ? 'hover:bg-white/30' : 'hover:bg-blue-700';

  return (
    <header className={`${isHeroVariant ? 'absolute' : 'fixed'} top-0 left-0 right-0 z-50 ${isHeroVariant ? 'bg-transparent' : 'bg-white shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <MapPin className={`h-6 w-6 sm:h-8 sm:w-8 ${logoTextColor} ${dropShadow}`} />
            <span className="text-xl sm:text-2xl font-bold">
              <span className={`${logoTextColor} ${dropShadow}`}>Bharat</span>
              <span className={`${logoAccentColor} ${dropShadow}`}>Trips</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-3 lg:space-x-6 xl:space-x-8">
            <Link to="/" className={`flex items-center space-x-1 ${textColor} ${hoverTextColor} transition-colors duration-300 ${dropShadow}`}>
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            <Link to="/hotels" className={`flex items-center space-x-1 ${textColor} ${hoverTextColor} transition-colors duration-300 ${dropShadow}`}>
              <Building2 className="h-4 w-4" />
              <span>Hotels</span>
            </Link>
            <Link to="/tours" className={`flex items-center space-x-1 ${textColor} ${hoverTextColor} transition-colors duration-300 ${dropShadow}`}>
              <Compass className="h-4 w-4" />
              <span>Tours</span>
            </Link>
            <Link to="/admin" className={`flex items-center space-x-1 ${textColor} ${hoverTextColor} transition-colors duration-300 ${dropShadow}`}>
              <Shield className="h-4 w-4" />
              <span>Admin</span>
            </Link>
            <Link 
              to="/list-property" 
              className={`flex items-center space-x-1 px-3 sm:px-4 py-2 rounded-lg border transition-all duration-300 font-medium ${
                isHeroVariant 
                  ? 'bg-orange-500/90 backdrop-blur-sm border-orange-400/30 hover:bg-orange-600 text-white' 
                  : 'bg-orange-500 border-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>List Your Property</span>
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 lg:px-4 py-2 rounded-lg ${buttonBg} ${buttonText} ${buttonHover} border transition-all duration-300 text-sm sm:text-base`}
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:block max-w-20 md:max-w-32 lg:max-w-none truncate">{user.name}</span>
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-lg shadow-xl border z-50">
                    <div className="py-1">
                      <div className="px-4 py-3 border-b">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/list-property"
                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        List Your Property
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Link
                  to="/login"
                  className={`px-3 sm:px-4 py-2 text-sm sm:text-base ${textColor} ${hoverTextColor} transition-colors duration-300 ${dropShadow} whitespace-nowrap`}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className={`px-3 sm:px-4 md:px-5 py-2 rounded-lg text-sm sm:text-base ${isHeroVariant ? 'bg-orange-500/90 backdrop-blur-sm border-orange-400/30 hover:bg-orange-600' : 'bg-orange-500 border-orange-500 hover:bg-orange-600'} text-white transition-all duration-300 whitespace-nowrap font-medium`}
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden p-2 rounded-lg ${isHeroVariant ? 'hover:bg-white/20' : 'hover:bg-gray-100'} ${textColor} transition-colors duration-300 ml-1 sm:ml-2`}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className={`md:hidden border-t ${isHeroVariant ? 'bg-black/20 backdrop-blur-md border-white/20' : 'bg-white border-gray-200'} max-h-[calc(100vh-4rem)] overflow-y-auto`}>
            <nav className="py-4 space-y-1">
              <Link 
                to="/" 
                className={`flex items-center space-x-3 px-4 sm:px-6 py-3 sm:py-4 ${textColor} ${isHeroVariant ? 'hover:bg-white/10' : 'hover:bg-gray-50'} transition-colors duration-300 text-sm sm:text-base font-medium`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
              <Link 
                to="/hotels" 
                className={`flex items-center space-x-3 px-4 sm:px-6 py-3 sm:py-4 ${textColor} ${isHeroVariant ? 'hover:bg-white/10' : 'hover:bg-gray-50'} transition-colors duration-300 text-sm sm:text-base font-medium`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Building2 className="h-4 w-4" />
                <span>Hotels</span>
              </Link>
              <Link 
                to="/tours" 
                className={`flex items-center space-x-3 px-4 sm:px-6 py-3 sm:py-4 ${textColor} ${isHeroVariant ? 'hover:bg-white/10' : 'hover:bg-gray-50'} transition-colors duration-300 text-sm sm:text-base font-medium`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Compass className="h-4 w-4" />
                <span>Tours</span>
              </Link>
              <Link 
                to="/tours" 
                className={`flex items-center space-x-3 px-4 sm:px-6 py-3 sm:py-4 ${textColor} ${isHeroVariant ? 'hover:bg-white/10' : 'hover:bg-gray-50'} transition-colors duration-300 text-sm sm:text-base font-medium`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Compass className="h-4 w-4" />
                <span>Tours</span>
              </Link>
              
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  if (user) {
                    navigate('/list-property');
                  } else {
                    sessionStorage.setItem('redirectAfterLogin', '/list-property');
                    navigate('/login');
                  }
                }}
                className={`flex items-center space-x-3 px-4 sm:px-6 py-3 sm:py-4 rounded-lg transition-all duration-300 font-medium ${
                  isHeroVariant 
                    ? 'bg-orange-500/90 backdrop-blur-sm hover:bg-orange-600 text-white' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                } mx-4 sm:mx-6 w-full text-left`}
              >
                <Building2 className="h-4 w-4" />
                <span>List Your Property</span>
              </button>
              
              {/* Mobile Auth Section */}
              {!user && (
                <div className="border-t border-gray-200/20 mt-4 pt-4 px-4 sm:px-6 space-y-3 sm:space-y-4">
                  <Link
                    to="/login"
                    className={`block w-full text-center py-3 sm:py-4 px-4 sm:px-6 rounded-lg border ${isHeroVariant ? 'border-white/30 text-white hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} transition-colors duration-300 text-sm sm:text-base font-medium`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="block w-full text-center py-3 sm:py-4 px-4 sm:px-6 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors duration-300 text-sm sm:text-base font-medium shadow-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
              
              {/* Mobile User Menu */}
              {user && (
                <div className="border-t border-gray-200/20 mt-4 pt-4">
                  <div className="px-4 sm:px-6 py-3 sm:py-4">
                    <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Link
                    to="/list-property"
                    className={`block w-full text-left px-4 sm:px-6 py-3 sm:py-4 ${textColor} ${isHeroVariant ? 'hover:bg-white/10' : 'hover:bg-gray-50'} transition-colors duration-300 text-sm sm:text-base font-medium`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    List Your Property
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className={`block w-full text-left px-4 sm:px-6 py-3 sm:py-4 ${textColor} ${isHeroVariant ? 'hover:bg-white/10' : 'hover:bg-gray-50'} transition-colors duration-300 text-sm sm:text-base font-medium`}
                  >
                    Logout
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;