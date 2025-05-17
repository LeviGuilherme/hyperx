# HyperX

<p align="center">
  <img src="https://img.shields.io/badge/htmx-compatible-blue" alt="HTMX Compatible">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License: MIT">
  <img src="https://img.shields.io/badge/typescript-powered-blue" alt="TypeScript Powered">
</p>

## 🚀 Overview

HyperX is a modular extension library for [HTMX](https://htmx.org/) that supercharges your web applications with powerful features. It enables seamless JSON rendering, conditional content display, and component systems while maintaining HTMX's lightweight philosophy.

Think of HyperX as the perfect companion to HTMX, adding the extra functionality you need without the bloat of a full framework.

## ✨ Features

- **🔄 JSON Rendering** - Transform JSON responses into HTML using template elements
- **🔍 Template System** - Use templates as interfaces to organize fetched data on your page
- **⚡ Self-Loading Templates** - Templates that automatically load their data on page load
- **🧩 Component System** - Create reusable UI components (coming soon)
- **🔀 Conditional Rendering** - Show/hide elements based on conditions (coming soon)

## 🛠️ IDE Support

HyperX `.hpx` files are HTML templates with additional features. Here's how to get proper syntax highlighting and IntelliSense in your IDE:

### VS Code

1. Install the [HTMX extension](https://marketplace.visualstudio.com/items?itemName=phoenisx.cssvar)
2. You can either:
   - Copy the contents of [vscode-settings.json](vscode-settings.json) to your VS Code settings (File > Preferences > Settings > Open Settings (JSON))
   - Or manually add these settings:

```json
{
  "files.associations": {
    "*.hpx": "html"
  },
  "emmet.includeLanguages": {
    "hpx": "html"
  }
}
```

### WebStorm/IntelliJ

1. Go to `File` > `Settings` > `Editor` > `File Types`
2. In "Recognized File Types", select "HTML"
3. In "Registered Patterns", add `*.hpx`
4. Click "OK" to save

### Other Editors

Most modern editors allow you to associate `.hpx` files with HTML syntax highlighting. Look for "file associations" or "language modes" in your editor's settings.

## 📦 Installation

```bash
npm install hyperx-js
```

Or include it directly in your HTML:

```html
<!-- Load HTMX first -->
<script src="https://unpkg.com/htmx.org@1.9.5"></script>
<!-- Then load HyperX (it will auto-initialize) -->
<script src="https://unpkg.com/hyperx-js@latest/dist/hyperx.js"></script>
```

## 🛠️ Usage

### JSON Rendering with Templates

HyperX allows you to use HTML templates as interfaces for your JSON data. When HTMX receives a JSON response, HyperX will automatically render it using the specified template.

```html
<!-- Button targeting the template directly -->
<button hx-get="https://jsonplaceholder.typicode.com/users" hx-target="#users-template">
    Load Users
</button>

<!-- Template element that will be used for rendering content -->
<template id="users-template">
    <div class="user">
        <strong>{{ name }}</strong> - {{ email }}
    </div>
</template>
```

The template uses a simple mustache-style syntax (`{{ property }}`) to interpolate JSON properties.

### Self-Loading Templates

Templates can load their own data on page load:

```html
<!-- Template with HTMX attributes will auto-load on page load -->
<template id="posts-template" hx-get="https://jsonplaceholder.typicode.com/posts/1" hx-trigger="load">
    <div class="post">
        <h4>{{ title }}</h4>
        <p>{{ body }}</p>
    </div>
</template>
```

### Conditional Rendering (Coming Soon)

```html
<!-- Element will only show if user.isAdmin is true -->
<div hx-if="user.isAdmin">
    <button>Admin Actions</button>
</div>
```

### Component System (Coming Soon)

```html
<!-- Register a reusable component -->

<!-- users-list.hpx -->
<template>
    <div class="user-list">
        <user-card hx-data-prop="user"></user-card>
        <user-address hx-data-prop="address"></user-address>
    </div>
</template>

<!-- user-card.hpx -->
<template>
    <div class="user-card">
        <img src="{{ avatar }}" alt="{{ name }}">
        <h3>{{ name }}</h3>
        <p>{{ bio }}</p>
    </div>
</template>

<!-- user-address.hpx -->
<template>
    <div class="user-address">
        <p>{{ street }}</p>
        <p>{{ city }}</p>
        <p>{{ state }}</p>
    </div>
</template>

<!-- Use the component -->
<button hx-get="https://jsonplaceholder.typicode.com/users" hx-target="users-list">
    Load Users
</button>

<users-list hx-data="users"></users-list>
```

## 🧠 Philosophy

HyperX is built on the same philosophy as HTMX: simplicity, power, and respect for HTML as a hypermedia. Templates in HyperX serve as interfaces that organize how data should be presented, similar to how interfaces in programming languages define structure.

By treating templates as interfaces for your data, you create a clean separation between data fetching (HTMX) and data presentation (HyperX).

## 🌐 Browser Support

HyperX works in all modern browsers and IE11 with appropriate polyfills.

## 🤝 Contributing

Contributions are welcome! HyperX is designed to be modular, making it easy to add new extensions.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [HTMX](https://htmx.org/) - For the incredible hypermedia-driven approach
- All contributors and users of HyperX
