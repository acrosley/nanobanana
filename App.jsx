import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Settings, Sparkles, DollarSign, Save, Trash2, Image, Wand2, RotateCcw, Download, Copy, ChevronDown, ChevronUp, X, Plus, FileImage, Layers, Zap, Clock, BookMarked, Sun, Moon } from 'lucide-react';

// Pricing constants based on Gemini 3 Pro Image API
const PRICING = {
  inputTokens: {
    standard: 2.00 / 1_000_000,  // $2 per 1M tokens
    longContext: 4.00 / 1_000_000  // $4 per 1M tokens (>200k context)
  },
  outputTokens: {
    standard: 12.00 / 1_000_000,  // $12 per 1M tokens
    longContext: 18.00 / 1_000_000  // $18 per 1M tokens
  },
  imageOutput: {
    '1k': { tokens: 1290, price: 0.039 },
    '2k': { tokens: 1120, price: 0.134 },
    '4k': { tokens: 2000, price: 0.24 }
  },
  imageInput: {
    low: 280,
    medium: 560,
    high: 1120
  }
};

const RESOLUTIONS = [
  { id: '1k', label: '1024×1024', desc: 'Standard' },
  { id: '2k', label: '2048×2048', desc: 'High Definition' },
  { id: '4k', label: '4096×4096', desc: 'Ultra HD' }
];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1', desc: 'Square' },
  { id: '16:9', label: '16:9', desc: 'Landscape' },
  { id: '9:16', label: '9:16', desc: 'Portrait' },
  { id: '4:3', label: '4:3', desc: 'Classic' },
  { id: '3:2', label: '3:2', desc: 'Photo' }
];

const THINKING_LEVELS = [
  { id: 'off', label: 'Off', desc: 'Fast responses' },
  { id: 'low', label: 'Low', desc: 'Quick reasoning' },
  { id: 'medium', label: 'Medium', desc: 'Balanced' },
  { id: 'high', label: 'High', desc: 'Deep reasoning' }
];

const MEDIA_RESOLUTIONS = [
  { id: 'low', label: 'Low', tokens: 280, desc: 'Fast processing' },
  { id: 'medium', label: 'Medium', tokens: 560, desc: 'Balanced' },
  { id: 'high', label: 'High', tokens: 1120, desc: 'Best quality' }
];

