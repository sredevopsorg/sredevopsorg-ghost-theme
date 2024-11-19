# SREDevOps.org Ghost Theme

Our Ghost v5 Theme made for [SREDevOps.org](https://sredevops.org) based on Tailwind CSS v3, responsive, dark color schema, SVG icons, sidebar + footer navigation, customized tags, and recommendations pages. Highly inspired by [Priority Vision's "Aspect" Theme](https://www.priority.vision/themes/aspect/) and took many functionalities from [@TryGhost "Source" default theme](https://github.com/TryGhost/Source).

## Table of Contents

- [To Do / Roadmap](#to-do--roadmap)
- [Repo](#repo)
- [Demo](#demo)
- [Installation](#installation)
- [Features](#features)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

## To Do / Roadmap

- [x] Missing SVG Icons
- [ ] Granular internationalization using custom post templates
- [ ] Ghost Cards assets CSS Cleanup
- [ ] Migrate Tailwind classes from inline styles into stylesheets files
- ~~[ ] Improve Algolia Search~~ (Replaced with Ghost Search)
- [ ] Implement custom options

## Repo

Find the source code on [GitHub Repo](https://github.com/sredevopsorg/sredevopsorg-ghost-theme).

## Demo

Check out the live demo at [SREDevOps.org](https://sredevops.org).

## Installation

### Prerequisites

- Ensure you have Ghost installed locally. Check [how to run Ghost Locally and set up a local environment](https://ghost.org/docs/install/local/).

### Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/sredevopsorg/redevopsorg-ghost-theme.git
   ```

2. Navigate to the theme directory:

   ```bash
   cd sredevopsorg-ghost-theme
   ```

3. Install dependencies:

   ```bash
   yarn install
   ```

4. Run in development mode:

   ```bash
   yarn dev
   ```

5. Activate the theme in your Ghost admin panel or use the [Deploy Ghost Theme Action](https://github.com/sredevopsorg/sredevopsorg-ghost-theme/blob/main/.github/workflows/deploy-theme.yaml).

## Features

- Tailwind CSS based design
- Sidebar main navigation
- Dark schema
- Responsive design
- Customizable image sizes

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

All original code of this theme is licensed under the MIT License.

## Credits

- Author: Nicolás Georger [@ngeorger] - [info@sredevops.org](mailto:info@sredevops.org)
- Highly inspired by [Priority Vision's "Aspect" Theme](https://www.priority.vision/themes/aspect/)
- Took many functionalities from [@TryGhost "Source" default theme](https://github.com/TryGhost/Source)
