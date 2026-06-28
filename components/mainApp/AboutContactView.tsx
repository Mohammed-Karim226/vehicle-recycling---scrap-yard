"use client";

import { motion } from "motion/react";
import { MapPin, Phone, Mail, CheckCircle2, ShieldAlert } from "lucide-react";

export default function AboutContactView() {
  const coreValues = [
    {
      title: "Authorized Treatment Facility (ATF)",
      description:
        "We work directly alongside the UK Environment Agency to safely extract hazardous fluids, batteries, and engines, preserving Peterborough's water table and local soil structure.",
    },
    {
      title: "Fair Pricing Guarantee",
      description:
        "Every scrap valuation is linked directly to London Metal Exchange daily market trackers. No dynamic hidden fees, no last-minute scale alterations. You get what our calculator states.",
    },
    {
      title: "Professional On-Site Removal",
      description:
        "Our fleet consists of modern specialized recovery hydraulic tow trucks designed to safely extract vehicles on-road or deep within standard housing compounds safely.",
    },
  ];

  const openingHours = [
    { label: "Monday - Friday", hours: "8:00 AM - 5:30 PM" },
    { label: "Saturday", hours: "8:00 AM - 4:00 PM" },
    { label: "Sunday", hours: "Closed", isClosed: true },
  ];

  const contactPhone = "07557402755";
  const contactPhoneHref = "tel:+447557402755";
  const contactEmail = "quotes@rrsautospeterborough.co.uk";

  // Modern spring stagger setup
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 260, damping: 24 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-12"
      id="about-contact-tab-view"
    >
      <motion.div
        variants={{ itemVariants }}
        className="relative p-[1px] bg-gradient-to-r from-red-500/20 via-pink-500/20 to-amber-500/20 rounded-2xl overflow-hidden shadow-[0_15px_30px_rgba(0,0,0,0.3)]"
      >
        <div className="bg-slate-950/70 backdrop-blur-3xl p-6 sm:p-8 rounded-[15px] relative z-10 space-y-4">
          <span className="text-red-500 font-mono text-[9px] uppercase font-bold tracking-widest block">
            About RRS Autos Peterborough
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            TRUSTED CAR BREAKER & RECYCLING SPECIALISTS
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-sans max-w-4xl">
            RRS Autos is an established, independent, family-run vehicle
            recycler operating in Thorney, Peterborough. Over the last 15
            years, we have built a proud reputation of honest service, direct
            payouts, and professional vehicle extractions across Cambridgeshire.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono border-l-2 border-red-500 pl-3">
            Why Choose RRS Autos?
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {coreValues.map((val, idx) => (
              <motion.div
                key={idx}
                variants={{ itemVariants }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="bg-slate-950/45 border border-white/5 p-5 rounded-xl space-y-2.5 backdrop-blur-md transition-shadow hover:shadow-[0_10px_20px_-10px_rgba(239,68,68,0.25)]"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="h-7 w-7 bg-red-950/50 border border-red-900/40 rounded-lg flex items-center justify-center text-red-400 shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                    {val.title}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans pl-9">
                  {val.description}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            variants={{ itemVariants }}
            className="p-5 bg-red-950/15 border border-red-900/30 rounded-xl flex items-start space-x-3.5 text-[11px] leading-relaxed text-red-400 font-mono"
          >
            <ShieldAlert className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
            <span>
              <strong>Regulatory Notice:</strong> Scrap Metal Dealers Act 2013
              strictly enforces that cash payments cannot be offered for scrap
              vehicles. All payments are securely and immediately made via bank
              transfer or prepaid card systems directly upon scale weigh-in or
              on-site driveway pickup.
            </span>
          </motion.div>
        </div>

        <motion.div
          variants={{ itemVariants }}
          className="bg-slate-950/45 backdrop-blur-md border border-white/5 rounded-2xl p-6 space-y-6 shadow-xl"
        >
          <h3 className="text-white font-bold font-mono tracking-widest uppercase text-xs border-l-2 border-red-500 pl-3">
            Thorney Yard Details
          </h3>

          <div className="space-y-3.5">
            <h4 className="text-[10px] font-mono uppercase text-slate-400 font-black tracking-widest">
              Opening Hours
            </h4>
            <div className="space-y-2 text-xs font-mono text-slate-300">
              {openingHours.map((day) => (
                <div
                  key={day.label}
                  className="flex justify-between border-b border-white/5 pb-2 last:border-b-0 last:pb-0"
                >
                  <span className={day.isClosed ? "text-slate-500" : undefined}>
                    {day.label}
                  </span>
                  {day.isClosed ? (
                    <span className="text-slate-600 bg-slate-900/50 px-2.5 py-0.5 rounded-full border border-white/5 text-[9px] font-bold">
                      {day.hours}
                    </span>
                  ) : (
                    <span className="text-white font-semibold">
                      {day.hours}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <hr className="border-white/5" />

          <div className="space-y-4">
            <h4 className="text-[10px] font-mono uppercase text-slate-400 font-black tracking-widest">
              Primary Contacts
            </h4>
            <address className="not-italic">
              <ul className="space-y-3.5 text-xs text-slate-300 font-mono">
                <li className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <span>
                    Peacock House, Station Rd,
                    <br />
                    Thorney, PE6 0QE
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-red-400 shrink-0" />
                  <a
                    href={contactPhoneHref}
                    className="hover:text-red-300 transition-colors"
                  >
                    {contactPhone}
                  </a>
                </li>
                <li className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-red-400 shrink-0" />
                  <a
                    href={`mailto:${contactEmail}`}
                    className="hover:text-red-300 transition-colors text-[11px] truncate"
                  >
                    {contactEmail}
                  </a>
                </li>
              </ul>
            </address>
          </div>
        </motion.div>
      </div>

      <motion.div
        variants={{ itemVariants }}
        className="relative group p-[1px] bg-gradient-to-r from-red-500/10 via-pink-500/10 to-amber-500/10 rounded-2xl overflow-hidden"
      >
        <div className="bg-slate-950/50 backdrop-blur-xl border border-white/5 p-6 text-center space-y-4 relative overflow-hidden rounded-[15px]">
          <div className="absolute inset-x-0 bottom-0 h-24 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-md mx-auto relative z-10 space-y-3">
            <div className="h-14 w-14 bg-red-950/30 border border-red-900/55 rounded-full flex items-center justify-center mx-auto text-red-500 shadow-xl shadow-red-500/15">
              <MapPin className="h-6 w-6 animate-bounce motion-reduce:animate-none" />
            </div>
            <h3 className="text-white font-mono uppercase font-black text-md">
              Located in Thorney, Peterborough
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Visit us at Peacock House on Station Road in Thorney, or call us for a crane recovery pickup today.
            </p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=52.6191,-0.1066"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block p-2.5 bg-slate-900/60 hover:bg-slate-800/60 rounded-xl border border-white/5 text-[10px] text-slate-400 hover:text-red-300 tracking-wider font-mono transition-colors"
            >
              📍 Get Directions — 52°37&apos;08.8&quot;N 0°06&apos;23.8&quot;W
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
