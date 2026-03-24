import { GoogleGenAI, Type } from "@google/genai";
import { Ticket, User, Symptom } from '../types';

// Using recommended models for basic and complex tasks
const BASIC_MODEL = 'gemini-2.5-flash';
const PRO_MODEL = 'gemini-2.5-pro';

/**
 * Generates a concise summary of a help desk ticket.
 */
export const generateTicketSummary = async (ticket: Ticket, users: User[]): Promise<string> => {
    const historyText = (ticket.history || [])
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map(h => {
            const user = users.find(u => u.id === h.userId);
            return `- At ${new Date(h.timestamp).toLocaleString()}, ${user?.name || 'System'} noted: ${h.change}`;
        }).join('\n');

    const prompt = `
        Summarize the following IT help desk ticket professionally and concisely. 
        Focus on the user's core problem, the steps taken so far based on the history, and the current status and priority.
        Keep it brief, around 2-3 sentences.

        **Ticket Details:**
        - **Ticket ID:** ${ticket.id}
        - **Department:** ${ticket.department}
        - **User:** ${ticket.email}
        - **Status:** ${ticket.status}
        - **Priority:** ${ticket.priority}
        - **Initial Description:** ${ticket.description}
        
        **Ticket History:**
        ${historyText || 'No history available.'}
        
        **Summary:**
    `;

    try {
        // Create a new instance right before each call to ensure the latest API key is used
        const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_API_KEY as string });
        const response = await ai.models.generateContent({
            model: BASIC_MODEL,
            contents: prompt,
        });
        return response.text || "Summary unavailable.";
    } catch (error) {
        console.error("Error generating ticket summary:", error);
        return "An error occurred while communicating with the AI service.";
    }
};

/**
 * Suggests a professional reply to a user's ticket based on description and history.
 */
export const suggestTicketReply = async (ticket: Ticket, symptomName?: string): Promise<string> => {
    const historyText = (ticket.history || [])
        .map(h => `- ${h.change}`)
        .join('\n');

    const prompt = `
        You are a friendly and professional technician at Vistaran Inc. 
        Write a helpful, concise, and empathetic reply to the user for the following ticket. 
        
        **Context:**
        - Department: ${ticket.department}
        - Issue Category: ${symptomName || 'General Support'}
        - User Description: "${ticket.description}"
        - Current Status: ${ticket.status}
        - Actions Taken So Far:
        ${historyText || 'No actions recorded yet.'}

        **Guidelines:**
        1. Tailor the tone to the ${ticket.department} department. 
        2. If the solution for "${symptomName}" is standard, provide it clearly.
        3. If investigating, reassure the user with next steps.
        4. Keep it professional but warm. Use "Hi there" or similar.
        
        **Suggested Reply:**
    `;

    try {
        // Create a new instance right before each call to ensure the latest API key is used
        const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_API_KEY as string });
        const response = await ai.models.generateContent({
            model: BASIC_MODEL,
            contents: prompt,
        });
        return response.text || "Could not generate a suggestion.";
    } catch (error) {
        console.error("Error suggesting ticket reply:", error);
        return "An error occurred while generating a reply suggestion.";
    }
};

/**
 * Provides diagnostic advice for a specific ticket issue.
 */
export const getTicketDiagnostic = async (ticket: Ticket, symptomName: string, query: string = ""): Promise<string> => {
    const prompt = `
        You are the Vistaran AI Diagnostic Assistant. Provide technical or operational troubleshooting steps for the following case.
        
        **Case Profile:**
        - Department: ${ticket.department}
        - Reported Issue: ${symptomName}
        - User Statement: "${ticket.description}"
        - Current Status: ${ticket.status}

        ${query ? `**Technician's Question:** "${query}"` : "Provide initial diagnostic steps for the technician."}

        **Instructions:**
        - Give 3-4 bulleted actionable steps.
        - Focus on likely causes for "${symptomName}" in an enterprise environment.
        - Be specific. If it's a hardware issue, mention physical checks. If it's software, mention logs or permissions.
    `;

    try {
        // Create a new instance right before each call to ensure the latest API key is used
        const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_API_KEY as string });
        const response = await ai.models.generateContent({
            model: BASIC_MODEL,
            contents: prompt,
        });
        return response.text || "Diagnostic data unavailable.";
    } catch (error) {
        console.error("Diagnostic Error:", error);
        return "The AI Diagnostic engine is currently offline.";
    }
};

/**
 * Researches a ticket issue using Google Search grounding.
 */
export const researchTicketIssue = async (ticket: Ticket): Promise<{ summary: string; sources: any[] }> => {
    const prompt = `
        You are an expert IT support research assistant. 
        Based on the following help desk ticket, perform a web search to find potential solutions, troubleshooting steps, or relevant documentation.
        Summarize your findings clearly and concisely.

        **Ticket Details:**
        - Department: ${ticket.department}
        - User Description: "${ticket.description}"

        Provide a summary of potential solutions and troubleshooting steps.
    `;

    try {
        // Create a new instance right before each call to ensure the latest API key is used
        const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_API_KEY as string });
        const response = await ai.models.generateContent({
            model: PRO_MODEL,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        const summary = response.text || "No research findings available.";
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return { summary, sources };
    } catch (error) {
        console.error("Error researching ticket issue:", error);
        return {
            summary: "An error occurred during research. The search tool might be unavailable.",
            sources: [],
        };
    }
};

/**
 * Analyzes a ticket description and suggests the most relevant symptom.
 */
export const suggestTicketCategory = async (description: string, symptoms: Symptom[]): Promise<string | null> => {
    if (!description.trim() || symptoms.length === 0) return null;

    const symptomsListText = symptoms.map(s => `- ID: ${s.id}, Name: "${s.name}", Dept: "${s.department}"`).join('\n');

    const prompt = `
        Analyze the following user's problem description for a help desk ticket.
        Choose the single most appropriate issue ID from the list provided.
        
        **User Description:**
        "${description}"

        **Available Issues:**
        ${symptomsListText}
    `;

    try {
        // Create a new instance right before each call to ensure the latest API key is used
        const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_API_KEY as string });
        const response = await ai.models.generateContent({
            model: BASIC_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        symptomId: { type: Type.STRING },
                    },
                    required: ['symptomId']
                },
            },
        });
        
        const result = JSON.parse(response.text || '{}');
        if (result.symptomId && symptoms.some(s => s.id === result.symptomId)) {
            return result.symptomId;
        }
        return null;
    } catch (error) {
        console.error("Error suggesting ticket category:", error);
        return null;
    }
};