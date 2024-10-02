# Verifiable zk-mastermind with zkVerify proof verification

## How It Works

Each guess generates a proof that confirms the rules were followed.  This proof is then verified on zkVerify.

The ZK circuit does not fail if the solution is incorrect, if the rules were followed then proof generation and verification will succeed.

(i.e., the guess was evaluated correctly and the solution was not tampered with)

## Deployment

Currently, the repository is not connected to Vercel, so manual deployment is required after making changes.

Steps:

1. Install [Vercel CLI](https://vercel.com/docs/cli)

2. Create a `./.vercel/project.json` file and add the following content:

   ```json
   {
     "orgId": "your_org_id_here",
     "projectId": "your_project_id_here"
   }
   ```

3. Deploy:
   - For a preview deployment: `vercel`
   - For a production deployment: `vercel --prod`

## Added features

Compared with the original game, we import the zkVerify library to handle the verification of any submitted guess. Once the player (act as the code breaker) orders to verify a previous guess, the zk proof and relevant public signals of that guess are displayed at the frontend, and a zkVerify session is triggered to verify that proof.

The modification on the original repo comprises:

- Compile circuit.circom using Rust circom and not the deprecated circomjs.
- `components/Game.tsx`: the gameplay frontend, we created two additional textboxes to output the zk proof and list of public signals of a submitted guess once it requires verification.
- `context/GameContext.tsx`: the React context holding game states, in which we applied the zkVerify hook to operate a proof verification by zkVerify.
- `context/useZkVerify.ts`: the zkVerify hook, almost directly derived from the sample sudoku project.

