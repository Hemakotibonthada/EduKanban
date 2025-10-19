# EduKanban Theme & Design System

Complete design guide for the EduKanban educational platform. Use these exact settings to replicate the visual style in other projects.

---

## 🎨 **1. COLOR PALETTE**

### **Primary Brand Colors**
```css
Purple Spectrum:
- Primary Purple:    from-purple-500 to-pink-500
- Deep Purple:       from-purple-600 to-pink-600
- Indigo Purple:     from-indigo-500 to-purple-500
- Violet Purple:     from-purple-900 to-slate-900

Blue Spectrum:
- Primary Blue:      from-blue-500 to-purple-500
- Cyan Blue:         from-blue-500 to-cyan-500
- Deep Blue:         from-blue-600 to-purple-600
- Sky Blue:          from-blue-50 to-purple-50 (light mode)
```

### **Secondary Colors**
```css
Warm Colors:
- Orange/Red:        from-orange-500 to-red-500
- Yellow/Orange:     from-yellow-400 to-orange-500
- Yellow/Red:        from-yellow-500 to-red-500
- Pink/Rose:         from-pink-500 to-rose-500

Cool Colors:
- Green/Teal:        from-green-500 to-teal-500
- Green/Emerald:     from-green-500 to-emerald-500
- Cyan/Blue:         from-blue-500 to-cyan-500

Metallic:
- Gold/Legend:       from-yellow-400 to-yellow-600
- Gray/Neutral:      from-gray-500 to-gray-600
```

### **Slate Gradient (Alternative Theme)**
```css
Background:         from-slate-900 via-purple-900 to-slate-900
Cards:              from-slate-800 to-purple-900
```

### **Dark Mode Colors**
```css
Backgrounds:
- Primary BG:        dark:bg-gray-900
- Secondary BG:      dark:bg-gray-800
- Tertiary BG:       dark:bg-gray-700
- Subtle BG:         dark:bg-gray-600

Borders:
- Primary Border:    dark:border-gray-700
- Secondary Border:  dark:border-gray-600
- Accent Border:     dark:border-purple-500/20

Text Colors:
- Primary Text:      dark:text-white
- Secondary Text:    dark:text-gray-300
- Tertiary Text:     dark:text-gray-400
- Muted Text:        dark:text-gray-500

Gradients (Dark):
- Subtle Purple:     dark:from-purple-900/20 dark:to-pink-900/20
- Subtle Blue:       dark:from-blue-900/20 dark:to-cyan-900/20
- Subtle Green:      dark:from-green-900/20 dark:to-teal-900/20
```

### **Light Mode Colors**
```css
Backgrounds:
- Primary BG:        bg-white
- Secondary BG:      bg-gray-50
- Tertiary BG:       bg-gray-100
- Subtle BG:         bg-gray-200

Borders:
- Primary Border:    border-gray-200
- Secondary Border:  border-gray-300

Text Colors:
- Primary Text:      text-gray-900
- Secondary Text:    text-gray-700
- Tertiary Text:     text-gray-600
- Muted Text:        text-gray-500
```

---

## 🎭 **2. BADGE & ACHIEVEMENT COLORS**

```javascript
Badge Gradients:
- First Steps:       from-blue-500 to-cyan-500
- Consistent:        from-orange-500 to-red-500
- Knowledge Seeker:  from-purple-500 to-pink-500
- Perfectionist:     from-yellow-500 to-orange-500
- Dedicated:         from-green-500 to-teal-500
- Early Bird:        from-indigo-500 to-purple-500
- Night Owl:         from-pink-500 to-rose-500
- Speed Demon:       from-yellow-500 to-red-500
- Social Butterfly:  from-blue-500 to-purple-500
- Task Master:       from-green-500 to-emerald-500
- Legendary:         from-yellow-400 to-yellow-600
- Rising Star:       from-red-500 to-pink-500

Rank Colors (by XP):
- Legend (10000+):   from-yellow-400 to-yellow-600
- Master (5001+):    from-purple-500 to-pink-500
- Expert (2500+):    from-blue-500 to-purple-500
- Advanced (1000+):  from-green-500 to-teal-500
- Intermediate (500+): from-orange-500 to-red-500
- Novice:            from-gray-500 to-gray-600
```

---

## 🌈 **3. GRADIENT DIRECTIONS**

### **Background Gradients**
```css
Full Page Backgrounds:
- bg-gradient-to-br     (Bottom Right) - Most Common
  Examples:
  • from-purple-50 to-blue-50 (Light Mode)
  • dark:from-gray-900 dark:to-gray-800 (Dark Mode)
  • from-slate-900 via-purple-900 to-slate-900

Card/Component Gradients:
- bg-gradient-to-br     (Bottom Right) - Cards, Badges
  • from-purple-500/10 to-pink-500/10
  • from-purple-500 to-pink-500

Header Gradients:
- bg-gradient-to-r      (Right) - Headers, Buttons
  • from-blue-600 to-purple-600
  • from-purple-600 to-pink-600

Progress Bars:
- bg-gradient-to-r      (Right)
  • from-yellow-400 to-orange-500
```

