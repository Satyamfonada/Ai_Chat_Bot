// src/api.ts
import supabase from './supabaseClient.ts';

// Types for better type safety
export interface ChatSession {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  message: string;
  sender: 'user' | 'bot';
  created_at: string;
}

// Fetch all chat sessions
export const fetchChatSessions = async (): Promise<ChatSession[]> => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Supabase error:', error);
    throw error;
  }

  return data || [];
};

// Create a new chat session
export const createChatSession = async (name: string): Promise<ChatSession> => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert([{ name }])
    .select()
    .single();

  if (error) {
    console.error('Supabase error in createChatSession:', error);
    throw error;
  }
  return data;
};

// Fetch messages for a specific session
export const fetchMessages = async (sessionId: string): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

// Send a user message
export const sendMessage = async (sessionId: string, message: string) => {
  const { error } = await supabase
    .from('messages')
    .insert([{
      session_id: sessionId,
      message,
      sender: 'user'
    }]);

  if (error) throw error;

  // Update session's updated_at timestamp
  await supabase
    .from('chat_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId);
};

// Send a bot reply
export const sendBotReply = async (sessionId: string, reply: string) => {
  const { error } = await supabase
    .from('messages')
    .insert([{
      session_id: sessionId,
      message: reply,
      sender: 'bot'
    }]);

  if (error) throw error;

  // Update session's updated_at timestamp
  await supabase
    .from('chat_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId);
};

// Update session name
export const updateSessionName = async (sessionId: string, name: string) => {
  const { error } = await supabase
    .from('chat_sessions')
    .update({ name })
    .eq('id', sessionId);

  if (error) throw error;
};

// Delete a chat session
export const deleteChatSession = async (sessionId: string) => {
  // First delete all messages in the session
  const { error: messagesError } = await supabase
    .from('messages')
    .delete()
    .eq('session_id', sessionId);

  if (messagesError) throw messagesError;

  // Then delete the session
  const { error: sessionError } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId);

  if (sessionError) throw sessionError;
};

// Generate session name from first message
export const generateSessionName = (message: string): string => {
  // Extract keywords from the message
  const words = message.toLowerCase().split(' ');
  const keywords = words.filter(word =>
    word.length > 2 &&
    !['the', 'and', 'or', 'but', 'for', 'with', 'what', 'how', 'why', 'when', 'where', 'is', 'are', 'was', 'were', 'can', 'could', 'would', 'should', 'will', 'do', 'does', 'did'].includes(word)
  );

  if (keywords.length > 0) {
    // Take the first 2-3 meaningful keywords
    const nameKeywords = keywords.slice(0, 3);
    return nameKeywords.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  // Fallback to first few words
  const fallbackWords = words.slice(0, 3);
  return fallbackWords.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'New Chat';
};

// AI response function
export const getBotReply = async (userMessage: string): Promise<string> => {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer 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`,
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat:free",
        messages: [
          { role: "system", content: "You are a helpful AI assistant." },
          { role: "user", content: userMessage },
        ],
      }),
    });

    const data = await res.json();
    return (
      data.choices?.[0]?.message?.content?.trim() ||
      "I didn't understand that."
    );
  } catch (error) {
    console.error("Error:", error);
    return "Something went wrong.";
  }
};
