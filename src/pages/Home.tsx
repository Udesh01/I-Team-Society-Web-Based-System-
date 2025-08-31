import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";
import { ArrowRight } from "lucide-react";

const Home = () => {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-iteam-primary mb-4">
                Welcome to I-Team Society
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-6">
                Get ready to innovate, connect, and lead!
              </p>
              <p className="text-gray-600 mb-8">
                At the Faculty of Natural Sciences, Department of Computer
                Science, we power up university life with exciting events,
                workshops, and tech-driven adventures. Join us and be part of
                the future!
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Button
                  asChild
                  className="bg-iteam-primary hover:bg-iteam-primary/90 text-white"
                >
                  <Link to="/register">Get Started</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-iteam-primary text-iteam-primary"
                >
                  <Link to="/register">Sign Up Free</Link>
                </Button>
              </div>
            </div>
            <div className="flex justify-center items-center h-full w-full">
              <video
                className="w-full h-full object-cover rounded-[50px] shadow-lg"
                autoPlay
                loop
                muted
                playsInline
              >
              <source src="/rk.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            What We Offer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="h-12 w-12 bg-iteam-primary/10 text-iteam-primary rounded-lg flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Tech Workshops</h3>
              <p className="text-gray-600">
                Enhance your skills with hands-on technical workshops led by
                industry experts and experienced peers.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="h-12 w-12 bg-iteam-primary/10 text-iteam-primary rounded-lg flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Networking Events</h3>
              <p className="text-gray-600">
                Connect with peers, alumni, and industry professionals to build
                lasting relationships and career opportunities.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="h-12 w-12 bg-iteam-primary/10 text-iteam-primary rounded-lg flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Innovation Projects
              </h3>
              <p className="text-gray-600">
                Participate in collaborative projects, hackathons, and
                competitions to apply your skills to real-world challenges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-iteam-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Join I-Team Society?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Become a member today and gain access to exclusive events,
            workshops, networking opportunities, and a community of like-minded
            students and professionals.
          </p>
          <Button
            asChild
            variant="secondary"
            className="bg-white text-iteam-primary hover:bg-gray-200"
          >
            <Link to="/register" className="flex items-center">
              Join Now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Upcoming Events
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Event Card 1 */}
           <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200">
                <img
                  src="/past/web.png"
                  alt="Web Development Workshop"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="text-sm text-gray-500 mb-2">Jun 11, 2025</div>
                <h3 className="text-xl font-semibold mb-2">
                  Web Development Workshop
                </h3>
                <p className="text-gray-600 mb-4">
                  Learn modern web development techniques from industry experts.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="text-iteam-primary border-iteam-primary"
                >
                  <Link to="/login">Learn More</Link>
                </Button>
              </div>
            </div>

            {/* Event Card 2 */}
           <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200">
                <img
                  src="/past/carer.png"
                  alt="Career Fair"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="text-sm text-gray-500 mb-2">Aug 5, 2025</div>
                <h3 className="text-xl font-semibold mb-2">Tech Career Fair</h3>
                <p className="text-gray-600 mb-4">
                  Connect with top employers and discover career opportunities
                  in tech.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="text-iteam-primary border-iteam-primary"
                >
                  <Link to="/login">Learn More</Link>
                </Button>
              </div>
            </div>

            {/* Event Card 3 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200">
                <img
                  src="/past/anual.png"
                  alt="Career Fair"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="text-sm text-gray-500 mb-2">Dec 10, 2025</div>
                <h3 className="text-xl font-semibold mb-2">Annual Hackathon</h3>
                <p className="text-gray-600 mb-4">
                  Showcase your skills and creativity in our 24-hour coding
                  challenge.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="text-iteam-primary border-iteam-primary"
                >
                  <Link to="/login">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="text-center mt-10">
            <Button asChild variant="link" className="text-iteam-primary">
              <Link to="/login" className="flex items-center">
                View All Events <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Home;