---

## 📐 **4. SPACING & SIZING**

### **Padding & Margins**
```css
Container Padding:
- Large Screens:     p-6, p-8
- Cards:             p-4, p-6
- Compact:           p-3
- Mobile:            p-2, p-4

Gaps & Spaces:
- Grid Gaps:         gap-4, gap-6
- Flex Gaps:         space-x-2, space-x-3, space-x-4
- Section Margins:   mb-4, mb-6, mb-8
```

### **Border Radius**
```css
Components:
- Cards:             rounded-xl (12px)
- Large Cards:       rounded-2xl (16px)
- Buttons:           rounded-lg (8px)
- Badges:            rounded-full (circle)
- Icons:             rounded-lg (8px)
- Avatar:            rounded-full
- Progress Bars:     rounded-full
```

### **Shadows**
```css
Elevation Levels:
- Subtle:            shadow-sm
- Default:           shadow-lg
- Elevated:          shadow-xl
- Maximum:           shadow-2xl

Hover Effects:
- Cards:             hover:shadow-lg
- Buttons:           hover:shadow-xl
```

---

## ✨ **5. ANIMATIONS & TRANSITIONS**

### **Framer Motion Variants**
```javascript
Fade In From Top:
initial={{ opacity: 0, y: -20 }}
animate={{ opacity: 1, y: 0 }}

Fade In From Bottom:
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}

Fade In From Left:
initial={{ opacity: 0, x: -20 }}
animate={{ opacity: 1, x: 0 }}

Fade In From Right:
initial={{ opacity: 0, x: 20 }}
animate={{ opacity: 1, x: 0 }}

Scale In:
initial={{ opacity: 0, scale: 0.9 }}
animate={{ opacity: 1, scale: 1 }}

Card Hover:
whileHover={{ scale: 1.02 }}
whileHover={{ y: -4 }}

Stagger Children:
transition={{ delay: 0.1 }}
transition={{ delay: 0.2 }}
```

### **CSS Transitions**
```css
Standard Transitions:
- transition-all
- transition-colors
- transition-transform
- transition-shadow

Durations:
- duration-200
- duration-300
- duration-500

Animations:
- animate-spin       (Loading spinners)
- animate-pulse      (Loading states)
- animate-bounce     (Attention)
```

---

## 🎯 **6. COMPONENT PATTERNS**

### **Card Components**
```jsx
Light Mode Card:
className="bg-white rounded-xl shadow-lg p-6 border"

Dark Mode Card:
className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 
           border dark:border-gray-700"

Gradient Card:
className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 
           backdrop-blur-lg border border-purple-500/20 rounded-xl p-6"

Slate Theme Card:
className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 
           backdrop-blur-lg border border-purple-500/20 rounded-xl p-6"
```

### **Button Patterns**
```jsx
Primary Button:
className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 
           text-white rounded-lg font-semibold 
           hover:from-purple-700 hover:to-pink-700 
           transition-colors shadow-lg hover:shadow-xl"

Secondary Button:
className="px-6 py-3 bg-white/10 hover:bg-white/20 
           text-white rounded-lg font-semibold transition-colors"

Dark Mode Button:
className="px-4 py-2 bg-gray-200 dark:bg-gray-700 
           text-gray-700 dark:text-gray-300 
           rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 
           transition-colors"

Icon Button:
className="p-2 bg-white/10 hover:bg-white/20 
           rounded-lg transition-colors"
```

### **Input Fields**
```jsx
Standard Input:
className="w-full px-3 py-2 
           border border-gray-300 dark:border-gray-600 
           rounded-lg 
           bg-white dark:bg-gray-700 
           text-gray-900 dark:text-white 
           focus:ring-2 focus:ring-blue-500 focus:border-transparent"

Search Input:
className="w-full pl-12 pr-4 py-4 
           bg-white/5 border border-gray-600 
           rounded-xl text-white placeholder-gray-400 
           focus:outline-none focus:border-purple-500"
```

### **Tab Navigation**
```jsx
Active Tab:
className="px-6 py-3 rounded-lg font-semibold 
           bg-gradient-to-r from-purple-600 to-pink-600 text-white"

Inactive Tab:
className="px-6 py-3 rounded-lg font-semibold 
           bg-white/5 text-gray-400 hover:bg-white/10 
           dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
```

