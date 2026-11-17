import React, { useState, useEffect, useCallback } from 'react';
import type { Message, ChatSession } from './types';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import { generateEwasteResponse, generateChatTitle, initializeVectorService } from './services/geminiService';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import Sidebar from './components/Sidebar';
import AuthPage from './components/AuthPage';
import { getCurrentUser, logOut } from './services/authService';
import { recyclingCenters } from './data/recyclingCenters';
import type { Location } from './types';
import RecommendationForm from './components/RecommendationForm';

// --- Location Helpers ---
const WAGHOLI_PUNE_LOCATION = { lat: 18.5833, lng: 73.9833 };
const SEARCH_RADIUS_KM = 20;

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
}

const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}
// -------------------------


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(getCurrentUser());
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [showRecommendations, setShowRecommendations] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      try {
        const savedSessions = localStorage.getItem(`ewaste_chat_sessions_${currentUser}`);
        const savedActiveId = localStorage.getItem(`ewaste_active_session_id_${currentUser}`);
        if (savedSessions) {
          setChatSessions(JSON.parse(savedSessions));
        } else {
          setChatSessions([]);
        }
        if (savedActiveId) {
          setActiveSessionId(JSON.parse(savedActiveId));
        } else {
          setActiveSessionId(null);
        }
        
        // Initialize vector service for the user
        initializeVectorService();
      } catch (error) {
        console.error("Failed to load user sessions from local storage", error);
        setChatSessions([]);
        setActiveSessionId(null);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem(`ewaste_chat_sessions_${currentUser}`, JSON.stringify(chatSessions));
        localStorage.setItem(`ewaste_active_session_id_${currentUser}`, JSON.stringify(activeSessionId));
      } catch (error) {
        console.error("Failed to save to local storage", error);
      }
    }
  }, [chatSessions, activeSessionId, currentUser]);

  const activeSession = chatSessions.find(s => s.id === activeSessionId);
  
  const getUserLocation = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log("Geolocation is not supported by this browser.");
        resolve(null);
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          () => {
            console.log("Unable to retrieve your location. Using default.");
            resolve(null);
          }
        );
      }
    });
  };

  const handleNewChat = () => {
    setShowRecommendations(false);
    setActiveSessionId(null);
    if(window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleSelectChat = (id: string) => {
    setShowRecommendations(false);
    setActiveSessionId(id);
    if(window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleOpenRecommendations = () => {
    setShowRecommendations(true);
    setActiveSessionId(null);
    if(window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleDeleteChat = (id: string) => {
    setChatSessions(prev => {
        const remainingSessions = prev.filter(s => s.id !== id);
        if (activeSessionId === id) {
            if (remainingSessions.length > 0) {
                setActiveSessionId(remainingSessions[0].id);
            } else {
                setActiveSessionId(null);
            }
        }
        return remainingSessions;
    });
  };

  const handleSendMessage = useCallback(async (text: string, image?: { mimeType: string; data: string }) => {
    if (!text && !image) return;

    setIsLoading(true);
    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text,
      image: image ? `data:${image.mimeType};base64,${image.data}` : undefined,
    };

    let currentSessionId = activeSessionId;
    let isNewChat = !currentSessionId;
    
    if (isNewChat) {
      currentSessionId = `session_${Date.now()}`;
      const newSession: ChatSession = {
        id: currentSessionId,
        title: "New Chat...",
        messages: [userMessage]
      };
      setChatSessions(prev => [newSession, ...prev]);
      setActiveSessionId(currentSessionId);
    } else {
      setChatSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, userMessage] } : s));
    }
    
    try {
      const isLocationQuery = /where|near me|locations?|centers?|find/i.test(text);
      let nearbyCenters: Location[] | undefined = undefined;
      let locationForAI: { lat: number; lng: number } | null = null;
      
      if (isLocationQuery) {
        const userLocation = await getUserLocation();
        const searchCenter = userLocation || WAGHOLI_PUNE_LOCATION;
        locationForAI = searchCenter;
        
        nearbyCenters = recyclingCenters.filter(center => {
          const distance = getDistanceFromLatLonInKm(
            searchCenter.lat,
            searchCenter.lng,
            center.lat,
            center.lng
          );
          return distance <= SEARCH_RADIUS_KM;
        });
      }

      const [geminiText, chatTitle] = await Promise.all([
        generateEwasteResponse(text, image, locationForAI, currentUser, currentSessionId),
        isNewChat ? generateChatTitle(text || "Image Query") : Promise.resolve(null)
      ]);

      let botText = geminiText;
      let finalLocations = nearbyCenters;

      if (isLocationQuery) {
        if (nearbyCenters && nearbyCenters.length > 0) {
          const centersList = nearbyCenters.map(center => 
            `**${center.name}**\n${center.address}`
          ).join('\n\n');
          // For location queries with concrete results, override the generic LLM text
          // to avoid sentences claiming locations are not detailed in references.
          botText = `Based on your approximate location, here are some authorized e-waste recycling centers near Pune.\n\n${centersList}`;
        } else {
          botText = `I'm sorry, I couldn't find any recycling centers within a ${SEARCH_RADIUS_KM}km radius of your location. You might want to try searching a wider area or contacting your local municipality for more options.`;
          finalLocations = undefined;
        }
      }
      
      const botMessage: Message = {
        id: Date.now() + 1,
        sender: 'bot',
        text: botText,
        locations: finalLocations,
      };

      setChatSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          const updatedSession = { ...s, messages: [...s.messages, botMessage] };
          if (chatTitle) {
            updatedSession.title = chatTitle;
          }
          return updatedSession;
        }
        return s;
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      const errorBotMessage: Message = {
        id: Date.now() + 1,
        sender: 'bot',
        text: `Sorry, something went wrong. Please check your connection or API key and try again. Error: ${errorMessage}`,
      };
      setChatSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, errorBotMessage] } : s));
    } finally {
      setIsLoading(false);
    }
  }, [activeSessionId, currentUser]);

  const handleLoginSuccess = (email: string) => {
    setCurrentUser(email);
  };

  const handleLogout = () => {
    logOut();
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <AuthPage onAuthSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-white text-gray-900 font-sans">
      <Sidebar
        isOpen={isSidebarOpen}
        sessions={chatSessions}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onClose={() => setSidebarOpen(false)}
        userEmail={currentUser}
        onLogout={handleLogout}
        onOpenRecommendations={handleOpenRecommendations}
      />
      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out" style={{ marginLeft: isSidebarOpen && window.innerWidth >= 768 ? '256px' : '0' }}>
        <Header onMenuClick={() => setSidebarOpen(prev => !prev)} />
        <main className="flex-1 flex flex-col min-h-0">
          {showRecommendations ? (
            <RecommendationForm />
          ) : activeSession && activeSession.messages.length > 0 ? (
            <ChatWindow messages={activeSession.messages} isLoading={isLoading} />
          ) : (
            <WelcomeScreen onSendMessage={handleSendMessage} />
          )}
        </main>
        {!showRecommendations && (
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        )}
      </div>
    </div>
  );
};

export default App;