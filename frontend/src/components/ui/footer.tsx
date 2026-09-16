import { Button } from "./button";
import { Input } from "./input";
import { Separator } from "./separator";
import {  Mail, MapPin, Phone , Send } from "lucide-react";

export default function Footer () {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <span className="font-semibold">YOUTH ACT</span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md">
              We invite you to Like & Follow the 
              "Youth Act" page to stay connected as we step forward together for our planet and our future! 
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-background hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Send className="h-5 w-5" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-background hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Phone className="h-5 w-5" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-background hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <MapPin className="h-5 w-5" />
              </a>
              <a 
                href="mailto:alex@example.com"
                className="p-2 rounded-lg bg-background hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/about" className="hover:text-foreground transition-colors">About Us</a></li>
              <li><a href="/projects" className="hover:text-foreground transition-colors">Projects</a></li>
              <li><a href="/Stories" className="hover:text-foreground transition-colors">Stories</a></li>
              <li><a href="/weather" className="hover:text-foreground transition-colors">Weather</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Get in Touch</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start space-x-2">
                <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                <a href="mailto:alex@example.com" className="hover:text-foreground transition-colors">
                  youthact.mm@gmail.com
                </a>
              </li>
              <li className="flex items-start space-x-2">
                <Phone className="h-4 w-4 mt-0.5 shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>San Francisco, CA</span>
              </li>
            </ul>
          </div>
        </div>
        
        <Separator className="my-8" />
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground mb-4 md:mb-0">
            © 2026 Youth Act. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          </div>
        </div>
      </div>
    </footer>
  );
}