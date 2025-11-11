# AEM Live Labs 🧪

This is https://labs.aem.live

Experimental tooling for developing and managing AEM sites.

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

### Image Identity

`Image identity` features require ML models that are not part of this repository as they cannot be published on the internet (i.e. commited to an Helix repo). To demo one has to run helix-labs locally with the models present on the local machine.


1. Check out this repo
1. Create a `models/` directory in the root of the project
1. Get the model files in onnx format. These are Adobe-internal and distributed outside this repo.
1. Copy the model files into the `models/` directory
1. Run `aem up`
1. Go to
   - <http://localhost:3000/tools/asset-identity/>
   - <http://localhost:3000/tools/image-audit/> (enable `Advanced Image Identity`)
