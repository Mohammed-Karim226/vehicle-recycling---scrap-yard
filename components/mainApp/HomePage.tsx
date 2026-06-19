"use client";
import { useState } from "react";

import Header from "./Header";
import Footer from "./Footer";

const HomePage = () => {
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [requestCount, setRequestCount] = useState(0);

  const handleOpenQuoteModal = () => {
    setQuoteModalOpen(true);
  };

  const handleCloseQuoteModal = () => {
    setQuoteModalOpen(false);
  };

  //   const handleQuoteAdded = () => {
  //     updateRequestCount();
  //   };
  return (
    <section className="flex flex-col justify-center items-center">
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenQuoteModal={handleOpenQuoteModal}
        requestCount={requestCount}
      />

      <Footer setCurrentTab={setCurrentTab} />
    </section>
  );
};

export default HomePage;
