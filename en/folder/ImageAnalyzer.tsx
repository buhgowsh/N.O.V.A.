import React, { useState } from 'react';
import OpenAI from 'openai';

// Define types for our component props and state
interface ImageAnalyzerProps {
  apiKey: string;
}

interface AnalysisResult {
  result: string;
  isLoading: boolean;
  error: string | null;
}

const ImageAnalyzer: React.FC<ImageAnalyzerProps> = ({ apiKey }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [analysis, setAnalysis] = useState<AnalysisResult>({
    result: '',
    isLoading: false,
    error: null
  });

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Note: In production, you should make API calls from a backend
  });

  const analyzeImage = async () => {
    if (!imageUrl.trim()) {
      setAnalysis({
        result: '',
        isLoading: false,
        error: 'Please enter an image URL'
      });
      return;
    }

    try {
      setAnalysis({
        result: '',
        isLoading: true,
        error: null
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "does this graph indicate that the person who provided the data was paying attention?" },
              {
                type: "image_url",
                image_url: { url: imageUrl }
              }
            ]
          }
        ]
      });

      const result = response.choices[0]?.message?.content || 'No response received';
      
      setAnalysis({
        result,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setAnalysis({
        result: '',
        isLoading: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">OpenAI Image Analyzer</h1>
      
      <div className="mb-4">
        <label htmlFor="imageUrl" className="block text-sm font-medium mb-1">
          Image URL
        </label>
        <input
          id="imageUrl"
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Enter image URL"
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      <button
        onClick={analyzeImage}
        disabled={analysis.isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
      >
        {analysis.isLoading ? 'Analyzing...' : 'Analyze Image'}
      </button>

      {imageUrl && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-1">Preview:</p>
          <img 
            src={imageUrl} 
            alt="Preview" 
            className="max-h-64 rounded border border-gray-300" 
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "/api/placeholder/400/300";
            }}
          />
        </div>
      )}

      {analysis.error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {analysis.error}
        </div>
      )}

      {analysis.result && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Analysis Result:</h2>
          <div className="p-3 bg-white border border-gray-300 rounded whitespace-pre-wrap">
            {analysis.result}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageAnalyzer;