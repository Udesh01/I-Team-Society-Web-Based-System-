
import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Linkedin, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-iteam-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-4">About I-Team Society</h3>
            <p className="text-sm">
              A vibrant student-led community under the Faculty of Natural Sciences, 
              Department of Computer Science at The Open University of Sri Lanka.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm hover:underline">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm hover:underline">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm hover:underline">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm hover:underline">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-sm hover:underline">
                  Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contact Us</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <Mail size={16} className="mr-2" />
                <span className="text-sm">contact@iteamsociety.ousl.lk</span>
              </div>
              <div className="flex items-center">
                <Phone size={16} className="mr-2" />
                <span className="text-sm">+94 11 288 1000</span>
              </div>
              <div className="flex items-center">
                <MapPin size={16} className="mr-2" />
                <span className="text-sm">
                  PO Box 21, The Open University of Sri Lanka, Nawala, Nugegoda.
                </span>
              </div>
              <div className="flex items-center mt-4 space-x-4">
                <a 
                  href="https://ou.ac.lk/society/iteam/"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-gray-300"
                >
                  <Facebook size={20} />
                </a>
                <a 
                   href="https://ou.ac.lk/society/iteam/"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-gray-300"
                >
                  <Linkedin size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800">
          <p className="text-center text-sm">
            © I-Team Society 21/22 Batch,  {new Date().getFullYear()}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
