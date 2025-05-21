# Verifiable zk-mastermind with leaderboard

We convert the zk-mastermind game into a zkVerify-compatible mode, redesign its zk proof circuit to keep all the details of the gameplay in secret and evaluate its excellence with a score. We also aim to record the high scores and show them in a hall of fame page.

The author of the original project is [adam-maj](https://github.com/adam-maj/zk-mastermind). We launched this project in Sept. 2024 at [EthWarsaw Hackathon](https://devfolio.co/projects/zkmastermindetherwarsawedition-d904) with the help of the core team of ZkVerify.

![Verifiable zkMastermind](/public/verifiable_mastermind.png)

## Added features

Compared with the original game, we import the zkVerify library to handle the verification of the zk proof of a gameplay. Once the player (act as the code breaker) manages to break the code, it can generate a zk proof of the authenticity of its gameplay (consisted of all the checked guesses) and then submit the proof via a zkVerify session to verify it. The proof conceals not only the correct code but also every guess of the gameplay into private signals, which ensures the uncopiablity of a high-scored gameplay listed on the leaderboard. The score of a successful code breaking is defined as the number of its unused guess rounds plus 1.

As mastermind is a very simple game with an extremely small-scale game state, we directly compress the whole gameplay data as a Poseidon hash and reproduce its calculation in a Circum circuit that generates Groth16 proofs. For more complicated and larger-state games, such a method results in an unacceptably massive zk-circuit and crashes the circuit compiler, thus, it requires a more effective zk-circuit design for gameplay data authentication -- WHICH IS OUR MAJOR R&D TASK IN THIS PROJECT.

## Todos

- Due to ZkVerify testnet upgrade, currently the ZkVerify session cannot make connection to the latest Volta testnet via NPM Talisman component. I have to ask for the correct API related to it;
- A bug still exists in the initial rendering and useEffect rerendering, which causes a connection error to read the actual leaderboard database, so the leaderboard displayed hall of fame page is just a sample. This issue will be raised to our UI/UX collaborator.

## Team members & roles

- RSSCNo1: The initializer and main contributor of the zkVerify gaming leaderboard project
- Barnaba Pawelczak: EthWarsaw 2024 hackathon participant who contributed to frontend designing, debugging and presentation slides for the hackathon
- Some UI/UX collaborators (adding soon)

