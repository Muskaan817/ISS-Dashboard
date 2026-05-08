import axios from 'axios';

const API_TOKEN = import.meta.env.VITE_AI_TOKEN;
const MODEL_ID = 'mistralai/Mistral-7B-Instruct-v0.2';
const API_URL = `https://api-inference.huggingface.co/models/${MODEL_ID}`;

export const getAIResponse = async (userMessage, dashboardData) => {
  if (!API_TOKEN) {
    return "AI Token is missing. Please add VITE_AI_TOKEN to your .env file.";
  }

  const context = `
    Context:
    - Current ISS Location: Latitude ${dashboardData.iss.latitude}, Longitude ${dashboardData.iss.longitude}
    - Current ISS Speed: ${dashboardData.iss.speed.toFixed(2)} km/h
    - Nearest Place to ISS: ${dashboardData.iss.place}
    - People in Space: ${dashboardData.iss.peopleCount} (${dashboardData.iss.peopleNames.join(', ')})
    - Latest News Headlines: ${dashboardData.news.map(n => n.title).join(' | ')}
    
    Rule: Answer the user's question using ONLY the context provided above. If the information is not in the context, respond exactly with: "I only answer using dashboard data." Do not use outside knowledge.
  `;

  const prompt = `<s>[INST] ${context} \n\n User Question: ${userMessage} [/INST]`;

  try {
    const response = await axios.post(
      API_URL,
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Hugging Face inference API returns an array of objects with generated_text
    let reply = response.data[0]?.generated_text || "I'm sorry, I couldn't process that.";
    
    // Mistral format often includes the prompt in the output, let's strip it
    if (reply.includes('[/INST]')) {
      reply = reply.split('[/INST]').pop().trim();
    }

    return reply;
  } catch (error) {
    console.error('Error fetching AI response:', error);
    if (error.response?.status === 503) {
      return "The AI model is currently loading. Please try again in a few seconds.";
    }
    return "Sorry, I'm having trouble connecting to my brain right now.";
  }
};
