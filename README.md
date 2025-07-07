# Flashcard AI Pro: The Today I L.E.A.R.N.T. Show (TIL.Show)

**Version:** 1.2
**Status:** In Development

Welcome to Flashcard AI Pro, a mobile-first, AI-powered Progressive Web App (PWA) designed to make learning more efficient and effective. This application automates flashcard creation from various sources and uses machine learning to create optimized study schedules, allowing users to focus on what matters most: learning.

## The Problem

Today's learners, especially those in demanding fields like medicine, spend countless hours manually creating digital study materials. Existing tools can be clunky, unintuitive, and lack the features needed to truly optimize for long-term retention. Flashcard AI Pro tackles this by making content creation effortless and studying intelligent.

## ✨ MVP Features

The Minimum Viable Product (MVP) is focused on the core user journey of creating and studying flashcards.

* **🤖 AI-Powered Creation:** Generate flashcard sets from various sources:
    * Text Prompts
    * PDF and Audio Files
    * Public YouTube Links
    * Multiple Images (e.g., textbook pages or screenshots)
* **🧠 Intelligent Study Scheduling:**
    * An on-device **TensorFlow.js** model creates an optimal, personalized spaced repetition schedule for you.
    * Receive AI-generated alerts when it's the perfect time to study.
    * Set up to three of your own custom study alerts per profile.
* **👤 Multiple Profiles:** Create separate profiles within a single account to manage different subjects or learning goals (e.g., "Medical Boards" and "Portuguese B2").
* **📊 Analytics Dashboard:** Get actionable insights on your study habits with detailed stats on time spent, card/set accuracy, performance over time, and more.
* **🌐 PWA & Offline-First:** The app is a Progressive Web App that works seamlessly offline. Your progress is saved locally and synced to the cloud when you're back online.
* **↔️ Import / Export:** Easily import and export your flashcard sets using a CSV template.
* **💰 Monetization:** The app features a free tier and a one-time "Lifetime Learner" purchase to unlock premium features, powered by **Stripe**.

## 🛠️ Tech Stack

* **Framework:** Full-Stack Next.js
* **Database:** MongoDB with Mongoose
* **AI / Machine Learning:**
    * **Generative AI:** Gemini API (for premium card generation)
    * **On-Device ML:** TensorFlow.js (for spaced repetition)
* **Payments:** Stripe
* **Deployment:** Vercel (recommended)

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

* Node.js (v18 or later)
* npm or yarn
* MongoDB account

### Installation

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/your-username/flashlearn-ai-gemini.git](https://github.com/your-username/flashlearn-ai-gemini.git)
    cd flashlearn-ai-gemini
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a file named `.env.local` in the root of the project and add the following variables. **Do not commit this file to Git.**

    ```dotenv
    # .env.local

    # MongoDB
    MONGODB_URI="your_mongodb_connection_string"

    # NextAuth.js (for authentication)
    # Generate a secret: openssl rand -base64 32
    NEXTAUTH_SECRET="your_nextauth_secret"
    NEXTAUTH_URL="http://localhost:3000"

    # Google Gemini API
    GEMINI_API_KEY="your_gemini_api_key"

    # Stripe
    STRIPE_SECRET_KEY="your_stripe_secret_key"
    STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"
    # This is the price ID from your Stripe dashboard for the Lifetime Learner tier
    STRIPE_LIFETIME_PRICE_ID="price_xxxxxxxxxxxxxx"

    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🤝 Contributing

Contributions are welcome! Please see `CONTRIBUTING.md` for guidelines on how to get started. Also, review our `CODE_OF_CONDUCT.md` and `CODING_STYLE_GUIDE.md`.

---