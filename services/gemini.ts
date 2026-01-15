import { GoogleGenerativeAI } from "@google/generative-ai";
import { Recipe } from "../types/recipe";
import { getUserGeminiKey } from "./storage";

// IMPORTANT: Replace this with your actual Gemini API Key
const FALLBACK_API_KEY = "YOUR_GEMINI_API_KEY_HERE";

export const askChefAI = async (recipe: Recipe, question: string) => {
    const userKey = await getUserGeminiKey();
    const activeKey = userKey || FALLBACK_API_KEY;

    if (activeKey === "YOUR_GEMINI_API_KEY_HERE") {
        return "Chef AI: Harap masukkan Gemini API Key Anda terlebih dahulu di Pengaturan (Ikon Profil di Home) untuk mengaktifkan fitur ini! 👨‍🍳🗝️";
    }

    try {
        const genAI = new GoogleGenerativeAI(activeKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
      Anda adalah "Chef AI", asisten kuliner profesional yang ramah dan membantu.
      Anda sedang membantu pengguna memasak resep berikut:
      Nama Resep: ${recipe.strMeal}
      Kategori: ${recipe.strCategory}
      Asal: ${recipe.strArea}
      
      Instruksi Resep:
      ${recipe.strInstructions}

      Pertanyaan Pengguna: "${question}"

      Tugas Anda:
      1. Berikan jawaban yang akurat berdasarkan resep di atas.
      2. Jika pengguna menanyakan pengganti bahan, berikan saran yang seimbang secara rasa.
      3. Gunakan bahasa Indonesia yang santai tapi profesional.
      4. Jangan memberikan jawaban yang terlalu panjang, tetap praktis dan mudah diikuti di dapur.
      5. Jika pertanyaan tidak relevan dengan memasak atau resep ini, arahkan kembali dengan sopan.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error("Gemini AI Error:", error);

        if (error.message?.includes('429')) {
            return "Maaf Chef, kuota API Gemini Anda telah habis atau sedang dibatasi (Error 429). 🛑\n\nSaran saya:\n1. Tunggu beberapa menit lalu coba lagi.\n2. Cek kuota Anda di Google AI Studio.";
        }

        return "Maaf Chef, sepertinya ada gangguan koneksi dengan asisten AI. Silakan coba lagi nanti! 👨‍🍳🔌";
    }
};
