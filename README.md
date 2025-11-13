<div align="center">

![AniSave Logo](client/public/images/anisave_logo.webp)

### Bridging the gap between farmers and buyers through modern agricultural commerce

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=for-the-badge)](CONTRIBUTING.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](http://makeapullrequest.com)

[🚀 Live Demo](https://anisave.demo) • [📖 Documentation](https://docs.anisave.com) • [🐛 Report Bug](https://github.com/anisave/anisave/issues) • [💡 Request Feature](https://github.com/anisave/anisave/issues)

</div>

---

## 🎯 About AniSave

AniSave is a cutting-edge agricultural marketplace that revolutionizes how farmers connect with buyers. Our platform eliminates intermediaries, ensures fair pricing, and promotes sustainable farming practices while building stronger local food systems.

### 🌟 Why AniSave?

<table>
<tr>
<td align="center" width="25%">
<img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Link.png" width="60" />
<br><b>Direct Trade</b>
<br>Connect farmers directly with buyers, eliminating unnecessary middlemen
</td>
<td align="center" width="25%">
<img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Money%20Bag.png" width="60" />
<br><b>Fair Pricing</b>
<br>Real-time market data ensures transparent pricing
</td>
<td align="center" width="25%">
<img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People/Handshake.png" width="60" />
<br><b>Community</b>
<br>Foster relationships between producers and consumers
</td>
<td align="center" width="25%">
<img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Seedling.png" width="60" />
<br><b>Sustainability</b>
<br>Promote eco-friendly farming practices
</td>
</tr>
</table>

---

## 🔄 Platform Workflow

```mermaid
graph TD
    %% FARMER FLOW
    subgraph "👨‍🌾 Farmer Journey"
        A[Sign Up / Login] --> B[Set Up Profile]
        B --> C[Add Product Listing]
        C --> D[Set Product Price & Category]
        D --> E[Publish Product to Marketplace]
        E --> F[Receive Buyer Inquiries]
        F --> G[Negotiate / Confirm Order]
        G --> H[Mark as Sold or Update Stock]
        H --> I[View Ratings & Feedback]
    end

    %% BUYER FLOW
    subgraph "🛒 Buyer Journey"
        J[Sign Up / Login] --> K[Browse or Search Products]
        K --> L[View Farmer Profile & Product Details]
        L --> M[Check Real-time Prices]
        M --> N[Contact Farmer Directly]
        N --> O[Place Order or Save Product]
        O --> P[Rate Farmer & Product]
    end

    %% ADMIN FLOW
    subgraph "🧑‍💼 Admin Dashboard"
        Q[Manage Users & Roles]
        R[Upload Daily Price PDFs]
        S[Convert PDF to JSON Automatically]
        T[Update Market Prices on Platform]
        U[Post Global Announcements]
        V[Monitor Activities]
        R --> S --> T
    end

    %% CONNECTIONS
    C --> T
    M --> T
    F --> P
    P --> I
    Q --> M
    U --> K

    %% COLORS (brighter and readable)
    style A fill:#2ecc71,stroke:#145a32,stroke-width:2px,color:#ffffff
    style J fill:#3498db,stroke:#1b4f72,stroke-width:2px,color:#ffffff
    style Q fill:#f1c40f,stroke:#9a7d0a,stroke-width:2px,color:#000000
    style R fill:#f1c40f,stroke:#9a7d0a,stroke-width:2px,color:#000000
    style U fill:#f1c40f,stroke:#9a7d0a,stroke-width:2px,color:#000000
```

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🔐 **Authentication & Security**
- 🛡️ Secure authentication with Supabase
- 👥 Role-based access (Farmers & Buyers)
- 🔒 Protected routes and data privacy
- ✅ Email verification system

### 📊 **Market Intelligence**
- 📈 Real-time price monitoring
- 📉 Market trend analysis
- 💹 Competitive pricing insights
- 📱 Price alerts and notifications

### 🛍️ **Product Management**
- ✏️ Intuitive listing interface
- 🖼️ Rich media support
- 📦 Inventory tracking
- 🏷️ Smart categorization

</td>
<td width="50%">

### 👥 **User Experience**
- 🎨 Customizable profiles
- 🔍 Advanced search & filters
- 📱 Mobile-responsive design
- 🌐 Multi-language support

### ⭐ **Trust & Safety**
- ⭐ Verified ratings system
- ✅ Seller verification
- 🔐 Secure transactions
- 🛡️ Fraud protection

### 🤝 **Networking**
- ❤️ Save favorite sellers
- 💬 Direct messaging
- 👥 Community forums
- 📧 Email notifications

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

<div align="center">

### Frontend Architecture
[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![React Router](https://img.shields.io/badge/React_Router-CA4245?style=flat-square&logo=react-router&logoColor=white)](https://reactrouter.com/)

### Backend & Database
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Authentication](https://img.shields.io/badge/Auth-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/auth)
[![Storage](https://img.shields.io/badge/Storage-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/storage)

### Deployment & Tools
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)
[![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=flat-square&logo=eslint&logoColor=white)](https://eslint.org/)
[![Git](https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white)](https://git-scm.com/)

</div>

---

## 📁 Project Structure

```
ANISAVE2.0/
├── 📁 client/
│   └── 📁 public/
│       └── 🖼️ images/
├── 📁 src/
│   ├── 🧩 components/      # Reusable UI components
│   ├── 🎯 contexts/        # React Context providers
│   ├── 📊 data/            # Static data and constants
│   ├── 🪝 hooks/           # Custom React hooks
│   ├── 📚 lib/             # Utility functions & configs
│   ├── 📄 pages/           # Page components
│   ├── 🎨 App.css          # Global styles
│   ├── ⚛️ App.jsx          # Main App component
│   ├── 🎨 index.css        # Base styles
│   ├── 🚀 main.jsx         # App entry point
│   └── 🛣️ Routes.jsx       # Route definitions
├── ⚙️ .env                 # Environment variables
├── 🚫 .gitignore           # Git ignore rules
├── 📋 eslint.config.js     # ESLint configuration
├── 🌐 index.html           # HTML entry point
├── 📦 package.json         # Dependencies
├── 🎨 postcss.config.js    # PostCSS configuration
├── 📖 README.md            # This file
├── 🎨 tailwind.config.js   # Tailwind configuration
└── ⚡ vite.config.js       # Vite configuration
```

---

## 🚀 Getting Started

### Prerequisites

<table>
<tr>
<td align="center" width="33%">
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original.svg" width="48" />
<br><b>Node.js v18+</b>
</td>
<td align="center" width="33%">
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/npm/npm-original-wordmark.svg" width="48" />
<br><b>npm or yarn</b>
</td>
<td align="center" width="33%">
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/git/git-original.svg" width="48" />
<br><b>Git</b>
</td>
</tr>
</table>

### 🎬 Quick Start

```bash
# 1️⃣ Clone the repository
git clone https://github.com/anisave/anisave.git
cd anisave

# 2️⃣ Install dependencies
npm install

# 3️⃣ Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4️⃣ Run the development server
npm run dev

# 5️⃣ Open your browser
# Navigate to http://localhost:5173
```

### 🔑 Environment Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Additional Configuration
VITE_APP_NAME=AniSave
VITE_API_ENDPOINT=your_api_endpoint
```

> 💡 **Pro Tip**: Get your Supabase credentials from your [Supabase Dashboard](https://app.supabase.com/)

---

## 📋 Available Scripts

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run dev` | 🚀 Start development server | Daily development |
| `npm run build` | 🏗️ Build for production | Before deployment |
| `npm run preview` | 👀 Preview production build | Test production locally |
| `npm run lint` | 🔍 Run ESLint | Check code quality |
| `npm run lint:fix` | 🔧 Fix ESLint errors | Auto-fix issues |
| `npm test` | 🧪 Run test suite | Before committing |

---

## 🤝 Contributing

We love contributions! Here's how you can help make AniSave better:

### 📝 Contribution Workflow

```mermaid
graph LR
    A[🍴 Fork Repo] --> B[📋 Create Branch]
    B --> C[💻 Make Changes]
    C --> D[✅ Test Changes]
    D --> E[📝 Commit]
    E --> F[🚀 Push Branch]
    F --> G[🔄 Create PR]
    G --> H{👀 Review}
    H -->|Approved| I[✅ Merge]
    H -->|Changes Needed| C
    I --> J[🎉 Celebrate!]
    
    style A fill:#e1f5ff
    style G fill:#fff3e0
    style I fill:#e8f5e9
    style J fill:#f3e5f5
```

### 🔧 Step-by-Step Guide

1. **🍴 Fork the repository**
2. **📋 Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **💻 Commit your changes**
   ```bash
   git commit -m '✨ Add some amazing feature'
   ```
4. **🚀 Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **🔄 Open a Pull Request**

### 📜 Guidelines

- 📖 Read our [Contributing Guidelines](CONTRIBUTING.md)
- 🤝 Follow our [Code of Conduct](CODE_OF_CONDUCT.md)
- ✍️ Use [conventional commits](https://www.conventionalcommits.org/)
- ✅ Ensure all tests pass before submitting

---

## 📖 Documentation

<div align="center">

| Resource | Description |
|----------|-------------|
| [📚 Full Documentation](https://docs.anisave.com) | Complete platform guide |
| [🎯 API Reference](https://docs.anisave.com/api) | API endpoints and usage |
| [🎨 Design System](https://docs.anisave.com/design) | UI components and patterns |
| [🚀 Deployment Guide](https://docs.anisave.com/deployment) | Hosting and deployment |
| [🔧 Troubleshooting](https://docs.anisave.com/troubleshooting) | Common issues and fixes |

</div>

---

## 🛟 Issues & Support

<table>
<tr>
<td align="center" width="25%">
<a href="https://github.com/anisave/anisave/issues/new?template=bug_report.md">
<img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Bug.png" width="60" />
<br><b>Report Bug</b>
</a>
</td>
<td align="center" width="25%">
<a href="https://github.com/anisave/anisave/issues/new?template=feature_request.md">
<img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Light%20Bulb.png" width="60" />
<br><b>Request Feature</b>
</a>
</td>
<td align="center" width="25%">
<a href="https://discord.gg/anisave">
<img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Waving%20Hand.png" width="60" />
<br><b>Join Discord</b>
</a>
</td>
<td align="center" width="25%">
<a href="mailto:support@anisave.com">
<img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Envelope.png" width="60" />
<br><b>Email Support</b>
</a>
</td>
</tr>
</table>

---

## 🎯 Roadmap

<details>
<summary><b>🚀 Version 2.1 (Q1 2025)</b></summary>

- [ ] 📱 Mobile app (iOS & Android)
- [ ] 💬 Real-time chat system
- [ ] 📊 Advanced analytics dashboard
- [ ] 🌍 Multi-language support
- [ ] 🔔 Push notifications

</details>

<details>
<summary><b>✨ Version 2.2 (Q2 2025)</b></summary>

- [ ] 🤖 AI-powered price recommendations
- [ ] 📸 Image recognition for produce quality
- [ ] 🚚 Integrated logistics tracking
- [ ] 💳 Multiple payment gateways
- [ ] 🎁 Loyalty rewards program

</details>

<details>
<summary><b>🌟 Version 3.0 (Q3 2025)</b></summary>

- [ ] 🌐 Blockchain integration for transparency
- [ ] 🎮 Gamification features
- [ ] 📈 Predictive market analytics
- [ ] 🤝 B2B marketplace
- [ ] 🌱 Carbon footprint tracking

</details>

---

## 📊 Project Stats

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/anisave/anisave?style=social)
![GitHub forks](https://img.shields.io/github/forks/anisave/anisave?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/anisave/anisave?style=social)
![GitHub contributors](https://img.shields.io/github/contributors/anisave/anisave)
![GitHub last commit](https://img.shields.io/github/last-commit/anisave/anisave)
![GitHub repo size](https://img.shields.io/github/repo-size/anisave/anisave)

</div>

---

## 📜 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

```
MIT License - feel free to use this project for personal or commercial purposes
```

---

## 🙏 Acknowledgments

<table>
<tr>
<td align="center">
<img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Clapping%20Hands.png" width="40" />
<br><b>Contributors</b>
<br>Thanks to all who helped!
</td>
<td align="center">
<img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Rocket.png" width="40" />
<br><b>Open Source</b>
<br>Built with amazing tools
</td>
<td align="center">
<img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Ear%20of%20Corn.png" width="40" />
<br><b>Farmers</b>
<br>Our inspiration
</td>
<td align="center">
<img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Globe%20Showing%20Asia-Australia.png" width="40" />
<br><b>Community</b>
<br>Supporting sustainability
</td>
</tr>
</table>

---

<div align="center">

## 💚 Made with Love

**Empowering farmers, connecting communities, building sustainable food systems.**

[![Star on GitHub](https://img.shields.io/github/stars/anisave/anisave?style=social)](https://github.com/anisave/anisave)
[![Follow on Twitter](https://img.shields.io/twitter/follow/anisave?style=social)](https://twitter.com/anisave)
[![Connect on LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=social&logo=linkedin)](https://linkedin.com/company/anisave)

---

### 🌟 Star us on GitHub — it motivates us a lot!

[⬆ Back to Top](#-anisave)

---

*Built with ❤️ by the AniSave Team | © 2025 AniSave. All rights reserved.*

</div>