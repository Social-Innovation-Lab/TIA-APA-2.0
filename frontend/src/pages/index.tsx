import { useState, useRef, useEffect } from 'react';
import { MicrophoneIcon, PaperAirplaneIcon, PhotoIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

export default function Home() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    transcript,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !uploadedImage) return;
    setIsLoading(true);

    if (uploadedImage) {
      const formData = new FormData();
      formData.append('image', uploadedImage);
      formData.append('language', 'bn');
      formData.append('prompt', input);
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/analyze-image`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        setMessages(prev => [...prev, { type: 'assistant', content: response.data.analysis }]);
      } catch (error) {
        setMessages(prev => [...prev, { type: 'assistant', content: 'দুঃখিত, ছবি বিশ্লেষণ করা যায়নি।' }]);
      } finally {
        setIsLoading(false);
        setUploadedImage(null);
        setImagePreview(null);
        setInput('');
      }
    } else {
      // Text-only logic
      const userMessage = { type: 'user', content: input };
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      try {
        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/query`, {
          query: userMessage.content,
          language: 'bn',
        });
        setMessages(prev => [...prev, { type: 'assistant', content: response.data.data }]);
      } catch (error) {
        setMessages(prev => [...prev, { type: 'assistant', content: 'দুঃখিত, কিছু ভুল হয়েছে।' }]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVoiceInput = () => {
    if (!browserSupportsSpeechRecognition) {
      alert('আপনার ব্রাউজার ভয়েস সাপোর্ট করে না।');
      return;
    }
    if (isRecording) {
      SpeechRecognition.stopListening();
      setIsRecording(false);
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true, language: 'bn-BD' });
      setIsRecording(true);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const resetChat = () => {
    setMessages([]);
    setInput('');
    resetTranscript();
    setUploadedImage(null);
    setImagePreview(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 flex flex-col font-bangla relative">
      {/* Pinwheel at upper right */}
      <img src="/Pinwheel.gif" alt="Pinwheel" className="absolute top-4 right-4 w-16 h-16 z-20" />
      {/* Header */}
      <header className="bg-white shadow-md rounded-b-2xl px-6 py-4 flex items-center gap-4">
        <img src="/TiaApa.png" alt="Tia Apa Logo" className="h-16 w-16" />
        <div>
          <h1 className="text-4xl font-extrabold text-black font-bangla">টিয়া আপা</h1>
          <p className="text-md text-black font-bangla">আপনার কৃষি সহায়ক বন্ধু</p>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8 mt-8 flex flex-col gap-6" style={{ height: "calc(100vh - 180px)" }}>
          {/* Welcome message */}
          {messages.length === 0 && !isLoading && (
            <div className="text-center mb-4">
              <h2 className="text-3xl font-bold font-bangla text-black">আপাকে জিজ্ঞেস করুন</h2>
              <p className="text-black font-bangla">আপনার চ্যাট এখানে প্রদর্শিত হবে।</p>
            </div>
          )}
          {/* Chat messages */}
          <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-xl px-4 py-2 max-w-[80%] break-words ${msg.type === 'user' ? 'bg-pink-100 text-right text-black' : 'bg-pink-600 text-white'} shadow`} style={msg.type === 'assistant' ? { backgroundColor: '#E6007A' } : { backgroundColor: '#FCE4EC' }}>
                  {typeof msg.content === 'object' && msg.content !== null && !Array.isArray(msg.content)
                    ? (
                        <div className="text-left">
                          {Object.entries(msg.content).map(([key, value]) => (
                            <div key={key}><b>{key}:</b> {String(value)}</div>
                          ))}
                        </div>
                      )
                    : msg.content
                  }
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-pink-100 text-[#E6007A] rounded-xl px-4 py-2 shadow animate-pulse">
                  চিন্তা করা হচ্ছে...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="fixed bottom-0 left-0 w-full bg-white shadow-inner py-4 px-2 flex justify-center z-10">
        <div className="w-full max-w-2xl flex gap-2 items-center">
          <button type="button" onClick={handleVoiceInput} className="p-2 rounded-full bg-pink-100 hover:bg-pink-200" title="ভয়েস ইনপুট">
            <MicrophoneIcon className={`h-6 w-6 ${isRecording ? 'text-red-500 animate-pulse' : 'text-[#E6007A]'}`} />
          </button>
          <div className="relative flex-1">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded object-cover border border-pink-200"
                style={{ zIndex: 2 }}
              />
            )}
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="দয়া করে আপনার সমস্যা লিখুন"
              className={`w-full p-2 rounded-lg border border-pink-200 focus:ring-2 focus:ring-[#E6007A] font-bangla text-black ${imagePreview ? 'pl-12' : ''}`}
              style={{ paddingLeft: imagePreview ? '3rem' : undefined }}
            />
            {imagePreview && (
              <button
                type="button"
                onClick={() => { setUploadedImage(null); setImagePreview(null); }}
                className="absolute left-10 top-1/2 transform -translate-y-1/2 text-[#E6007A] text-lg font-bold z-10"
                title="Remove image"
              >×</button>
            )}
          </div>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full bg-pink-100 hover:bg-pink-200" title="ছবি আপলোড">
            <PhotoIcon className="h-6 w-6 text-[#E6007A]" />
          </button>
          <button type="button" onClick={resetChat} className="p-2 rounded-full bg-pink-100 hover:bg-pink-200" title="রিসেট">
            <ArrowPathIcon className="h-6 w-6 text-[#E6007A]" />
          </button>
          <button type="submit" className="p-2 rounded-full bg-[#E6007A] hover:bg-pink-700 text-white" title="পাঠান">
            <PaperAirplaneIcon className="h-6 w-6" />
          </button>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
      </form>
      {/* Bangla font import */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700&display=swap');
        .font-bangla { font-family: 'Noto Sans Bengali', sans-serif; }
      `}</style>
    </div>
  );
} 