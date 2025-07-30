# Freshdesk Custom App

A custom Freshdesk app built with the Freshworks Developer Kit (FDK) and TypeScript.

---

## Prerequisites

| Tool                  | Version  | Notes                                                |
| --------------------- | -------- | ---------------------------------------------------- |
| **Node.js**           | ≥ 18.x   | Ensure the LTS version is installed.                 |
| **Yarn**              | ≥ 1.22   | Used for package management.                         |
| **FDK CLI**           | Latest   | Freshworks Developer Kit CLI – see setup link below. |
| **Freshdesk account** | Any plan | Needed to load the app in dev mode.                  |

Install the FDK CLI by following the official guide:
[https://developers.freshworks.com/docs/guides/setup/cli-setup/](https://developers.freshworks.com/docs/guides/setup/cli-setup/)

---

## Getting Started

```bash
git clone <repo>
cd freshdesk-app

# Install dependencies
yarn install
```

---

## Development Workflow

1. **Enable developer mode in your Freshdesk account**
   - Open any page in your Freshdesk portal
   - Append `?dev=true` to the URL and refresh

2. **Start the local development servers** (two terminal windows):

   ```bash
   # Terminal 1 – FDK local server & webhook tunnel
   fdk run
   ```

   ```bash
   # Terminal 2 – TypeScript incremental build with watch mode
   npm run dev
   ```

3. **Configure runtime settings**

- **App Settings**
  - URL: [http://localhost:10001/app_settings](http://localhost:10001/app_settings)
  - Purpose: Developer-only variables (e.g. api domain)

- **Installation Settings**
  - URL: [http://localhost:10001/custom_configs](http://localhost:10001/custom_configs)
  - Purpose: Per-account values provided by the installer (iparams)

Changes are hot‑reloaded—simply save and refresh your Freshdesk tab.

---

## Packaging & Deployment

```bash
# Validate the manifest and run tests (if any)
fdk validate

# Run tests
npm run test

# Analyze code coverage
npx serve coverage

# Create a production‑ready zip (dist/<appId>.zip)
fdk pack

# Publish in the Freshdesk portal
# (Settings ➜ Support Operations ➜ Apps ➜ Upload Custom App)
```

See the [Freshworks packaging guide](https://developers.freshworks.com/docs/app-sdk/v3.0/publish/) for detailed steps on submission, review, and versioning.