### **Avatar/Profile Pictures**
```jsx
User Avatar (Gradient Initials):
className="w-12 h-12 
           bg-gradient-to-br from-purple-500 to-pink-500 
           rounded-full flex items-center justify-center 
           text-white font-bold"

Alternative Avatars:
- from-blue-500 to-purple-500
- from-green-500 to-teal-500
- from-orange-500 to-red-500
```

### **Badge Components**
```jsx
Status Badge:
className="px-3 py-1 
           bg-blue-100 dark:bg-blue-900/30 
           text-blue-800 dark:text-blue-400 
           rounded-full text-sm font-semibold"

Feature Badge:
className="px-3 py-1.5 
           bg-purple-100 dark:bg-purple-900/30 
           text-purple-700 dark:text-purple-300 
           rounded-full text-xs font-medium 
           border border-purple-200 dark:border-purple-700"
```

---

## 🎬 **7. EFFECTS & SPECIAL FEATURES**

### **Backdrop Effects**
```css
Glassmorphism:
- backdrop-blur-sm
- backdrop-blur-lg
- bg-white/5
- bg-white/10
- bg-black/50
```

### **Opacity Variations**
```css
Backgrounds:
- bg-purple-500/10    (10% opacity)
- bg-purple-500/20    (20% opacity)
- bg-purple-900/30    (30% opacity)

Borders:
- border-purple-500/20
- border-gray-700/50
```

### **Hover States**
```css
Cards:
hover:bg-gray-100 dark:hover:bg-gray-700
hover:shadow-lg
hover:scale-1.02
hover:y--4

Buttons:
hover:bg-gray-300 dark:hover:bg-gray-600
hover:from-purple-700 hover:to-pink-700
hover:shadow-xl

Links:
hover:text-purple-400
hover:text-blue-400
```

### **Progress Bars**
```jsx
Container:
className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"

Progress Fill:
className="bg-gradient-to-r from-yellow-400 to-orange-500 
           h-2 rounded-full transition-all duration-500"
style={{ width: `${percentage}%` }}
```

---

## 🎨 **8. ICON COLORS**

### **Contextual Icon Colors**
```css
Success/Positive:
- text-green-400
- text-green-500
- text-emerald-400

Warning/Attention:
- text-yellow-400
- text-orange-400
- text-orange-600 dark:text-orange-400

Error/Important:
- text-red-400
- text-red-500

Info/Primary:
- text-blue-400
- text-purple-400
- text-cyan-400

Wellness/Health:
- text-pink-400
- text-purple-400

Achievement:
- text-yellow-400 (trophies, medals)

Neutral:
- text-gray-400
- text-gray-500
```

---

## 📱 **9. RESPONSIVE DESIGN**

### **Grid Layouts**
```jsx
Responsive Grid:
className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
className="grid lg:grid-cols-3 gap-6"

Two Column Layout (Main + Sidebar):
className="grid lg:grid-cols-3 gap-6"
  Main Content: className="lg:col-span-2"
  Sidebar:      className="lg:col-span-1"
```

### **Breakpoint Utilities**
```css
Mobile First Approach:
- Default:           Base styles
- md:               Tablet (768px+)
- lg:               Desktop (1024px+)
- xl:               Large Desktop (1280px+)

Hidden/Shown:
- hidden md:block   (Hide on mobile, show on tablet+)
- block md:hidden   (Show on mobile, hide on tablet+)
```

---

## 🌙 **10. DARK MODE IMPLEMENTATION**

### **Tailwind Config**
```javascript
// tailwind.config.js
export default {
  darkMode: 'class', // Class-based dark mode
  // ...
}
```

### **Dark Mode Patterns**
```jsx
Always Applied Together:
bg-white dark:bg-gray-800
text-gray-900 dark:text-white
border-gray-200 dark:border-gray-700

Page Backgrounds:
bg-gradient-to-br from-purple-50 to-blue-50 
dark:from-gray-900 dark:to-gray-800

Transparent Overlays:
bg-white/10 (works in both modes)
backdrop-blur-lg (works in both modes)
```

---

## 📦 **11. COMMON COMPONENT CLASSES**

### **Headers**
```jsx
Page Header:
className="text-4xl font-bold text-white mb-2 
           flex items-center gap-3"

Section Header:
className="text-2xl font-bold 
           text-gray-900 dark:text-white mb-4"

Card Header:
className="text-lg font-bold 
           text-gray-900 dark:text-white mb-4 
           flex items-center space-x-2"
```

### **Typography**
```jsx
Body Text:
className="text-gray-700 dark:text-gray-300"

Muted Text:
className="text-gray-600 dark:text-gray-400"

Small Text:
className="text-sm text-gray-500 dark:text-gray-400"

Extra Small:
className="text-xs text-gray-400"
```

### **Flex Utilities**
```jsx
Center Everything:
className="flex items-center justify-center"

Space Between:
className="flex items-center justify-between"

Vertical Stack:
className="flex flex-col space-y-4"

Horizontal Row:
className="flex items-center space-x-3"
```

