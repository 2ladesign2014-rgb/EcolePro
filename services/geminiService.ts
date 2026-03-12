import { GoogleGenAI } from "@google/genai";
import { Student } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateStudentReport = async (student: Student): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Générer un commentaire de bulletin scolaire professionnel et encourageant pour l'élève suivant en français.
      
      Nom: ${student.firstName} ${student.lastName}
      Classe: ${student.classGrade}
      Moyenne: ${student.average}/20
      
      Le commentaire doit être concis (2-3 phrases) et adapté à la moyenne.`,
    });
    return response.text || "Erreur lors de la génération du rapport.";
  } catch (error) {
    console.error("Error generating report:", error);
    return "Erreur de connexion à l'IA.";
  }
};

export const analyzeClassPerformance = async (students: Student[]): Promise<string> => {
  if (!students || students.length === 0) return "Aucune donnée d'élève disponible.";
  
  const classData = students.map(s => `${s.firstName} ${s.lastName}: ${s.average}/20`).join('\n');
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyser les performances de cette classe et fournir un résumé de 3-4 phrases en français.
      
      Données des élèves:
      ${classData}
      
      Identifiez la tendance générale, les points forts et les axes d'amélioration.`,
    });
    return response.text || "Erreur lors de l'analyse de la classe.";
  } catch (error) {
    console.error("Error analyzing class:", error);
    return "Erreur de connexion à l'IA.";
  }
};