// Sample saved prompts
const DEFAULT_PROMPTS = [
  { id: 1, name: 'Product Photography', prompt: 'Professional product photography of a modern minimalist watch on a marble surface with soft studio lighting and subtle shadows', tags: ['product', 'commercial'] },
  { id: 2, name: 'Fantasy Landscape', prompt: 'Ethereal fantasy landscape with floating islands, bioluminescent forests, and twin moons in a starlit sky', tags: ['fantasy', 'landscape'] },
  { id: 3, name: 'Portrait Style', prompt: 'Cinematic portrait with dramatic Rembrandt lighting, shallow depth of field, and rich warm tones', tags: ['portrait', 'cinematic'] }
];

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [referenceImages, setReferenceImages] = useState([]);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [showSavedPrompts, setShowSavedPrompts] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState(() => {
    const stored = localStorage.getItem('gemini-saved-prompts');
    return stored ? JSON.parse(stored) : DEFAULT_PROMPTS;
  });
  const [promptName, setPromptName] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini-api-key') || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    resolution: '2k',
    aspectRatio: '1:1',
    thinkingLevel: 'medium',
    mediaResolution: 'high',
    numberOfImages: 1,
    seed: '',
    guidanceScale: 7.5,
    steps: 50
  });

  const fileInputRef = useRef(null);

  // Save prompts to localStorage
  useEffect(() => {
    localStorage.setItem('gemini-saved-prompts', JSON.stringify(savedPrompts));
  }, [savedPrompts]);

  // Save API key
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('gemini-api-key', apiKey);
    }
  }, [apiKey]);

  // Calculate cost estimation
  const calculateCost = useCallback(() => {
    const promptTokens = Math.ceil(prompt.length / 4);
    const negPromptTokens = Math.ceil(negativePrompt.length / 4);
    const refImageTokens = referenceImages.length * PRICING.imageInput[settings.mediaResolution];
    
    const totalInputTokens = promptTokens + negPromptTokens + refImageTokens;
    const isLongContext = totalInputTokens > 200000;
    
    const inputCost = totalInputTokens * (isLongContext ? PRICING.inputTokens.longContext : PRICING.inputTokens.standard);
    const outputCost = PRICING.imageOutput[settings.resolution].price * settings.numberOfImages;
    
    return {
      inputTokens: totalInputTokens,
      outputTokens: PRICING.imageOutput[settings.resolution].tokens * settings.numberOfImages,
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      isLongContext
    };
  }, [prompt, negativePrompt, referenceImages, settings]);

  const costEstimate = calculateCost();

  // Handle file upload
  const handleFileUpload = useCallback((e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setReferenceImages(prev => [...prev, {
          id: Date.now() + Math.random(),
          name: file.name,
          data: e.target.result,
          type: file.type,
          influence: 0.5,
          mode: 'style' // style, content, or composition
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }, []);

  // Remove reference image
  const removeReference = useCallback((id) => {
    setReferenceImages(prev => prev.filter(img => img.id !== id));
  }, []);

  // Update reference image settings
  const updateReference = useCallback((id, updates) => {
    setReferenceImages(prev => prev.map(img => 
      img.id === id ? { ...img, ...updates } : img
    ));
  }, []);

  // Save current prompt
  const savePrompt = useCallback(() => {
    if (!prompt.trim()) return;
    const newPrompt = {
      id: Date.now(),
      name: promptName || `Prompt ${savedPrompts.length + 1}`,
      prompt: prompt,
      negativePrompt: negativePrompt,
      settings: { ...settings },
      tags: [],
      createdAt: new Date().toISOString()
    };
    setSavedPrompts(prev => [...prev, newPrompt]);
    setPromptName('');
  }, [prompt, negativePrompt, settings, promptName, savedPrompts]);

  // Load saved prompt
  const loadPrompt = useCallback((savedPrompt) => {
    setPrompt(savedPrompt.prompt);
    if (savedPrompt.negativePrompt) setNegativePrompt(savedPrompt.negativePrompt);
    if (savedPrompt.settings) setSettings(prev => ({ ...prev, ...savedPrompt.settings }));
    setShowSavedPrompts(false);
  }, []);

  // Delete saved prompt
  const deletePrompt = useCallback((id) => {
    setSavedPrompts(prev => prev.filter(p => p.id !== id));
  }, []);

  const [error, setError] = useState('');

  // Generate images using Gemini API
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    if (!apiKey) {
      setError('Please set your Gemini API key first');
      setShowApiKeyInput(true);
      return;
    }
    
    setIsGenerating(true);
    setError('');
    
    try {
      // Build the full prompt with negative prompt if provided
      let fullPrompt = prompt;
      if (negativePrompt.trim()) {
        fullPrompt += `\n\nAvoid: ${negativePrompt}`;
      }

      // Add aspect ratio instruction
      const aspectInstructions = {
        '1:1': 'Create a square image.',
        '16:9': 'Create a wide landscape image with 16:9 aspect ratio.',
        '9:16': 'Create a tall portrait image with 9:16 aspect ratio.',
        '4:3': 'Create an image with 4:3 aspect ratio.',
        '3:2': 'Create an image with 3:2 aspect ratio.'
      };
      fullPrompt = `${aspectInstructions[settings.aspectRatio]} ${fullPrompt}`;

      // Prepare reference images if any
      const parts = [];
      
      // Add reference images as inline data
      for (const refImg of referenceImages) {
        const base64Data = refImg.data.split(',')[1];
        const mimeType = refImg.type || 'image/png';
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        });
        parts.push({
          text: `Use this reference image for ${refImg.mode}. Influence: ${Math.round(refImg.influence * 100)}%.`
        });
      }

      // Add the main prompt
      parts.push({
        text: `Generate an image: ${fullPrompt}`
      });

      const generatedImagesResult = [];

      // Generate the requested number of images
      for (let i = 0; i < settings.numberOfImages; i++) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: parts
              }],
              generationConfig: {
                responseModalities: ["TEXT", "IMAGE"],
                temperature: settings.guidanceScale / 10,
                ...(settings.seed ? { seed: parseInt(settings.seed) + i } : {})
              }
            })
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Extract the generated image from the response
        if (data.candidates && data.candidates[0]?.content?.parts) {
          for (const part of data.candidates[0].content.parts) {
            if (part.inlineData) {
              const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              generatedImagesResult.push({
                id: Date.now() + i + Math.random(),
                url: imageUrl,
                prompt: prompt,
                settings: { ...settings },
                cost: costEstimate.totalCost / settings.numberOfImages,
                timestamp: new Date().toISOString()
              });
            }
          }
        }
      }

      if (generatedImagesResult.length === 0) {
        throw new Error('No images were generated. The model may not have returned an image. Try a different prompt.');
      }

      setGeneratedImages(prev => [...generatedImagesResult, ...prev]);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, negativePrompt, settings, costEstimate, apiKey, referenceImages]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0a0a0f] text-gray-100' : 'bg-[#f8f7f4] text-gray-900'}`}>
      {/* Gradient overlay */}
      <div className="fixed inset-0 pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px] ${darkMode ? 'bg-violet-900/20' : 'bg-violet-200/40'}`} />
        <div className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[100px] ${darkMode ? 'bg-rose-900/15' : 'bg-rose-200/30'}`} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${darkMode ? 'bg-[#0a0a0f]/80 border-white/5' : 'bg-[#f8f7f4]/80 border-black/5'}`}>
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0a0a0f] animate-pulse" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold tracking-tight">Gemini 3 Pro Image</h1>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>AI Image Generation Studio</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    apiKey 
                      ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                  }`}
                >
                  {apiKey ? 'API Connected' : 'Set API Key'}
                </button>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-2 rounded-lg transition-all ${darkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            {/* API Key Input */}
            {showApiKeyInput && (
              <div className={`mt-4 p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                <label className="block text-sm font-medium mb-2">Google AI API Key</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API key..."
                    className={`flex-1 px-4 py-2 rounded-lg border text-sm ${
                      darkMode 
                        ? 'bg-black/30 border-white/10 focus:border-violet-500/50' 
                        : 'bg-white border-black/10 focus:border-violet-500'
                    } outline-none transition-colors`}
                  />
                  <button
                    onClick={() => setShowApiKeyInput(false)}
                    className="px-4 py-2 bg-violet-500 text-white rounded-lg text-sm font-medium hover:bg-violet-600 transition-colors"
                  >
                    Save
                  </button>
                </div>
                <p className={`mt-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Get your API key from <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">Google AI Studio</a>
                </p>
              </div>
            )}
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Prompt & References */}
            <div className="lg:col-span-2 space-y-6">
              {/* Prompt Input */}
              <div className={`rounded-2xl border ${darkMode ? 'bg-white/[0.02] border-white/5' : 'bg-white border-black/5'} overflow-hidden`}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-violet-400" />
                      Prompt
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowSavedPrompts(!showSavedPrompts)}
                        className={`p-2 rounded-lg transition-all ${darkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
                        title="Saved Prompts"
                      >
                        <BookMarked className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the image you want to create..."
                    rows={4}
                    className={`w-full px-4 py-3 rounded-xl border text-sm resize-none ${
                      darkMode 
                        ? 'bg-black/30 border-white/10 placeholder-gray-600 focus:border-violet-500/50' 
                        : 'bg-gray-50 border-black/10 placeholder-gray-400 focus:border-violet-500'
                    } outline-none transition-colors`}
                  />
                  
                  <div className="mt-4">
                    <label className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Negative Prompt (optional)</label>
                    <textarea
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="What to avoid in the image..."
                      rows={2}
                      className={`w-full mt-2 px-4 py-3 rounded-xl border text-sm resize-none ${
                        darkMode 
                          ? 'bg-black/30 border-white/10 placeholder-gray-600 focus:border-violet-500/50' 
                          : 'bg-gray-50 border-black/10 placeholder-gray-400 focus:border-violet-500'
                      } outline-none transition-colors`}
                    />
                  </div>

                  {/* Save Prompt */}
                  <div className="mt-4 flex items-center gap-2">
                    <input
                      type="text"
                      value={promptName}
                      onChange={(e) => setPromptName(e.target.value)}
                      placeholder="Prompt name..."
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                        darkMode 
                          ? 'bg-black/30 border-white/10 placeholder-gray-600' 
                          : 'bg-gray-50 border-black/10 placeholder-gray-400'
                      } outline-none`}
                    />
                    <button
                      onClick={savePrompt}
                      disabled={!prompt.trim()}
                      className="px-4 py-2 bg-violet-500/10 text-violet-400 rounded-lg text-sm font-medium hover:bg-violet-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                </div>

                {/* Saved Prompts Drawer */}
                {showSavedPrompts && (
                  <div className={`border-t ${darkMode ? 'border-white/5' : 'border-black/5'}`}>
                    <div className="p-4">
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <BookMarked className="w-4 h-4" />
                        Saved Prompts
                      </h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {savedPrompts.map(sp => (
                          <div
                            key={sp.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all group ${
                              darkMode 
                                ? 'bg-black/20 border-white/5 hover:border-violet-500/30' 
                                : 'bg-gray-50 border-black/5 hover:border-violet-500/50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0" onClick={() => loadPrompt(sp)}>
                                <p className="text-sm font-medium truncate">{sp.name}</p>
                                <p className={`text-xs mt-1 line-clamp-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                  {sp.prompt}
                                </p>
                              </div>
                              <button
                                onClick={() => deletePrompt(sp.id)}
                                className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-red-400 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {savedPrompts.length === 0 && (
                          <p className={`text-sm text-center py-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                            No saved prompts yet
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Reference Images */}
              <div className={`rounded-2xl border ${darkMode ? 'bg-white/[0.02] border-white/5' : 'bg-white border-black/5'} p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Layers className="w-4 h-4 text-fuchsia-400" />
                    Reference Images
                  </label>
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {referenceImages.length} / 5 references
                  </span>
                </div>

                {/* Upload Area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    darkMode 
                      ? 'border-white/10 hover:border-violet-500/30 hover:bg-violet-500/5' 
                      : 'border-black/10 hover:border-violet-500/50 hover:bg-violet-50'
                  }`}
                >
                  <Upload className={`w-8 h-8 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className="text-sm font-medium">Drop images here or click to upload</p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    PNG, JPG, WEBP up to 20MB each
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Reference Image Cards */}
                {referenceImages.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {referenceImages.map(img => (
                      <div
                        key={img.id}
                        className={`flex gap-4 p-3 rounded-xl border ${
                          darkMode ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-black/5'
                        }`}
                      >
                        <img
                          src={img.data}
                          alt={img.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium truncate">{img.name}</p>
                            <button
                              onClick={() => removeReference(img.id)}
                              className="p-1 hover:bg-red-500/10 text-red-400 rounded transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {/* Reference Mode */}
                          <div className="flex gap-1 mt-2">
                            {['style', 'content', 'composition'].map(mode => (
                              <button
                                key={mode}
                                onClick={() => updateReference(img.id, { mode })}
                                className={`px-2 py-1 rounded text-xs font-medium capitalize transition-all ${
                                  img.mode === mode
                                    ? 'bg-violet-500 text-white'
                                    : darkMode 
                                      ? 'bg-white/5 text-gray-400 hover:bg-white/10' 
                                      : 'bg-black/5 text-gray-500 hover:bg-black/10'
                                }`}
                              >
                                {mode}
                              </button>
                            ))}
                          </div>
                          
                          {/* Influence Slider */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Influence</span>
                              <span className="font-medium">{Math.round(img.influence * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={img.influence}
                              onChange={(e) => updateReference(img.id, { influence: parseFloat(e.target.value) })}
                              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-violet-500"
                              style={{
                                background: `linear-gradient(to right, rgb(139, 92, 246) ${img.influence * 100}%, ${darkMode ? 'rgb(30, 30, 40)' : 'rgb(229, 231, 235)'} ${img.influence * 100}%)`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className={`rounded-xl p-4 border ${darkMode ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
                  <div className="flex items-start gap-3">
                    <X className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">Generation Failed</p>
                      <p className="text-sm mt-1 opacity-80">{error}</p>
                    </div>
                    <button onClick={() => setError('')} className="p-1 hover:opacity-70 transition-opacity">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-lg shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg flex items-center justify-center gap-3"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate {settings.numberOfImages > 1 ? `${settings.numberOfImages} Images` : 'Image'}
                  </>
                )}
              </button>

              {/* Generated Images */}
              {generatedImages.length > 0 && (
                <div className={`rounded-2xl border ${darkMode ? 'bg-white/[0.02] border-white/5' : 'bg-white border-black/5'} p-6`}>
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Image className="w-4 h-4 text-emerald-400" />
                    Generated Images
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {generatedImages.map(img => (
                      <div
                        key={img.id}
                        className={`group relative rounded-xl overflow-hidden border ${
                          darkMode ? 'border-white/5' : 'border-black/5'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt="Generated"
                          className="w-full aspect-square object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-xs text-white/70 line-clamp-2 mb-2">{img.prompt}</p>
                            <div className="flex gap-2">
                              <button className="flex-1 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-xs text-white hover:bg-white/20 transition-colors flex items-center justify-center gap-1">
                                <Download className="w-3.5 h-3.5" />
                                Save
                              </button>
                              <button className="flex-1 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-xs text-white hover:bg-white/20 transition-colors flex items-center justify-center gap-1">
                                <Copy className="w-3.5 h-3.5" />
                                Copy
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-md text-[10px] text-white/70">
                          ${img.cost.toFixed(3)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Settings & Cost */}
            <div className="space-y-6">
              {/* Cost Estimation */}
              <div className={`rounded-2xl border ${darkMode ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'} p-6`}>
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-semibold">Cost Estimation</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Input Tokens</span>
                    <span className="font-mono">{costEstimate.inputTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Output Tokens</span>
                    <span className="font-mono">{costEstimate.outputTokens.toLocaleString()}</span>
                  </div>
                  <div className={`h-px ${darkMode ? 'bg-white/10' : 'bg-black/10'}`} />
                  <div className="flex items-center justify-between text-sm">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Input Cost</span>
                    <span className="font-mono">${costEstimate.inputCost.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Image Output</span>
                    <span className="font-mono">${costEstimate.outputCost.toFixed(4)}</span>
                  </div>
                  <div className={`h-px ${darkMode ? 'bg-white/10' : 'bg-black/10'}`} />
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Estimate</span>
                    <span className="text-2xl font-bold text-emerald-400">${costEstimate.totalCost.toFixed(4)}</span>
                  </div>
                  {costEstimate.isLongContext && (
                    <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
                      <Zap className="w-3.5 h-3.5" />
                      Long context pricing applied (&gt;200k tokens)
                    </div>
                  )}
                </div>
              </div>

              {/* Settings Panel */}
              <div className={`rounded-2xl border ${darkMode ? 'bg-white/[0.02] border-white/5' : 'bg-white border-black/5'} overflow-hidden`}>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`w-full px-6 py-4 flex items-center justify-between ${darkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'} transition-colors`}
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-violet-400" />
                    <span className="font-semibold">Generation Settings</span>
                  </div>
                  {showSettings ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                
                {showSettings && (
                  <div className={`px-6 pb-6 space-y-6 border-t ${darkMode ? 'border-white/5' : 'border-black/5'}`}>
                    {/* Resolution */}
                    <div className="pt-6">
                      <label className="text-sm font-medium mb-3 block">Output Resolution</label>
                      <div className="grid grid-cols-3 gap-2">
                        {RESOLUTIONS.map(res => (
                          <button
                            key={res.id}
                            onClick={() => setSettings(s => ({ ...s, resolution: res.id }))}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              settings.resolution === res.id
                                ? 'bg-violet-500/10 border-violet-500/50 text-violet-400'
                                : darkMode 
                                  ? 'border-white/10 hover:border-white/20' 
                                  : 'border-black/10 hover:border-black/20'
                            }`}
                          >
                            <p className="text-sm font-medium">{res.id.toUpperCase()}</p>
                            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{res.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Aspect Ratio */}
                    <div>
                      <label className="text-sm font-medium mb-3 block">Aspect Ratio</label>
                      <div className="flex flex-wrap gap-2">
                        {ASPECT_RATIOS.map(ar => (
                          <button
                            key={ar.id}
                            onClick={() => setSettings(s => ({ ...s, aspectRatio: ar.id }))}
                            className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                              settings.aspectRatio === ar.id
                                ? 'bg-violet-500/10 border-violet-500/50 text-violet-400'
                                : darkMode 
                                  ? 'border-white/10 hover:border-white/20' 
                                  : 'border-black/10 hover:border-black/20'
                            }`}
                          >
                            {ar.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Number of Images */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium">Number of Images</label>
                        <span className="text-sm font-mono text-violet-400">{settings.numberOfImages}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="4"
                        value={settings.numberOfImages}
                        onChange={(e) => setSettings(s => ({ ...s, numberOfImages: parseInt(e.target.value) }))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-violet-500"
                        style={{
                          background: `linear-gradient(to right, rgb(139, 92, 246) ${(settings.numberOfImages - 1) / 3 * 100}%, ${darkMode ? 'rgb(30, 30, 40)' : 'rgb(229, 231, 235)'} ${(settings.numberOfImages - 1) / 3 * 100}%)`
                        }}
                      />
                      <div className="flex justify-between mt-1">
                        {[1, 2, 3, 4].map(n => (
                          <span key={n} className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{n}</span>
                        ))}
                      </div>
                    </div>

                    {/* Thinking Level */}
                    <div>
                      <label className="text-sm font-medium mb-3 block">Thinking Level</label>
                      <div className="grid grid-cols-2 gap-2">
                        {THINKING_LEVELS.map(tl => (
                          <button
                            key={tl.id}
                            onClick={() => setSettings(s => ({ ...s, thinkingLevel: tl.id }))}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              settings.thinkingLevel === tl.id
                                ? 'bg-violet-500/10 border-violet-500/50'
                                : darkMode 
                                  ? 'border-white/10 hover:border-white/20' 
                                  : 'border-black/10 hover:border-black/20'
                            }`}
                          >
                            <p className={`text-sm font-medium ${settings.thinkingLevel === tl.id ? 'text-violet-400' : ''}`}>{tl.label}</p>
                            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{tl.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Media Resolution */}
                    <div>
                      <label className="text-sm font-medium mb-3 block">Reference Image Quality</label>
                      <div className="grid grid-cols-3 gap-2">
                        {MEDIA_RESOLUTIONS.map(mr => (
                          <button
                            key={mr.id}
                            onClick={() => setSettings(s => ({ ...s, mediaResolution: mr.id }))}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              settings.mediaResolution === mr.id
                                ? 'bg-fuchsia-500/10 border-fuchsia-500/50 text-fuchsia-400'
                                : darkMode 
                                  ? 'border-white/10 hover:border-white/20' 
                                  : 'border-black/10 hover:border-black/20'
                            }`}
                          >
                            <p className="text-sm font-medium">{mr.label}</p>
                            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{mr.tokens} tok</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Advanced Settings */}
                    <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                      <p className={`text-xs font-medium mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>ADVANCED</p>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm">Guidance Scale</label>
                            <span className="text-sm font-mono">{settings.guidanceScale}</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="20"
                            step="0.5"
                            value={settings.guidanceScale}
                            onChange={(e) => setSettings(s => ({ ...s, guidanceScale: parseFloat(e.target.value) }))}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-violet-500"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm mb-2 block">Seed (optional)</label>
                          <input
                            type="number"
                            value={settings.seed}
                            onChange={(e) => setSettings(s => ({ ...s, seed: e.target.value }))}
                            placeholder="Random"
                            className={`w-full px-3 py-2 rounded-lg border text-sm ${
                              darkMode 
                                ? 'bg-black/30 border-white/10 placeholder-gray-600' 
                                : 'bg-white border-black/10 placeholder-gray-400'
                            } outline-none`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Reset Button */}
                    <button
                      onClick={() => setSettings({
                        resolution: '2k',
                        aspectRatio: '1:1',
                        thinkingLevel: 'medium',
                        mediaResolution: 'high',
                        numberOfImages: 1,
                        seed: '',
                        guidanceScale: 7.5,
                        steps: 50
                      })}
                      className={`w-full py-2 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        darkMode 
                          ? 'border-white/10 hover:bg-white/5' 
                          : 'border-black/10 hover:bg-black/5'
                      }`}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset to Defaults
                    </button>
                  </div>
                )}
              </div>

              {/* Pricing Reference */}
              <div className={`rounded-2xl border ${darkMode ? 'bg-white/[0.02] border-white/5' : 'bg-white border-black/5'} p-6`}>
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Pricing Reference
                </h3>
                <div className="space-y-3 text-sm">
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-black/30' : 'bg-gray-50'}`}>
                    <p className="font-medium">Input Tokens</p>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      $2.00/1M (≤200k) · $4.00/1M (&gt;200k)
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-black/30' : 'bg-gray-50'}`}>
                    <p className="font-medium">Output Tokens</p>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      $12.00/1M (≤200k) · $18.00/1M (&gt;200k)
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-black/30' : 'bg-gray-50'}`}>
                    <p className="font-medium">Image Output</p>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      1K: $0.039 · 2K: $0.134 · 4K: $0.24
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

export default App;
