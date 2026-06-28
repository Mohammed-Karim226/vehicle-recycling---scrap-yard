"use client";

import { MapPin, Phone, Mail, Clock, ShieldCheck } from "lucide-react";

interface FooterProps {
  setCurrentTab: (tab: string) => void;
}

export default function Footer({ setCurrentTab }: FooterProps) {
  return (
    <footer
      className="bg-slate-950/45 backdrop-blur-3xl text-slate-400 border-t border-white/5 pt-16 pb-8 relative z-20"
      id="footer-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="space-y-4 text-left">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-red-600 to-pink-600 text-white font-mono text-xs font-black px-2.5 py-1 rounded-lg tracking-wider border border-white/10">
              RRS
            </div>
            <span className="text-white text-md font-black tracking-widest uppercase">
              AUTOS
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            Peterborough&apos;s leading vehicle recycling and car salvage yard.
            Family-run for over 15 years in Thorney, delivering honest
            quotes, rapid collections, and high-quality spare auto parts.
          </p>
          <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="uppercase font-semibold tracking-wider">
              Environment Agency Approved ATF
            </span>
          </div>
        </div>

        <div className="space-y-4 text-left">
          <h3 className="text-white font-bold tracking-widest uppercase text-xs font-mono border-l-2 border-red-500 pl-3">
            Locations We Serve
          </h3>
          <ul className="space-y-2 text-xs font-mono text-slate-400">
            <li className="flex items-center space-x-2">
              <span className="h-1.5 w-1.5 bg-red-500 rounded-full"></span>
              <span>Peterborough (Breakers & Office)</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="h-1.5 w-1.5 bg-slate-750 rounded-full"></span>
              <span>Stamford & Deepings</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="h-1.5 w-1.5 bg-slate-750 rounded-full"></span>
              <span>Wisbech & March</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="h-1.5 w-1.5 bg-slate-750 rounded-full"></span>
              <span>Spalding & Crowland</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="h-1.5 w-1.5 bg-slate-750 rounded-full"></span>
              <span>Huntingdon & St Ives</span>
            </li>
          </ul>
        </div>

        <div className="space-y-4 text-left">
          <h3 className="text-white font-bold tracking-widest uppercase text-xs font-mono border-l-2 border-red-500 pl-3">
            Quick Services
          </h3>
          <ul className="space-y-2 text-xs font-mono">
            <li>
              <button
                onClick={() => setCurrentTab("parts")}
                className="hover:text-white hover:underline transition-colors text-left cursor-pointer"
              >
                Search In-Yard Vehicles
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentTab("prices")}
                className="hover:text-white hover:underline transition-colors text-left cursor-pointer"
              >
                Real-Time Scrap Rates
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentTab("about")}
                className="hover:text-white hover:underline transition-colors text-left cursor-pointer"
              >
                How It Works & Salvage Yard
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentTab("requests")}
                className="hover:text-white hover:underline transition-colors text-left cursor-pointer font-bold text-red-400"
              >
                Track My Requests Live
              </button>
            </li>
          </ul>
        </div>

        <div className="space-y-4 text-left">
          <h3 className="text-white font-bold tracking-widest uppercase text-xs font-mono border-l-2 border-red-500 pl-3">
            Contact Yards
          </h3>
          <ul className="space-y-3 text-xs font-mono">
            <li className="flex items-start space-x-2.5">
              <MapPin className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
              <span>
                Peacock House, Station Rd,
                <br />
                Thorney, PE6 0QE
              </span>
            </li>
            <li className="flex items-center space-x-2.5">
              <Phone className="h-4 w-4 text-red-500" />
              <span>07557402755</span>
            </li>
            <li className="flex items-center space-x-2.5">
              <Mail className="h-4 w-4 text-red-500" />
              <span className="truncate max-w-full inline-block">
                testquotes@rrsautospeterborough.co.uk
              </span>
            </li>
            <li className="flex items-center space-x-2.5">
              <Clock className="h-4 w-4 text-slate-650" />
              <span className="text-[10px] text-slate-550 lowercase tracking-wider">
                testMon - Sat: 8am - 5:30pm
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 font-mono gap-4 text-center sm:text-left">
        <div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} RRS Autos Peterborough. Reg Company No.
            04829381. All Rights Reserved.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {/* <a href="#" className="hover:text-slate-400">Permit EPR/KB2849</a>
          <a href="#" className="hover:text-slate-400">Privacy Policy</a>
          <a href="#" className="hover:text-slate-400">Scrap License: PE-283</a> */}
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} • Crafted with ❤️ by Eng. Mohammed
            Karim
          </p>
        </div>
      </div>
    </footer>
  );
}
