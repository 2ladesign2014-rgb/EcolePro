import { GoogleGenAI } from "@google/genai";
import { Student } from "../types";

const getAiClient = () => {
  // Ensure API key is present
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key missing for Gemini Service");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateStudentReport = async (student: Student): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Erreur: Clé API manquante. Veuillez configurer process.env.API_KEY.";

  const prompt = `
    Tu es un directeur d'école pédagogique et bienveillant.
    Génère un commentaire de bulletin scolaire concis mais complet (environ 50-80 mots) pour l'élève suivant.
    Utilise un ton professionnel.

    Données de l'élève :
    - Nom : ${student.firstName} ${student.lastName}
    - Classe : ${student.classGrade}
    - Moyenne générale : ${student.average}/20
    - Taux de présence : ${student.attendance}%
    - Notes de comportement : ${student.behaviorNotes.join(", ")}

    Le commentaire doit mettre en avant les points forts, aborder les points faibles avec tact, et donner un conseil pour le prochain trimestre.
    Ne pas mettre de titre, juste le paragraphe.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Impossible de générer le rapport.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Une erreur est survenue lors de la génération du rapport via l'IA.";
  }
};

export const analyzeClassPerformance = async (students: Student[]): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Erreur de configuration API.";

  const dataSummary = students.map(s => `${s.firstName}: ${s.average}/20`).join(", ");
  const prompt = `
    Analyse brièvement les performances globales de cette liste d'élèves :
    ${dataSummary}

    Donne 3 points clés (positifs ou négatifs) sur le niveau global de la classe sous forme de liste à puces HTML (<ul><li>...</li></ul>).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Analyse indisponible.";
  } catch (error) {
    return "Erreur d'analyse.";
  }
};