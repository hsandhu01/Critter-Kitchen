# 🧪 Critter Kitchen ✨

A magical creature-cooking game for kids! Mix mysterious ingredients in a bubbling cauldron and discover unique creatures.

![Critter Kitchen Screenshot](screenshots/gameplay.png)

## 🎮 How to Play

1. **Drag ingredients** from the shelf into the bubbling cauldron
2. **Combine 3 ingredients** to create a recipe
3. **Hit MIX** and watch the magical reaction
4. **Discover a unique creature** born from your recipe!
5. **Collect creatures** in your Bestiary — can you find them all?

## ✨ Features

- 🫧 **Bubbling Cauldron** — Real-time canvas particle effects with bubbles, steam, and sparkles
- 🧪 **6 Magical Ingredients** — Fire Crystals, Moon Dust, Star Nectar, Ocean Tears, Forest Moss, Thunder Sparks
- 🐾 **Procedurally Generated Creatures** — Hundreds of unique combinations with different body shapes, eyes, limbs, and accessories
- 💎 **Rarity System** — Common, Uncommon, Rare, and Legendary creatures
- 📖 **Bestiary Collection** — Track your discoveries with persistent localStorage saves
- 🔊 **Sound Effects** — Procedural audio via Web Audio API
- 🌊 **Drag & Drop** — Smooth mouse and touch support
- 📱 **Responsive** — Works on desktop and tablet

## 🚀 Getting Started

No build tools or server required! Just open the file in your browser:

```bash
# Clone the repo
git clone https://github.com/hsandhu01/Critter-Kitchen.git

# Open in your browser
open index.html
```

Or simply double-click `index.html` to play!

## 🗂️ Project Structure

```
Critter-Kitchen/
├── index.html    # Game HTML structure
├── style.css     # Dark teal laboratory theme with neon glow effects
├── game.js       # Complete game engine (~650 lines)
└── README.md     # You are here!
```

## 🧬 Creature Generation

Each creature is deterministically generated from its ingredient combination:

| Component   | Variations |
|-------------|-----------|
| Body Shape  | Blob, Round, Tall, Spiky, Winged, Squid |
| Eye Style   | Big, Cat, Multi, Cyclops, Sparkly, Sleepy |
| Appendages  | Arms, Legs, Wings, Tail, Antennae, Tentacles |
| Accessories | Crown, Bow, Glasses, Scarf, Horns |

The same ingredient combo always produces the same creature — experiment to find the legendaries!

## 🌐 Live Demo

Play it now: [https://hsandhu01.github.io/Critter-Kitchen/](https://hsandhu01.github.io/Critter-Kitchen/)

## 🛠️ Tech Stack

- **HTML5** — Semantic structure
- **CSS3** — Glassmorphism, neon glow effects, CSS animations
- **JavaScript** — Canvas 2D rendering, Web Audio API, localStorage
- **Google Fonts** — Fredoka + Outfit

## 📝 License

MIT License — feel free to use and modify!

---

Built by [SandhuSoftware](https://sandhusoftware.com)
