<div align="center">

# ✨ Akul Tyagi — Portfolio Website

### *An Immersive 3D Interactive Experience*

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Visit_Site-red?style=for-the-badge)](https://akul-tyagi.github.io/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.173-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

<p align="center">
  <strong>A cutting-edge, fully immersive 3D portfolio experience built with modern web technologies.</strong>
  <br />
  Explore a virtual city, interact with floating 3D models, and discover my work in an unforgettable way.
</p>

</div>

---

## 🎮 Live Experience

**[→ akul-tyagi.github.io](https://akul-tyagi.github.io/)**

Experience the full interactive portfolio with:
- 🏙️ **Explorable 3D City** — Navigate a night-city environment with first-person controls
- 🎠 **Scroll-driven Animations** — Journey through a 20-page scroll experience with floating 3D models
- 🎬 **Cinematic Transitions** — Video transitions between scenes with camera fall effects
- 🎵 **Ambient Audio** — Background music that enhances the atmosphere

---

## 🚀 Tech Stack

<table>
<tr>
<td>

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.4 | React framework with static export |
| **React** | 19.2.3 | UI component library |
| **TypeScript** | 5.x | Type-safe JavaScript |

</td>
<td>

### 3D & Graphics
| Technology | Version | Purpose |
|------------|---------|---------|
| **Three.js** | 0.173 | 3D graphics engine |
| **React Three Fiber** | 9.0.4 | React renderer for Three.js |
| **@react-three/drei** | 10.0.3 | Useful helpers for R3F |

</td>
</tr>
<tr>
<td>

### Animation & State
| Technology | Version | Purpose |
|------------|---------|---------|
| **GSAP** | 3.13.0 | Professional-grade animations |
| **Framer Motion** | 12.23.22 | React animations |
| **Zustand** | 5.0.3 | Lightweight state management |

</td>
<td>

### Styling & Tools
| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 3.4.1 | Utility-first CSS framework |
| **PostCSS** | 8.x | CSS processing |
| **Husky** | 9.1.7 | Git hooks for code quality |
| **ESLint** | 9.39.2 | Code linting |

</td>
</tr>
</table>

---

## 🏗️ Architecture Overview

```
📁 app/
├── 📄 page.tsx              # Main entry point with dual-scene system
├── 📄 layout.tsx            # Root layout with fonts & analytics
├── 📁 components/
│   ├── 📁 common/           # Shared UI components
│   │   ├── CanvasLoader     # Main 3D canvas with scroll controls
│   │   ├── CityScene        # Explorable 3D city environment
│   │   ├── VideoOverlay     # Cinematic video transitions
│   │   ├── ScrollWrapper    # Camera scroll animation system
│   │   ├── AudioToggle      # Background music controls
│   │   └── ThemeSwitcher    # Dynamic theme switching
│   ├── 📁 hero/             # Hero section with title & CTAs
│   └── 📁 models/           # 3D model components
│       ├── CityModel        # Night city GLTF scene
│       ├── HorseModel       # Animated horse with PBR textures
│       ├── IronThrone       # Game of Thrones throne (OBJ)
│       ├── ModelsRail       # Floating interactive 3D models
│       └── TrainModel       # Animated train model
├── 📁 stores/               # Zustand state management
│   ├── audioStore           # Background music state
│   ├── videoStore           # Video playback control
│   ├── scrollStore          # Scroll progress tracking
│   ├── cityStore            # City scene loading state
│   └── themeStore           # Theme/color management
├── 📁 constants/            # Configuration & assets
└── 📁 types/                # TypeScript type definitions

📁 public/
├── 📁 models/               # 3D assets (GLB, GLTF, OBJ)
│   ├── 📁 city/             # Night city scene
│   ├── 📁 horse/            # Horse model with textures
│   ├── 📁 IronThrone/       # Iron Throne model
│   └── *.glb                # Various 3D props
├── 📁 videos/               # Cinematic transition videos
├── 📁 icons/                # SVG icons
└── *.otf, *.ttf             # Custom fonts
```

---

## ✨ Key Features

### 🎢 **Dual-Scene Architecture**
The portfolio consists of two main phases:
1. **Scroll Phase** — A vertical scroll experience with animated 3D models, floating elements, and an animated horse companion
2. **City Phase** — A fully explorable 3D night city with first-person controls

### 🐎 **Interactive 3D Models**
- **Floating Model Rail** — 10+ interactive 3D objects (One Piece figurines, gaming setup, coffee mugs, etc.)
- **Horse Companion** — A detailed PBR horse model that follows you through the scroll journey
- **Iron Throne** — A resume hotspot featuring the iconic Game of Thrones throne
- **Social Links** — 3D branded icons linking to GitHub, LinkedIn, LeetCode, and Pinterest

### 🎥 **Cinematic Transitions**
- Full-screen video transitions between scenes
- Dramatic "camera fall" effect when entering the city
- Smooth crossfades and GPU-compiled preloading

### 🎮 **City Navigation**
- **Desktop**: WASD movement, mouse look, shift to sprint, escape to free cursor
- **Mobile**: Touch drag to look, tap to move, double-tap to sprint
- Collision boundaries and "Go Back" portal to return to the hero section

### 🎨 **Performance Optimizations**
- Phased asset loading (hero assets → city assets)
- GPU shader pre-compilation
- Adaptive DPR (Device Pixel Ratio) based on device
- Canvas frame loop pauses during video playback
- Frustum culling on large city scenes

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/Akul-Tyagi/Akul-Tyagi.github.io.git

# Navigate to the project directory
cd Akul-Tyagi.github.io

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev

# Open http://localhost:3000 in your browser
```

### Production Build

```bash
# Create a static export for GitHub Pages
npm run build

# The output will be in the `out/` directory
```

### Linting

```bash
# Run ESLint
npm run lint
```

---

## 📁 3D Assets

The portfolio features a rich collection of 3D models:

| Model | Format | Description |
|-------|--------|-------------|
| Night City | GLTF | Explorable cyberpunk-style city environment |
| Horse | GLB (x5) | Multi-part horse with PBR textures |
| Iron Throne | OBJ (x2) | Game of Thrones throne with sword textures |
| One Piece | GLB | Anime figurine |
| Gaming Setup | GLB | Desk setup model |
| PS5 Controller | GLB | PlayStation 5 controller |
| Sony XM5 | GLB | Headphones model |
| Arsenal Logo | GLB | Football club badge |
| Sopranos Prop | GLB | TV show reference |
| Breaking Bad | GLB | TV show reference |
| Coffee Mugs | GLB (x2) | Interactive mugs with hover text |

---

## 🎯 Project Showcase

Navigate to the **PROJECTS** section in the city to view:

| Project | Description | Link |
|---------|-------------|------|
| **CureApt** | Healthcare appointment platform | [cureapt.vercel.app](https://cureapt.vercel.app/) |
| **Naivety** | Mobile app on Google Play | [Play Store](https://play.google.com/store/apps/details?id=com.abundance.naivety) |
| **Unagi** | Web application | [unagico.vercel.app](https://unagico.vercel.app/) |

---

## 🎨 Custom Typography

The portfolio uses a curated selection of custom fonts:

- **Soria** — Primary serif font
- **Vercetti** — Sans-serif body text
- **Buzzer** — Hero title display
- **Monica** — Accent typography
- **CV** — UI labels
- **Ruigslay** — Subheadings

---

## 🌐 Deployment

This portfolio is deployed on **GitHub Pages** using Next.js static export:

1. **Build Command**: `npm run build`
2. **Output**: Static files in `out/` directory
3. **Hosting**: GitHub Pages with custom domain support

---

## 📊 Analytics

Google Analytics integration via `@next/third-parties` for tracking visitor engagement.

---

## 🔧 Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics measurement ID |

### Next.js Config

```typescript
// next.config.ts
{
  output: "export",           // Static export for GitHub Pages
  images: { unoptimized: true }, // Required for static export
  reactStrictMode: false,     // Disabled for R3F compatibility
}
```

---

## 🤝 Connect

<div align="center">

[![GitHub](https://img.shields.io/badge/GitHub-Akul--Tyagi-181717?style=for-the-badge&logo=github)](https://github.com/Akul-Tyagi)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-akul--tyagi-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/akul-tyagi/)
[![LeetCode](https://img.shields.io/badge/LeetCode-AKUL__TYAGI-FFA116?style=for-the-badge&logo=leetcode)](https://leetcode.com/u/AKUL_TYAGI/)
[![Pinterest](https://img.shields.io/badge/Pinterest-VincenzoSanji-E60023?style=for-the-badge&logo=pinterest)](https://in.pinterest.com/VincenzoSanji/)

</div>

---

<div align="center">

**Built with ❤️ by Akul Tyagi**

*Frontend Engineer | Creative Developer | 3D Enthusiast*

</div>
