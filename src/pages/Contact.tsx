import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import MainLayout from "@/components/layout/MainLayout";
import {
  Facebook,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
} from "lucide-react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.email || !formData.subject || !formData.message) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Pass phone number as raw string - no validation needed
      // This ensures phone number format doesn't block submission
      const submissionData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone, // Raw string, unchanged
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        timestamp: new Date().toISOString()
      };

      // In a real implementation, this would send to your backend
      // For now, we'll just simulate successful submission
      console.log("Contact form submission:", submissionData);
      
      toast.success("Message sent successfully! We'll get back to you soon.");
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      });
      
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-iteam-primary mb-6">
            Contact Us
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Have questions or want to get in touch with the I-Team Society?
            We're here to help!
          </p>
        </div>
      </section>

      {/* Contact Info and Form */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold mb-6 text-iteam-primary">
                Get in Touch
              </h2>

              <div className="space-y-6">
                {/* Email */}
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Mail className="h-6 w-6 text-iteam-primary" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-500">
                      contact@iteamsociety.ousl.lk
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Phone className="h-6 w-6 text-iteam-primary" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Phone</p>
                    <p className="text-sm text-gray-500">+94 11 288 1000</p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <MapPin className="h-6 w-6 text-iteam-primary" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Address</p>
                    <p className="text-sm text-gray-500">
                     PO Box 21, The Open University of Sri Lanka, Nawala, Nugegoda.
                    </p>
                  </div>
                </div>

                {/* Social Media */}
                <div className="pt-6">
                  <p className="text-sm font-medium text-gray-900 mb-4">
                    Connect with us
                  </p>
                  <div className="flex space-x-4">
                    <a
                      href="https://facebook.com/iteamsociety"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-iteam-primary hover:text-iteam-primary/80"
                    >
                      <span className="sr-only">Facebook</span>
                      <Facebook className="h-6 w-6" />
                    </a>
                    <a
                      href="https://wa.me/94111234567"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-iteam-primary hover:text-iteam-primary/80"
                    >
                      <span className="sr-only">WhatsApp</span>
                      <MessageCircle className="h-6 w-6" />
                    </a>
                    <a
                      href="https://linkedin.com/company/iteam-society"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-iteam-primary hover:text-iteam-primary/80"
                    >
                      <span className="sr-only">LinkedIn</span>
                      <Linkedin className="h-6 w-6" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="mt-10 h-64 bg-gray-200 rounded-lg"></div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold mb-6 text-iteam-primary">
                Send us a Message
              </h2>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Your Name *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    className="w-full"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className="w-full"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number (optional)"
                    className="w-full"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional - Enter your phone number in any format
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Subject *
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    placeholder="Enter subject"
                    className="w-full"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Message *
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={5}
                    placeholder="Enter your message"
                    className="w-full"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Button
                    type="submit"
                    className="w-full bg-iteam-primary hover:bg-iteam-primary/90 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Contact;
