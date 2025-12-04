import React, { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Calendar, 
  Clock, 
  Settings, 
  Menu,
  HelpCircle,
  Bell,
  User
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { OnDemandQA } from '@/components/OnDemandQA';
import { MorningBrief } from '@/components/MorningBrief';
import { EveningSummary } from '@/components/EveningSummary';
import { ConfigurationCockpitPage } from '@/components/ui/ConfigurationCockpit';

type ActiveSection = 'qa' | 'morning' | 'summary' | 'config';

const Index = () => {
  const { isInitialized, currentUser } = useApp();
  const [activeSection, setActiveSection] = useState<ActiveSection>('qa');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Initializing Sally</h2>
          <p className="text-slate-400">Setting up your Trial Supply Manager assistant...</p>
        </div>
      </div>
    );
  }

  const navigationItems = [
    {
      id: 'qa' as ActiveSection,
      label: 'On-Demand Q&A',
      icon: MessageSquare,
      description: 'Chat with AI assistant'
    },
    {
      id: 'morning' as ActiveSection,
      label: 'Morning Brief',
      icon: Calendar,
      description: 'Daily priorities & insights'
    },
    {
      id: 'summary' as ActiveSection,
      label: 'End of Day Summary',
      icon: Clock,
      description: 'Progress & tomorrow\'s plan'
    },
    {
      id: 'config' as ActiveSection,
      label: 'Configuration',
      icon: Settings,
      description: 'LLM & database settings'
    }
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'qa':
        return <OnDemandQA />;
      case 'morning':
        return <MorningBrief />;
      case 'summary':
        return <EveningSummary />;
      case 'config':
        return <ConfigurationCockpit />;
      default:
        return <OnDemandQA />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex bg-background">
        {/* ✅ FIX 1: Sidebar with proper icon sizing when collapsed */}
        <div className={`bg-sidebar-background border-r border-sidebar-border transition-all duration-300 flex-shrink-0 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
          <div className="p-4 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-bold text-sm">S</span>
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-sidebar-foreground font-bold text-lg">Sally</h1>
                  <p className="text-sidebar-foreground/70 text-xs">TSM Assistant</p>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="ml-auto text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors flex-shrink-0"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>

            {/* ✅ FIX 2: Navigation with proper icon sizing */}
            <nav className="space-y-2 mb-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 rounded-lg transition-colors text-left ${
                      sidebarCollapsed 
                        ? 'px-2 py-3 justify-center' 
                        : 'px-3 py-3'
                    } ${
                      isActive 
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    {/* ✅ FIX 3: Icon size fixed to h-5 w-5 always */}
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.label}</div>
                        <div className="text-xs opacity-75 truncate">{item.description}</div>
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* User Profile */}
            <div className="mt-auto pt-4 border-t border-sidebar-border">
              <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : 'px-2'}`}>
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                    {currentUser.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="text-sidebar-foreground font-medium text-sm truncate">{currentUser.name}</div>
                    <div className="text-sidebar-foreground/70 text-xs truncate">{currentUser.role}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ✅ FIX 4: Main Content with flex-1 to expand when sidebar collapses */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="bg-card border-b border-border px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="min-w-0 flex-1">
                  <h2 className="text-card-foreground font-semibold truncate">
                    {navigationItems.find(item => item.id === activeSection)?.label}
                  </h2>
                  <p className="text-muted-foreground text-sm truncate">
                    {navigationItems.find(item => item.id === activeSection)?.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 flex-shrink-0">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-card-foreground">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-card-foreground">
                  <HelpCircle className="h-4 w-4" />
                </Button>
                <Badge variant="outline" className="border-primary text-primary">
                  Demo Mode
                </Badge>
              </div>
            </div>
          </header>

          {/* ✅ FIX 5: Content Area expands properly */}
          <main className="flex-1 overflow-hidden">
            {renderActiveSection()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
