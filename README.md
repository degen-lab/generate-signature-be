# How to set up and run the signature generation backend

The backend is modular and supports multiple networks in the same time. It is configured for mainnet, testnet and nakamoto-testnet.

1. Set up the environment  
   i. Copy the `.env.example` file and rename it to `.env`. Fill the fields with your signer's data. The testnet fields are both for testnet and nakamoto-testnet.  
   ii. The default port used is 8080, but can be changed in the [index.ts file](https://github.com/degen-lab/generate-signature-be/blob/c0a04924df535701efefb13641394445f1d99bd9/src/index.ts#L14).  

2. Install dependencies

```
npm i
```

3. Build the backend

```
npm run build
```

4. Run the backend

```
npm run start:prod
```
