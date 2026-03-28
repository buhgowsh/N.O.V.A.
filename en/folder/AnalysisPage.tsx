import { useEffect, useState } from "react";
import Navbar from "@/components/ui/Navbar";
import ParticleComponent from "@/components/ui/Particles";

export default function AnalysisPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  
  // OpenAI chat state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [initialPromptSent, setInitialPromptSent] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    fetchAnalysisData();
  }, []);

  // Send initial prompt to OpenAI when analysis data is loaded
  useEffect(() => {
    if (analysisData && !initialPromptSent) {
      const initialPrompt = createInitialPrompt(analysisData);
      handleSendAiMessage(initialPrompt, true);
      setInitialPromptSent(true);
    }
  }, [analysisData, initialPromptSent]);

  const fetchAnalysisData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Before API");
      const response = await fetch("http://localhost:5000/analyze_latest");
      console.log("After API");
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      setAnalysisData(data);
    } catch (err) {
      console.error("Failed to fetch analysis data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createInitialPrompt = (data) => {
    return `I've just completed an eye-tracking attention session with the following metrics:
    - Focus slope: ${data.stats.slope.toFixed(4)} (${data.stats.slope > 0 ? "improving" : "decreasing"} focus)
    - Average detection score: ${data.stats.average_y.toFixed(4)}
    - Session duration: ${(data.stats.x_range[1] - data.stats.x_range[0]).toFixed(1)} seconds
    
    Based on this data, can you provide me with:
    1. An analysis of my focus patterns
    2. Practical recommendations to improve my attention span
    3. Exercises I can do to enhance my focus`;
  };

  const handleSendAiMessage = async (messageContent, isSystem = false) => {
    if (!messageContent.trim()) return;
    
    if (!isSystem) {
      setMessages(prev => [...prev, { role: "user", content: messageContent }]);
    }
    
    setAiLoading(true);
    
    try {
      const response = await fetch("http://localhost:5000/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: isSystem 
            ? [{ role: "user", content: messageContent }] 
            : [...messages, { role: "user", content: messageContent }]
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }
      
      const data = await response.json();
      setMessages(prev => [...prev, 
        ...(isSystem ? [{ role: "user", content: messageContent }] : []),
        { role: "assistant", content: data.response }
      ]);
    } catch (err) {
      console.error("OpenAI API error:", err);
      setMessages(prev => [...prev, 
        ...(isSystem ? [{ role: "user", content: messageContent }] : []),
        { role: "assistant", content: "Sorry, I encountered an error processing your request." }
      ]);
    } finally {
      setAiLoading(false);
      setNewMessage("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendAiMessage(newMessage);
  };

  return (
    <div className="flex flex-col bg-white text-blue-900 min-h-screen w-full pt-16 overflow-y-auto">
      <Navbar />
      <div className="absolute inset-0 z-0 blur-xs">
        <ParticleComponent />
      </div>
      
      <main className="flex-grow flex flex-col justify-center items-center px-4 md:px-8 py-12 z-20">
        {/* Centered analytics box */}
        <div className="w-full max-w-4xl flex flex-col gap-8">
          {loading && (
            <div className="text-4xl font-extrabold text-center text-blue-800 font-theme text-shadow-md">
              Loading results...
            </div>
          )}
          
          {error && (
              <button 
                onClick={fetchAnalysisData}
                className="mt-4 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
          )}
          
          {analysisData && !loading && !error && (
            <>
              <div className="border border-blue-700 rounded-3xl shadow-2xl z-50 bg-white/90 backdrop-blur-sm rounded-xl p-6">
                <h2 className="text-2xl font-semibold mb-4 font-theme">Focus Analysis</h2>
                
                <div className="my-6 flex justify-center">
                  <img 
                    src={`http://localhost:5000${analysisData.plot_url}`}
                    alt="Eye Tracking Analysis"
                    className="max-w-full h-auto rounded-lg shadow-md"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">Trend Analysis</h3>
                    <p className="text-gray-700">
                      Slope: <span className="font-mono">{analysisData.stats.slope.toFixed(4)}</span>
                      {analysisData.stats.slope > 0 ? (
                        <span className="text-green-600"> (Improving focus)</span>
                      ) : (
                        <span className="text-red-600"> (Decreasing focus)</span>
                      )}
                    </p>
                    <p className="text-gray-700">
                      Average detection score: <span className="font-mono">{analysisData.stats.average_y.toFixed(4)}</span>
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">Data Points</h3>
                    <p className="text-gray-700">
                      Total data points: <span className="font-mono">{analysisData.stats.data_count}</span>
                    </p>
                    <p className="text-gray-700">
                      Time range: <span className="font-mono">
                        {analysisData.stats.x_range[0].toFixed(1)} - {analysisData.stats.x_range[1].toFixed(1)} seconds
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg text-blue-800 transition-opacity duration-1000 ease-in-out opacity-100">
                  <h3 className="font-semibold text-lg mb-2">Insightful Summary</h3>
                  <p>
                    {analysisData.stats.average_y > 0.7 ? (
                      "Fantastic job! Your attention levels were consistently high, showing strong engagement throughout the session."
                    ) : analysisData.stats.average_y > 0.5 ? (
                      "You maintained a fairly good level of focus, though there's room to enhance sustained attention over time."
                    ) : (
                      "It looks like your focus wavered a bit during the session. That’s okay! There are simple habits you can build to improve it."
                    )}
                  </p>
                  {analysisData.stats.slope > 0 ? (
                    <p className="mt-2">Positive trend: your focus sharpened as the session progressed — keep that momentum going!</p>
                  ) : (
                    <p className="mt-2">Your focus gradually declined. Try shorter sessions or take breaks to maintain sharpness.</p>
                  )}
              </div>
            </div>
            
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => window.location.href = "/record"}
                  className="py-3 px-6 bg-blue-600 text-white text-lg font-semibold rounded-xl shadow-md hover:bg-blue-700"
                >
                  Record New Session
                </button>
                <button 
                  onClick={() => setChatOpen(true)}
                  className="py-3 px-6 bg-blue-600 text-white text-lg font-semibold rounded-xl shadow-md hover:bg-blue-700"
                >
                  Get Advice
                </button>
              </div>
            </>
          )}
        </div>

        {/* AI Chat Popout */}
        {chatOpen && (
          <div className="fixed bottom-8 right-8 w-full max-w-md h-[500px] bg-white border border-gray-300 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold"> AI Assistant</h2>
                <p className="text-sm opacity-80">Based on your session data</p>
              </div>
              <button 
                onClick={() => setChatOpen(false)}
                className="p-1 rounded-full hover:bg-blue-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
              {messages.length === 0 && !aiLoading ? (
                <div className="flex items-center justify-center h-full text-gray-500 shadw">
                  {analysisData ? 
                    "Processing your focus data..." : 
                    "Load your analysis data to start a conversation"}
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-white border border-gray-300 rounded-bl-none'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] p-3 rounded-lg bg-white border border-gray-300 rounded-bl-none">
                        <div className="flex space-x-2">
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-300">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ask about your focus..."
                  className="flex-grow p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={aiLoading || !analysisData}
                />
                <button
                  type="submit"
                  disabled={aiLoading || !newMessage.trim() || !analysisData}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Floating AI Chat Button (when chat is closed) */}
        {!chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 z-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
        )}
      </main>
    </div>
  );
}