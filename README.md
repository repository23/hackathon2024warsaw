# Verifiable zk-mastermind

We convert the zk-mastermind game into a zkVerify-compatible mode. The author of the original project is [adam-maj](https://github.com/adam-maj/zk-mastermind)

## Added features

Compared with the original game, we import the zkVerify library to handle the verification of any submitted guess. Once the player (act as the code breaker) orders to verify a previous guess, the zk proof and relevant public signals of that guess are displayed at the frontend, and a zkVerify session is triggered to verify that proof.

Our modification on the original repo comprises:

- `components/Game.tsx`: the gameplay frontend, we created two additional textboxes to output the zk proof and list of public signals of a submitted guess once it requires verification.
- `context/GameContext.tsx`: the React context holding game states, in which we applied the zkVerify hook to operate a proof verification by zkVerify.
- `context/useZkVerify.ts`: the zkVerify hook, almost directly derived from the sample sudoku project.

## Challenges

## Team members & roles

- Barnaba Pawelczak: frontend designing, debugging and presentation slides
- RSSC No1: base project exploration, programming, local environment configuration and testing