---

## 🎪 **12. THEME VARIATIONS**

### **Purple Theme (Main)**
```css
Background:  bg-gradient-to-br from-purple-50 to-blue-50
Dark:        dark:from-gray-900 dark:to-gray-800
Accents:     purple-500, purple-600, pink-500, pink-600
```

### **Slate Theme (Alternative)**
```css
Background:  from-slate-900 via-purple-900 to-slate-900
Cards:       from-purple-500/10 to-pink-500/10
Borders:     border-purple-500/20
```

### **Wellness Theme (Pink/Purple)**
```css
Primary:     from-pink-500 to-purple-500
Light:       from-pink-50 to-purple-50
Dark:        dark:from-pink-900/20 dark:to-purple-900/20
```

---

## 🚀 **13. ANIMATION LIBRARY**

### **Framer Motion Setup**
```javascript
import { motion, AnimatePresence } from 'framer-motion';

// Container Variants
const containerVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

// Stagger Children
const containerVariants = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Item Variants
const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};
```

### **Common Animations**
```jsx
Fade In:
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
/>

Slide Up:
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 }}
/>

Scale Hover:
<motion.div
  whileHover={{ scale: 1.02 }}
  transition={{ type: "spring", stiffness: 300 }}
/>

Modal Animation:
<motion.div
  initial={{ scale: 0.9, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  exit={{ scale: 0.9, opacity: 0 }}
/>
```

---

## 🎯 **14. STICKY & FIXED ELEMENTS**

```css
Sticky Sidebar:
className="sticky top-6"

Fixed Header:
className="fixed top-0 left-0 right-0 z-50"

Z-Index Layers:
- z-10:   Cards, elevated content
- z-40:   Dropdown menus
- z-50:   Modals, overlays
```

---

## 📋 **15. QUICK REFERENCE**

### **Most Used Gradient Combos**
1. `from-purple-600 to-pink-600` - Primary CTA
2. `from-blue-600 to-purple-600` - Secondary CTA
3. `from-purple-500/10 to-pink-500/10` - Subtle card backgrounds
4. `from-slate-900 via-purple-900 to-slate-900` - Full page dark backgrounds
5. `from-yellow-400 to-orange-500` - Progress bars, XP

### **Dark Mode Essentials**
```css
Container:   bg-white dark:bg-gray-800
Border:      border-gray-200 dark:border-gray-700
Text:        text-gray-900 dark:text-white
Secondary:   text-gray-600 dark:text-gray-400
Input:       bg-white dark:bg-gray-700
Hover:       hover:bg-gray-100 dark:hover:bg-gray-700
```

### **Icon Library**
```javascript
import { 
  Trophy, Star, Medal, Award, Crown,    // Achievements
  Heart, Brain, Activity, Flame,        // Wellness
  Users, UserPlus, MessageCircle,       // Social
  BookOpen, GraduateCapCircle,          // Education
  Clock, Calendar, TrendingUp           // Progress
} from 'lucide-react';
```

---

## 🎨 **16. COPY-PASTE TEMPLATES**

### **Card Template**
```jsx
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border dark:border-gray-700">
  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
    Title Here
  </h3>
  <p className="text-gray-600 dark:text-gray-400">
    Content here
  </p>
</div>
```

### **Button Template**
```jsx
<button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 
                   text-white rounded-lg font-semibold 
                   hover:from-purple-700 hover:to-pink-700 
                   transition-colors shadow-lg hover:shadow-xl">
  Click Me
</button>
```

### **Avatar Template**
```jsx
<div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 
                rounded-full flex items-center justify-center 
                text-white font-bold text-xl">
  AB
</div>
```

### **Input Template**
```jsx
<input
  type="text"
  className="w-full px-3 py-2 
             border border-gray-300 dark:border-gray-600 
             rounded-lg 
             bg-white dark:bg-gray-700 
             text-gray-900 dark:text-white 
             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  placeholder="Enter text..."
/>
```

---

## ✅ **Summary**

This design system uses:
- **Tailwind CSS** for utility-first styling
- **Framer Motion** for animations
- **Lucide React** for icons
- **Class-based dark mode** with `dark:` prefix
- **Purple/Pink/Blue** as primary brand colors
- **Gradient backgrounds** with blur effects
- **Consistent spacing** (p-4, p-6, gap-4, gap-6)
- **Rounded corners** (rounded-xl, rounded-2xl)
- **Shadow elevations** (shadow-lg, shadow-xl)
- **Responsive grid** layouts
- **Smooth transitions** on all interactive elements

---

**Version**: 1.0  
**Last Updated**: October 2025  
**Platform**: EduKanban Educational Platform  
**Framework**: React + Tailwind CSS + Framer Motion
