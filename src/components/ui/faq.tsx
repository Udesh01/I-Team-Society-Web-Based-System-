import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
  title?: string;
  className?: string;
}

const FAQ: React.FC<FAQProps> = ({ items, title = "Frequently Asked Questions", className = "" }) => {
  return (
    <div className={className}>
      <h3 className="text-xl font-bold text-center mb-6 text-iteam-primary">
        {title}
      </h3>
      <Accordion type="single" collapsible className="w-full space-y-4">
        {items.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`} className="bg-white p-4 rounded-md shadow-sm border">
            <AccordionTrigger className="font-medium text-iteam-primary text-left">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-gray-600 pt-2">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default FAQ;
