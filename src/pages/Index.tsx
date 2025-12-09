"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sun, Moon, Calendar, Clock, MessageSquare, FileText, Settings, ChevronRight } from "lucide-react";
import MorningBriefPage from "./morning-brief-page";
import { EveningSummary } from "@/components/EveningSummary";
import OnDemandQAPage from "./qa-assistant-page";
import { ConfigurationCockpit } from "@/components/ui/ConfigurationCockpit";
import { useGlobalTheme } from "@/hooks/useGlobalTheme";

type ViewType = "landing" | "morning" | "evening" | "qa" | "reports" | "configuration";

const LandingPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>("landing");
  const [currentTime, setCurrentTime] = useState<string>("");
  const { themeColors } = useGlobalTheme();

  // Time update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = useCallback((view: ViewType) => {
    setCurrentView(view);
  }, []);

  const handleBackToLanding = useCallback(() => {
    setCurrentView("landing");
  }, []);

  // Render different views based on currentView
  if (currentView === "morning") {
    return <MorningBriefPage onBack={handleBackToLanding} />;
  }
  
  if (currentView === "evening") {
    return <EveningSummary onBack={handleBackToLanding} />;
  }
  
  if (currentView === "qa") {
    return <OnDemandQAPage onBack={handleBackToLanding} />;
  }
  
  if (currentView === "configuration") {
    return <ConfigurationCockpit onBack={handleBackToLanding} />;
  }
  
  if (currentView === "reports") {
    return (
      <div
        style={{
          backgroundColor: themeColors.background,
          color: themeColors.foreground,
          minHeight: "100vh"
        }}
        className="flex items-center justify-center"
      >
        <div className="text-center">
          <FileText className="h-16 w-16 mx-auto mb-4" style={{ color: themeColors.primary }} />
          <h2 className="text-2xl font-bold mb-2">Reports</h2>
          <p style={{ color: themeColors.accent }} className="mb-4">
            Reports feature coming soon
          </p>
          <button
            onClick={handleBackToLanding}
            style={{
              backgroundColor: themeColors.primary,
              color: themeColors.background
            }}
            className="px-6 py-2 rounded-lg hover:opacity-90"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Landing Page View
  return (
    <div
      style={{
        backgroundColor: themeColors.background,
        color: themeColors.foreground,
        minHeight: "100vh"
      }}
      className="flex flex-col"
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: themeColors.muted,
          borderColor: themeColors.border
        }}
        className="border-b px-6 py-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div
              style={{
                backgroundColor: themeColors.primary,
                color: themeColors.background
              }}
              className="rounded-lg p-2"
            >
              <Sun className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Sally TSM</h1>
              <p style={{ color: themeColors.accent }} className="text-sm">
                Your Intelligent Business Assistant
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div
              style={{
                backgroundColor: themeColors.muted,
                color: themeColors.foreground
              }}
              className="rounded-lg px-4 py-2"
            >
              <Clock className="mr-2 inline h-4 w-4" />
              {currentTime}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Welcome Section */}
          <section className="text-center">
            <h2 className="mb-4 text-4xl font-bold">Welcome Back!</h2>
            <p style={{ color: themeColors.accent }} className="text-lg">
              Choose a service to get started
            </p>
          </section>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Morning Brief Card */}
            <ServiceCard
              icon={<Sun className="h-8 w-8" />}
              title="Morning Brief"
              description="Start your day with key insights and updates"
              themeColors={themeColors}
              onClick={() => handleNavigate("morning")}
            />

            {/* Evening Summary Card */}
            <ServiceCard
              icon={<Moon className="h-8 w-8" />}
              title="Evening Summary"
              description="Review your day's performance and metrics"
              themeColors={themeColors}
              onClick={() => handleNavigate("evening")}
            />

            {/* On-Demand Q&A Card */}
            <ServiceCard
              icon={<MessageSquare className="h-8 w-8" />}
              title="On-Demand Q&A"
              description="Get instant answers to your business questions"
              themeColors={themeColors}
              onClick={() => handleNavigate("qa")}
            />

            {/* Reports Card */}
            <ServiceCard
              icon={<FileText className="h-8 w-8" />}
              title="Reports"
              description="Access detailed analytics and reports"
              themeColors={themeColors}
              onClick={() => handleNavigate("reports")}
            />

            {/* Configuration Card */}
            <ServiceCard
              icon={<Settings className="h-8 w-8" />}
              title="Configuration"
              description="Manage your preferences and settings"
              themeColors={themeColors}
              onClick={() => handleNavigate("configuration")}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

// Service Card Component
interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  themeColors: any;
  onClick: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ icon, title, description, themeColors, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: themeColors.muted,
        borderColor: themeColors.border,
        color: themeColors.foreground
      }}
      className="group rounded-xl border p-6 text-left transition-all hover:shadow-lg"
    >
      <div className="flex items-start justify-between">
        <div
          style={{
            backgroundColor: themeColors.primary,
            color: themeColors.background
          }}
          className="rounded-lg p-3"
        >
          {icon}
        </div>
        <ChevronRight
          style={{ color: themeColors.accent }}
          className="h-5 w-5 transition-transform group-hover:translate-x-1"
        />
      </div>
      <h3 className="mb-2 mt-4 text-xl font-semibold">{title}</h3>
      <p style={{ color: themeColors.accent }} className="text-sm">
        {description}
      </p>
    </button>
  );
};

export default LandingPage;
