import { GoogleGenAI, Type } from "@google/genai";
import type { Ticket, User, Symptom } from '../types';

// Per the coding guidelines, the API key is assumed to be available in the execution environment.
// The GoogleGenAI instance is initialized directly, without checking for the key's existence.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey });

const modelName = 'gemini-2.5-flash';

/**
 * Generates a concise summary of a help desk ticket.
 * @param ticket - The ticket object.
 * @param users - An array of all users to find the name of the person who made a history entry.
 * @returns A promise that resolves to the summary string.
 */
export const generateTicketSummary = async (ticket: Ticket, users: User[]): Promise<string> => {
    const historyText = (ticket.history || [])
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) // Ensure chronological order
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
        - **User:** ${ticket.email}
        - **Status:** ${ticket.status}
        - **Priority:** ${ticket.priority}
        - **Initial Description:** ${ticket.description}
        
        **Ticket History:**
        ${historyText || 'No history available.'}
        
        **Summary:**
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating ticket summary with Gemini:", error);
        return "An error occurred while communicating with the AI service. Please ensure the API key is configured correctly.";
    }
};

/**
 * Suggests a professional reply to a user's ticket.
 * @param ticket - The ticket object.
 * @returns A promise that resolves to the suggested reply string.
 */
export const suggestTicketReply = async (ticket: Ticket): Promise<string> => {
    const prompt = `
        You are a friendly and professional IT Help Desk technician. 
        Write a helpful reply to the user for the following ticket. 
        If the issue seems simple, you can suggest a potential solution (e.g., "Have you tried restarting?"). 
        If it's more complex, reassure the user that you are investigating the issue. Do not make up facts.
        Keep the tone professional and empathetic. Address the user directly but do not use their name.

        **Ticket Description:** 
        "${ticket.description}"
        
        **Suggested Reply:**
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error suggesting ticket reply with Gemini:", error);
        return "An error occurred while communicating with the AI service. Please ensure the API key is configured correctly.";
    }
};

/**
 * Researches a ticket issue using Google Search grounding.
 * @param ticket - The ticket object.
 * @returns A promise that resolves to the research summary and sources.
 */
export const researchTicketIssue = async (ticket: Ticket): Promise<{ summary: string; sources: any[] }> => {
    const prompt = `
        You are an expert IT support research assistant. 
        Based on the following help desk ticket, perform a web search to find potential solutions, troubleshooting steps, or relevant documentation.
        Summarize your findings clearly and concisely. If you find tutorials or articles, mention them.

        **Ticket Details:**
        - **Symptom:** A user is having an issue with their ${ticket.department}.
        - **User Description:** "${ticket.description}"

        Provide a summary of potential solutions and troubleshooting steps.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        const summary = response.text;
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return { summary, sources };
    } catch (error) {
        console.error("Error researching ticket issue with Gemini:", error);
        return {
            summary: "An error occurred while communicating with the AI service. The Search Grounding tool may be unavailable or the API key may be misconfigured.",
            sources: [],
        };
    }
};

/**
 * Analyzes a ticket description and suggests the most relevant symptom.
 * @param description - The user's description of the issue.
 * @param symptoms - The list of all available symptoms to choose from.
 * @returns A promise that resolves to the ID of the suggested symptom, or null if none could be determined.
 */
export const suggestTicketCategory = async (description: string, symptoms: Symptom[]): Promise<string | null> => {
    if (!description.trim() || symptoms.length === 0) {
        return null;
    }

    const symptomsListText = symptoms.map(s => `- ID: ${s.id}, Name: "${s.name}", Department: "${s.department}"`).join('\n');

    const prompt = `
        Analyze the following user's problem description for a help desk ticket.
        Based on the description, choose the single most appropriate issue from the list provided below.
        You must return only the ID of the chosen issue.

        **User's Problem Description:**
        "${description}"

        **Available Issues:**
        ${symptomsListText}

        Choose the best issue ID from the list.
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        symptomId: {
                            type: Type.STRING,
                            description: 'The ID of the most relevant symptom from the list.'
                        },
                    },
                    required: ['symptomId']
                },
            },
        });
        
        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);
        
        if (result && result.symptomId && symptoms.some(s => s.id === result.symptomId)) {
            return result.symptomId;
        }
        
        console.warn("Gemini returned a symptomId that does not exist in the provided list:", result.symptomId);
        return null;

    } catch (error) {
        console.error("Error suggesting ticket category with Gemini:", error);
        return null;
    }
};