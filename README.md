# YouChef 👨‍🍳✨

**YouChef** is a premium, AI-powered culinary assistant designed for the home chef of 2026. Built with React Native and Expo, it combines professional utility with a stunning, high-fidelity user interface.

## 🚀 Key Features

### 🤖 Chef AI Assistant (Gemini 2.5)
*   **Contextual Assistance**: Chat with "Chef AI" who knows exactly what recipe you're viewing.
*   **Voice Control**: Integrated *Text-to-Speech* (TTS) narrates recipes while you cook.
*   **Smart Substitutions**: Need a healthy alternative? Ask for substitutions based on your personal health profile.

### 🗓️ AI Meal Planner
*   **Weekly Scheduling**: Automatically generate or manually plan your meals for the week.
*   **Personalized Diet**: AI plans menus that respect your dietary preferences and health goals.
*   **Premium Calendar UI**: Navigate your week with a high-end horizontal calendar interface.

### 🛒 Smart Shopping List
*   **Instant Recipe Sync**: Save ingredients from any recipe directly to your list in one tap.
*   **Progress Tracking**: Real-time progress bar shows your shopping completion at a glance.
*   **Unified Sync**: Seamless data consistency across all tabs using optimized focus effects.

### 🏆 Cooking Diary & Badges
*   **Culinary Journey**: Keep a log of every dish you've mastered.
*   **Gamification**: Earn unique badges like "Seafood Master" or "Vegetarian Warrior" to track your progress.

### 🎨 Visual Excellence (2026 Design)
*   **Glassmorphism Navigation**: Floating blur-effect tab bar for a modern, airy feel.
*   **Deep Shadow Architecture**: Cards and UI elements utilize premium depth and soft borders.
*   **Adaptive Theme**: The entire app's color palette shifts to match the category of your current dish.

## 📡 Connectivity & Offline Support

**YouChef** balances cloud-powered intelligence with local reliability:

- **🌐 Internet Required**:
    - AI Chef Assistant (Gemini interactions).
    - Searching and loading new recipes from TheMealDB.
    - Voice Interaction (TTS) may require initial data.
- **💾 Offline Ready**:
    - **Shopping List**: View and manage ingredients anytime, anywhere.
    - **Meal Planner**: Access your saved weekly schedule without signal.
    - **Cooking Diary**: Your completed recipes and badges are stored locally.

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **AI Engine**: Google Gemini 2.5 Flash
- **Navigation**: Expo Router (File-based)
- **State Management**: AsyncStorage for local persistence
- **Animation**: React Native Reanimated 3.x
- **UI Components**: 
    - `expo-blur` for Glassmorphism
    - `expo-linear-gradient` for premium depth
    - `expo-speech` for TTS narrations

## 🏗️ Getting Started

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **API Configuration**
   - Obtain a Gemini API Key from [Google AI Studio](https://aistudio.google.com/).
   - Input your key in the **Settings** menu within the app to activate AI features.

4. **Launch the application**
   ```bash
   npx expo start
   ```

---

*Transform your kitchen experience with the power of AI. Happy Cooking!* 🥙🚀🥇
