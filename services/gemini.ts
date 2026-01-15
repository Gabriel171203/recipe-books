import { GoogleGenerativeAI } from "@google/generative-ai";
import { Recipe } from "../types/recipe";
import { getUserGeminiKey, getUserPreferences } from "./storage";

// IMPORTANT: Replace this with your actual Gemini API Key
const FALLBACK_API_KEY = "YOUR_GEMINI_API_KEY_HERE";

export const askChefAI = async (recipe: Recipe, question: string) => {
    const [userKey, userPrefs] = await Promise.all([
        getUserGeminiKey(),
        getUserPreferences()
    ]);

    const activeKey = userKey || FALLBACK_API_KEY;

    // Extract ingredients and measures for better AI context
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        const name = recipe[`strIngredient${i}`];
        const measure = recipe[`strMeasure${i}`];
        if (name && name.trim()) {
            ingredients.push(`${name} (${measure || ''})`);
        }
    }

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
      
      Bahan-bahan:
      ${ingredients.join('\n      ')}

      Instruksi Resep:
      ${recipe.strInstructions}

      Profil Kesehatan/Diet Pengguna: "${userPrefs || 'Tidak ada preferensi khusus'}"

      Pertanyaan Pengguna: "${question}"

      Tugas Anda:
      1. Berikan jawaban yang akurat berdasarkan resep di atas.
      2. Jika pengguna menanyakan pengganti bahan, berikan saran yang seimbang secara rasa DAN sesuai dengan "Profil Kesehatan Pengguna" jika ada.
      3. Selalu ingatkan jika ada bahan dalam resep yang berbahaya bagi "Profil Kesehatan Pengguna".
      4. Jika pengguna menanyakan kalori atau nutrisi, berikan estimasi cerdas berdasarkan bahan resep.
      5. Jika pengguna menanyakan porsi (scaling), hitung takaran bahan secara akurat.
      6. Gunakan bahasa Indonesia yang santai tapi profesional.
      7. Jangan memberikan jawaban yang terlalu panjang, tetap praktis dan mudah diikuti di dapur.
      8. PENTING: JANGAN gunakan markdown bolding (seperti **teks**). Gunakan teks biasa saja.
      9. PENTING: Gunakan struktur poin yang bersih jika memberikan daftar (contoh pakai strip '-').
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Final cleanup to ensure no ** markers remain
        return text.replace(/\*\*/g, '');
    } catch (error: any) {
        console.error("Gemini AI Error:", error);

        if (error.message?.includes('429')) {
            return "Maaf Chef, kuota API Gemini Anda telah habis atau sedang dibatasi (Error 429). 🛑\n\nSaran saya:\n1. Tunggu beberapa menit lalu coba lagi.\n2. Cek kuota Anda di Google AI Studio.";
        }

        return "Maaf Chef, sepertinya ada gangguan koneksi dengan asisten AI. Silakan coba lagi nanti! 👨‍🍳🔌";
    }
};

export const suggestMealPlan = async () => {
    const [userKey, userPrefs] = await Promise.all([
        getUserGeminiKey(),
        getUserPreferences()
    ]);

    const activeKey = userKey || FALLBACK_API_KEY;

    if (activeKey === "YOUR_GEMINI_API_KEY_HERE") {
        return null;
    }

    try {
        const genAI = new GoogleGenerativeAI(activeKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
      Anda adalah "Chef AI Meal Planner". Tugas Anda adalah membuat rencana makan selama 7 hari ke depan.
      
      Profil Kesehatan/Diet Pengguna: "${userPrefs || 'Tidak ada preferensi khusus'}"
      
      Kategori Resep yang tersedia dalam aplikasi kami: 
      Breakfast, Chicken, Dessert, Seafood, Vegetarian, Beef, Pasta, Pork, Side, Starter, Vegan.

      Tugas Anda:
      1. Berikan rekomendasi untuk Breakfast, Lunch, dan Dinner selama 7 hari.
      2. Sesuaikan rekomendasi dengan Profil Kesehatan/Diet Pengguna (PENTING!).
      3. Berikan saran nama masakan yang umum dan menarik (dalam Bahasa Indonesia).
      4. Untuk setiap masakan, tentukan kategori yang paling cocok dari daftar kategori di atas.

      Output harus dalam format JSON murni seperti ini:
      {
        "days": [
          {
            "day": "Senin",
            "meals": [
              { "type": "Breakfast", "name": "Bubur Ayam Spesial", "category": "Chicken" },
              { "type": "Lunch", "name": "Salad Salmon Segar", "category": "Seafood" },
              { "type": "Dinner", "name": "Tumis Buncis Garlic", "category": "Vegetarian" }
            ]
          },
          ... (sampai Minggu)
        ]
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return JSON.parse(response.text());
    } catch (error) {
        console.error("Gemini Meal Plan Error:", error);
        return null;
    }
};
