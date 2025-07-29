# Copilot Instructions for sredevopsorg-ghost-theme

## Overview

`sredevopsorg-ghost-theme` is a Ghost theme built with Tailwind CSS and Gulp. The theme follows a modular architecture, focusing on reusability and maintainability.

## Major Components

1. **HTML Templates (`*.hbs`)**: Handlebars templates define the structure of the site.
2. **CSS (`assets/css/*.css`)**: Tailwind CSS is used for styling, with custom configurations in `tailwind.config.js`.
3. **JavaScript (`assets/js/*.js`)**: Scripts are written in JavaScript and minified using Gulp.

## Data Flows

- **HTML Templates**: Rendered by Ghost, which processes Handlebars templates.
- **CSS**: Compiled from Tailwind CSS to standard CSS using PostCSS plugins.
- **JavaScript**: Bundled and minified using Gulp.

## Developer Workflows

### Build Process
To build the theme:
```bash
npm run build
```
This command compiles CSS and JavaScript files, placing them in `assets/built/`.

### Development Server
To start a development server with live reloading:
```bash
npm start
```
This command builds the theme and serves it on a local server. Changes to HTML, CSS, or JavaScript files will trigger automatic rebuilds and reloads.

### Testing
The project does not include automated tests. Manual testing is recommended for verifying changes.

## Project-Specific Conventions

1. **Tailwind CSS**: Custom configurations are defined in `tailwind.config.js`. Ensure that any new styles align with the existing theme.
2. **Gulp Tasks**: Gulp tasks are defined in `gulpfile.js`. Use `npm run build` to compile assets and `npm start` for development.

## Integration Points

- **Ghost**: The theme is designed to work with Ghost, a headless CMS. Ensure compatibility with Ghost's API and template syntax.
- **Tailwind CSS**: Custom styles should be added in `tailwind.config.js` to maintain consistency with the existing theme.

## External Dependencies

- **Node Modules**: Managed via npm. Key dependencies include Tailwind CSS, Gulp, and PostCSS plugins.
- **Ghost**: The theme is built for Ghost, a headless CMS.

## Cross-Component Communication Patterns

- **HTML Templates**: Use Handlebars to dynamically render content based on data from Ghost.
- **CSS**: Tailwind CSS classes are used throughout the theme. Ensure that new styles do not conflict with existing ones.
- **JavaScript**: Scripts interact with the DOM and handle user events. Ensure that scripts are modular and reusable.

## Key Files/Directories

- `gulpfile.js`: Defines Gulp tasks for building and serving the theme.
- `tailwind.config.js`: Contains Tailwind CSS configurations.
- `assets/css/*.css`: Source CSS files for Tailwind CSS.
- `assets/js/*.js`: JavaScript source files.
- `*.hbs` and `partials/**/*.hbs`: Handlebars templates.

## Feedback

Please review the above instructions. Let me know if any sections are unclear or incomplete, and I will iterate accordingly.