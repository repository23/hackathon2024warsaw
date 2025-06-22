# Verifiable zk-Mastermind with leaderboard

We convert the zk-Mastermind game into a ZkVerify-compatible mode, redesign its ZK proof circuit to keep all the details of the gameplay in secret and evaluate its excellence with a score. We also aim to collect the top-scoring gameplays and show them in a "Hall of Fame" page.

The author of the original project is [adam-maj](https://github.com/adam-maj/zk-mastermind). We launched this project in Sept. 2024 at [EthWarsaw Hackathon](https://devfolio.co/projects/zkmastermindetherwarsawedition-d904), and completed the design of ZK-evaluation circuit and the function of leaderboard in Jun. 2025, with the help of the dev team of ZkVerify.

![Verifiable zkMastermind](/public/ZKVerifiableMastermind.png)

## Added features

Compared with the original game, we import the [ZkVerifyJS](https://www.npmjs.com/package/zkverifyjs) library to handle the verification of the zk proof of a gameplay. Once the player (act as the code breaker) manages to break the code, it can click the "proof" button on the page to generate a zk proof of the authenticity and excellence of its gameplay, which consisted of all the checked guesses, and then click the "zkVerify" button to submit the proof for on-chain (ZkVerify Volta testnet) verification. The proof conceals not only the correct code but also every guess of the gameplay into private signals, which ensures every high-score gameplay listed on the leaderboard is trustworthy and uncounterfeitable.

The score of a successful code breaking gameplay is defined as
$$\sum_{j=1}^{L_C} \delta(j) Fib(R_{max} - R(j) + 2)$$
in which $L_C$ is the code length (4 by default), $R_{max}$ is the maximum guess round (10 by default), $\delta(1..L_C)$ are the score factors of each number of correct matches, $R(j)$ notes the earliest guess round that reaches at least $j$ correct matches, and $Fib()$ means the Fibonacci sequence. For instance, in the gameplay depicted above, if the game configures every score factors as $(3, 8, 25, 90)$, then the gameplay is evaluated with a score of $55 * 3 + 55 * 8 + 13 * 25 + 5 * 90 = 1380$.

As mastermind is a very simple game with an extremely small-scale game state, we directly compress the whole gameplay data as a Poseidon hash and reproduce its calculation in a Circum circuit that generates Groth16 proofs. For more complicated and larger-state games, such a method results in an unacceptably massive zk-circuit and crashes the circuit compiler, thus, it requires a more effective zk-circuit design for gameplay data authentication -- WHICH IS OUR MAJOR R&D TASK IN THIS PROJECT.

## Gameplay data: window local storage or local database

Currently, our game runs locally and supports two different storage modes of gameplay data as the source of leaderboard: storing at the browser's local storage (client-side only) or storing in a local database ``db/scores.json``. Set the client-side environment variable ``NEXT_PUBLIC_LEADERBOARD_DB`` as ``localStorage`` to enable the storing mode of window local storage, otherwise it sets the storing mode of local database by default.

## Team members & roles

- RSSCNo1: The initializer and main contributor of the zkVerify gaming leaderboard project
- Barnaba Pawelczak: EthWarsaw 2024 hackathon participant who contributed to frontend designing, debugging and presentation slides for the hackathon
- Some UI/UX collaborators (adding soon)

