import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  const staffMembers = [
    {
      name: "Eng.Ms.C.S. Weliwita",
      position: "President",
      image: "/prasha.jpg",
      description: "Leading the society with innovation and vision",
    },
    {
      name: "Ms.W.C. Uduwela",
      position: "Secretary",
      image: "/UDUWELA.jpg",
      description: "Manages communications, documentation, coordination, and support",
    },
    {
      name: "Dr. A.M.P.B. Abeysinghe",
      position: "Treasurer",
      image: "/Abeysinghe.jpg",
      description: "Overseeing financial operations and budgets",
    },
    {
      name: "Ms. S.N. Dissanayake",
      position: "Vice President",
      image: "/Dissanayake.jpg",
      description: "Supports the President and acts in their absence",
    },
    {
      name: "Ms. Champika Megasooriya",
      position: "Assistant Secretary",
      image: "/Megasooriya.jpg",
      description: "Helps with records and communication",
    },
    
  ];

  const statistics = [
    { label: "Active Students", value: "650+", color: "bg-blue-500" },
    { label: "Faculty Staff", value: "50+", color: "bg-green-500" },
    { label: "Events Completed", value: "20+", color: "bg-purple-500" },
    { label: "Years Active", value: "5+", color: "bg-orange-500" },
  ];

  const eventImages = [
    { title: "Inauguration of the i-Team", image: "/past/Inauguratio.jpg" },
    { title: "Evolution of Ai", image: "/past/AI.jpg" },
    { title: "Introduction to GIS", image: "/past/GIS.jpg" },
    { title: "Cloud Platforms for Innovative Services", image: "/past/cloud.jpg" },
    { title: "Short Film Lecture and Competition", image: "/past/Short.jpg" },
    { title: "Dive Into The IT World", image: "/past/Webinar Series.png" }
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-iteam-primary mb-6">
            About Us
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            The I-Team Society is a vibrant student-led community under the
            Faculty of Natural Sciences, Department of Computer Science at The
            Open University of Sri Lanka.<br /> It connects students through
            university events, tech workshops, and <br /> innovation-driven activities.
          </p>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-iteam-primary mb-6">
                Our Purpose
              </h2>
              <p className="text-gray-600 mb-6">
                The I-Team Society helps students build skills beyond the
                classroom, network with peers and industry experts, and stay
                updated with the latest in technology  shaping a stronger,
                smarter university community.
              </p>
              <p className="text-gray-600">
                We believe in fostering innovation, collaboration, and
                continuous learning through hands-on experiences, mentorship
                programs, and cutting-edge technology initiatives that prepare
                our members for successful careers in the digital age.
              </p>
            </div>
            <div className="flex justify-center" >
              <img
                src="/team.png"
                alt="I-Team Society"
                className="w-64 h-64"
              />
            </div>
            
          </div>
          
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-iteam-primary mb-12">
            Our Impact
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statistics.map((stat, index) => (
              <div key={index} className="text-center">
                <div
                  className={`w-20 h-20 ${stat.color} rounded-full flex items-center justify-center mx-auto mb-4`}
                >
                  <span className="text-2xl font-bold text-white">
                    {stat.value}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-iteam-primary">
                  {stat.label}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Staff Members Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-iteam-primary mb-12">
            Meet Our Team
          </h2>

          {/* President */}
          <div className="text-center mb-16">
            <div className="inline-block rounded-full overflow-hidden h-40 w-40 mb-6 mx-auto">
              <img
                src={staffMembers[0].image}
                alt={staffMembers[0].name}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-2xl font-semibold text-iteam-primary">
              {staffMembers[0].name}
            </h3>
            <p className="text-gray-600 font-medium">
              {staffMembers[0].position}
            </p>
            <p className="mt-2 text-gray-500 max-w-lg mx-auto">
              {staffMembers[0].description}
            </p>
          </div>

          {/* Other Staff Members */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {staffMembers.slice(1).map((member, index) => (
              <Card key={index} className="text-center p-6">
                <CardContent className="pt-6">
                  <div className="inline-block rounded-full overflow-hidden h-32 w-32 mb-4 mx-auto">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-iteam-primary mb-2">
                    {member.name}
                  </h3>
                  <p className="text-gray-600 font-medium mb-3">
                    {member.position}
                  </p>
                  <p className="text-sm text-gray-600">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Events Gallery Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-iteam-primary mb-12">
            Our Journey Began Here !!!
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventImages.map((event, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="h-48 bg-gray-200">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-iteam-primary">
                    {event.title}
                  </h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default About;
