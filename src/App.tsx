import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OTPPage from './pages/OTPPage';
import AuthCallback from './pages/AuthCallback';
import SearchResults from './pages/SearchResults';
import BookingFlow from './pages/BookingFlow';
import PropertyListingFlow from './pages/PropertyListingFlow';
import AdminDashboard from './pages/AdminDashboard';
import ToursPage from './pages/ToursPage';
import SearchTours from './pages/SearchTours';
import TourBookingFlow from './pages/TourBookingFlow';
import HotelSearchResults from './pages/HotelSearchResults';
import HotelDetailsPage from './pages/HotelDetailsPage';
import AdminTourManagement from './pages/AdminTourManagement';
import Footer from './components/Footer';
import AdminPopularDestinationManagement from './pages/AdminPopularDestinationManagement';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import TourDetailsPage from './pages/TourDetailsPage';

function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Main Pages */}
              <Route path="/" element={<HomePage />} />
              <Route path="/hotels" element={<HotelSearchResults />} />
              <Route path="/tours" element={<ToursPage />} />
              
              {/* Authentication */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/otp-verification" element={<OTPPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
             <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              
              {/* Search & Booking */}
              <Route path="/hotel-search" element={<HotelSearchResults />} />
              <Route path="/search-tours" element={<SearchTours />} />
              <Route path="/booking/:propertyId" element={<BookingFlow />} />
              <Route path="/hotel-booking/:hotelId" element={<BookingFlow />} />
              <Route path="/tour-booking/:tourId" element={<TourBookingFlow />} />
              
              {/* Legacy search route redirect */}
              <Route path="/search" element={<HotelSearchResults />} />
              
              {/* Hotel Details */}
              <Route path="/hotel-details/:hotelId" element={<HotelDetailsPage />} />
              
              {/* Property Management */}
              <Route path="/list-property" element={<PropertyListingFlow />} />

              {/* Booking flow  */}
              <Route path="/hotel-booking/:propertyId" element={<BookingFlow />} />

              {/* Tour Page */}
              <Route path="/tour-details/:tourId" element={<TourDetailsPage />} />
              
              {/* Admin */}
              <Route path="/admin/*" element={<AdminDashboard />} />
              <Route path="/admin/tours" element={<AdminTourManagement />} />
              <Route path="/admin/popular-destinations" element={<AdminPopularDestinationManagement />} />
            </Routes>
            <Footer />
          </div>
        </Router>
      </BookingProvider>
    </AuthProvider>
  );
}

export default App;