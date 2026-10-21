# ⚡ BlackThrone Engine

> **The Master Merchant Replication & Compilation Engine**  
> Transform any cafe, restaurant, bakery, or local business into a high-converting, AI-powered Google Reviews & Experience landing page in **under 3 minutes**.

---

## 🏛️ The Problem BlackThrone Solves

When replicating landing pages manually across multiple merchants:
- Hardcoded tags, prices, and dish names get accidentally left behind (e.g. "Croissants" appearing on an ice-cream parlor page).
- Formatting quirks and whitespace mismatches break string replacement scripts.
- The original master project (like **Blue Door Café & Bakes**) gets cluttered with migration scripts and temporary files.

### The BlackThrone Solution:
- **Zero manual HTML edits:** You define **one clean JSON preset** (`presets/[merchant].json`).
- **Deterministic compilation:** The BlackThrone compiler generates 100% valid, bug-free, standalone production files (`index.html`, `package.json`, assets) in seconds.
- **Isolated Repositories:** Blue Door, Scoop n Brew, and BlackThrone live in separate, clean Git repositories.

---

## 🚀 Quick Start (Under 3 Minutes)

### 1. View Available Merchant Presets
```bash
node cli.js list
```

### 2. Validate a Configuration
```bash
node cli.js validate scoop-n-brew
```

### 3. Compile a Merchant Site
```bash
# Compiles to output/scoop-n-brew/
node cli.js build scoop-n-brew

# Or compile directly to a custom destination directory:
node cli.js build scoop-n-brew --out "D:/Business 2027/Scoop n Brew"
```

### 4. Instant Live Preview
```bash
node cli.js preview scoop-n-brew
```

---

## 📁 Repository Structure

```
D:\Business 2027\BlackThrone\
├── cli.js                     ← Universal CLI Command Center
├── package.json               ← Engine scripts & dependencies
├── .gitignore                 ← Ignores node_modules and output/
├── README.md                  ← Master documentation
├── engine/
│   ├── compiler.js            ← High-speed HTML compiler & DOM generator
│   ├── validator.js           ← Pre-flight config integrity validator
│   └── assets/                ← Shared universal badges & icons
└── presets/
    ├── bluedoor.json          ← Blue Door Café & Bakes archetype
    ├── scoop-n-brew.json      ← Scoop n Brew verified preset
    └── _starter_template.json ← Blank preset to copy for new clients
```

---

## 🎨 How to Onboard Client #3 in 3 Steps

1. **Duplicate the starter preset:**
   ```bash
   cp presets/_starter_template.json presets/new-cafe.json
   ```
2. **Edit `presets/new-cafe.json`:**
   - Store Name, Initials, Tagline, Address, Phone, WhatsApp
   - Brand Color (Hex `#...`)
   - Google Place ID & Review URL
   - 6 to 8 Photo paths & Specialities
3. **Compile & Deploy:**
   ```bash
   node cli.js build new-cafe --out "D:/Business 2027/New Cafe"
   ```
   Done! Your new merchant project is 100% standalone, fully functional, and ready for deployment.

---

## 🌟 Built-in Features for Every Generated Merchant

- 📱 **Mobile-First Responsive Layout:** Glassmorphism headers, buttery-smooth scrolling, responsive cards.
- 🍨 **Interactive Welcome Modal:** Multi-select favorite dishes with checkmark animations.
- 🤖 **AI Review Generator:** 
  - Dynamic category chips (Overall Experience, Taste & Food, Ambience, Staff, Value).
  - 3-Language Instant Switcher (English, Hinglish, Hindi).
  - Automatically weaves selected customer dishes into the review text.
- 📋 **1-Click Copy & Google Review Redirect:** Copies review to clipboard and opens the merchant's exact Google Review dialog.
- 🖼️ **Instagram-Style Photo Gallery:** Fullscreen lightbox with zoom, badges, and captions.
- 📍 **Google Maps Integration:** Direct turn-by-turn navigation link and responsive embed.
- 🌐 **ONE Scan 360 Marketing:** Verified branding footer with Instagram and email.

---

## 🔗 Connected Ecosystem

| Project | Location | Dedicated Git Repository |
| :--- | :--- | :--- |
| **Blue Door 2.0** | `D:\Business 2027\Bluedoor 2.0` | [Shivamborn2shine/BluePrint2.0](https://github.com/Shivamborn2shine/BluePrint2.0.git) |
| **Scoop n Brew** | `D:\Business 2027\Scoop n Brew` | [Shivamborn2shine/Mellow](https://github.com/Shivamborn2shine/Mellow.git) |
| **BlackThrone Engine** | `D:\Business 2027\BlackThrone` | [Shivamborn2shine/BlackThrone](https://github.com/Shivamborn2shine/BlackThrone.git) |

---

*Crafted with precision by Shivamborn2shine & ONESCAN 360.*
