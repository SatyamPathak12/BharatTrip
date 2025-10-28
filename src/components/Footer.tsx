import React from 'react';
import { MapPin, Mail, Phone, Facebook, Twitter, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-bold">
                <span className="text-blue-400">Bharat</span>
                <span className="text-orange-400">Trips</span>
              </span>
            </div>
            <p className="text-gray-300 mb-4">
              Discover incredible destinations across India. Book hotels, resorts, and homestays with confidence.
            </p>
            <div className="flex space-x-4">
              <Facebook className="h-5 w-5 text-gray-400 hover:text-blue-400 cursor-pointer transition-colors" />
              <Twitter className="h-5 w-5 text-gray-400 hover:text-blue-400 cursor-pointer transition-colors" />
              <Instagram className="h-5 w-5 text-gray-400 hover:text-orange-400 cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">List Your Property</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Partner With Us</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Careers</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Customer Service</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Cancellation Policy</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Safety Guidelines</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Report a Problem</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">support@bharattrips.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">+91 1800-123-4567</span>
              </div>
            </div>
            {/* <div className="mt-4">
              <h4 className="font-medium mb-2">Languages</h4>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-700 px-2 py-1 rounded text-xs">English</span>
                <span className="bg-gray-700 px-2 py-1 rounded text-xs">हिंदी</span>
                <span className="bg-gray-700 px-2 py-1 rounded text-xs">தமிழ்</span>
                <span className="bg-gray-700 px-2 py-1 rounded text-xs">বাংলা</span>
              </div>
            </div> */}
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4 md:mb-0">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
              <a href="#" className="hover:text-white transition-colors">Sitemap</a>
            </div>
            <div className="text-sm text-gray-400">
              © 2025 BharatTrips. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;