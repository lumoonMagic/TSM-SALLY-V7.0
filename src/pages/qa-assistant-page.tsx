"use client";

import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';
import { useGlobalTheme } from '@/hooks/useGlobalTheme';

interface OnDemandQAPageProps {
  onBack?: () => void;
}

const OnDemandQAPage: React.FC<OnDemandQAPageProps> = ({ onBack }) => {
  const { themeColors } = useGlobalTheme();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    
    // Simulate assistant response
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'This is a demo response. Connect to your backend API for real Q&A functionality.'
        }
      ]);
    }, 1000);

    setQuestion('');
  };

  return (
    <div
      style={{
        backgroundColor: themeColors.background,
        color: themeColors.foreground,
        minHeight: '100vh'
      }}
      className="flex flex-col"
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: themeColors.muted,
          borderColor: themeColors.border
        }}
        className="border-b px-6 py-4"
      >
        <div className="flex items-center space-x-4">
          {onBack && (
            <button
              onClick={onBack}
              style={{
                backgroundColor: themeColors.background,
                color: themeColors.foreground
              }}
              className="rounded-lg p-2 transition-colors hover:opacity-80"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div
            style={{
              backgroundColor: themeColors.primary,
              color: themeColors.background
            }}
            className="rounded-lg p-2"
          >
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">On-Demand Q&A</h1>
            <p style={{ color: themeColors.accent }} className="text-sm">
              Get instant answers to your business questions
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare
                style={{ color: themeColors.accent }}
                className="mx-auto h-16 w-16 mb-4"
              />
              <h2 className="text-xl font-semibold mb-2">Start a Conversation</h2>
              <p style={{ color: themeColors.accent }}>
                Ask me anything about your business data and operations
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  style={{
                    backgroundColor: msg.role === 'user' ? themeColors.primary : themeColors.muted,
                    color: msg.role === 'user' ? themeColors.background : themeColors.foreground
                  }}
                  className="max-w-[80%] rounded-lg p-4"
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Input Area */}
      <div
        style={{
          backgroundColor: themeColors.muted,
          borderColor: themeColors.border
        }}
        className="border-t p-4"
      >
        <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
          <div className="flex space-x-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              style={{
                backgroundColor: themeColors.background,
                borderColor: themeColors.border,
                color: themeColors.foreground
              }}
              className="flex-1 rounded-lg border px-4 py-2 focus:outline-none focus:ring-2"
            />
            <button
              type="submit"
              style={{
                backgroundColor: themeColors.primary,
                color: themeColors.background
              }}
              className="rounded-lg px-6 py-2 transition-colors hover:opacity-90"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnDemandQAPage;
