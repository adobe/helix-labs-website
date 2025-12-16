# AEM Live Labs 🧪

This is https://labs.aem.live

Experimental tooling for developing and managing AEM sites.

## ⚠️ Migration Notice

**The tools in this repository have been migrated to [adobe/helix-tools-website](https://github.com/adobe/helix-tools-website).**

The tools listed on [https://tools.aem.live/](https://tools.aem.live/) now use the code from the helix-tools-website repository. New contributions and enhancements should generally be made there unless they are specifically experimental features being tested in this labs environment.

## Environments
- Preview: https://main--helix-labs-website--adobe.aem.page/
- Live: https://main--helix-labs-website--adobe.aem.live/

## Development

### Installation

```sh
npm i
```

### Linting

```sh
npm run lint
```

### Local development

1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `helix-labs-website` directory in your favorite IDE and start coding :)
