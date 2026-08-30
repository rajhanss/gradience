import { useState, useRef, useEffect } from 'react';
import { Send, Loader } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatBotProps {
  workflowId: string;
  city: string;
}

const getApiBase = () => {
  const metaEnv = (import.meta as any).env;
  if (metaEnv && metaEnv.VITE_API_BASE) {
    return metaEnv.VITE_API_BASE;
  }
  const gProcess = (globalThis as any).process;
  if (gProcess && gProcess.env && gProcess.env.REACT_APP_API_BASE) {
    return gProcess.env.REACT_APP_API_BASE;
  }
  return 'https://gradience-api-production.up.railway.app';
};

const API_BASE = getApiBase();

export default function ChatBot({ workflowId, city }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hi! I'm analyzing thermal data for ${city}. Ask me about heat patterns, mitigation strategies, or climate decisions.` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      console.log(`[Chat] Sending to ${API_BASE}/v1/chatbot/respond`);
      
      const response = await fetch(`${API_BASE}/v1/chatbot/respond`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow: workflowId,
          message: input,
          history: messages.slice(-4) // Last 4 messages for context
        })
      });

      console.log(`[Chat] Response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = { 
          role: 'assistant', 
          content: data.response || 'No response generated'
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Connection error';
      console.error('[Chat] Error:', errorMsg);
      setError(errorMsg);
      
      // Fallback response
      const fallbackMessage: Message = {
        role: 'assistant',
        content: `I encountered an issue connecting to live API (${errorMsg}). For ${city}, thermal data shows elevated temperatures in urban core zones. Ask about localized cooling strategies or tree canopy density.`
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4">
        <h3 className="font-semibold text-lg">Thermal Assistant</h3>
        <p className="text-sm opacity-90">{city} • {workflowId.charAt(0).toUpperCase() + workflowId.slice(1)}</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-orange-600 text-white rounded-br-none'
                  : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none shadow-sm'
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-600 p-2">
            <Loader size={16} className="animate-spin text-orange-600" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
            ⚠️ {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
            placeholder="Ask about thermal data..."
            disabled={isLoading}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 text-gray-900"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
export { ChatBot };
