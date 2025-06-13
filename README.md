# Explore Africa

Explore Africa is a responsive web application built with React and Tailwind CSS. It serves as a digital booking platform for accommodations and tour experiences in African safari regions.

## Features

- Interactive homepage with hero section and navigation
- Responsive layout for desktop and mobile
- Modular component architecture
- Git-based version control and collaboration setup

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **Version Control**: Git + GitHub

## Folder Structure

explore-africa/
├── public/ # Static assets
├── src/
│ ├── assets/ # Images and media
│ ├── components/ # Reusable UI components
│ ├── App.tsx # Root app component
│ ├── main.tsx # Entry point
│ └── index.css # Tailwind base styles
├── tailwind.config.js # Tailwind config
├── package.json # Project metadata and dependencies
└── README.md # Project documentation

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or later)
- [Git](https://git-scm.com/)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/MohanAre8/explore-africa.git
cd explore-africa

2.	Install dependencies:
  npm install

3.	Run the development server:
  npm run dev

Your application should now be running at http://localhost:##
```

Contributing

We use a branch-protected workflow. To contribute: 1. Create a new branch:
git checkout -b feature/my-feature-name 2. Make your changes and commit:
git add .
git commit -m "Describe your change" 3. Push your branch:
git push origin feature/my-feature-name 4. Create a Pull Request (PR) from GitHub. Only after review and approval will changes be merged into main.

```

```

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    "react-x": reactX,
    "react-dom": reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs["recommended-typescript"].rules,
    ...reactDom.configs.recommended.rules,
  },
});
```
