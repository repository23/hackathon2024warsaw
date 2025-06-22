import type { NextApiRequest, NextApiResponse } from "next";
const { buildPoseidon } = require("circomlibjs");
const snarkjs = require("snarkjs");
const ff = require("ffjavascript");
import random from "seedrandom";
import path from "path";
import fs from "fs";

// Read files so Vercel bundles them with the serverless function
fs.readFileSync(
  path.join(process.cwd(), "circuits/mastermind/keys/circuit.wasm")
);
fs.readFileSync(
  path.join(process.cwd(), "circuits/mastermind/keys/circuit_final.zkey")
);

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { guessData, id } = req.body;
  const { guess, numPartial, numCorrect } = guessData;
  const CODE_SIZE = 4;
  const NUM_ROWS = 10;
  const NUM_COLORS = 8;
  const REAL_ROWS = numPartial.length;
  if (!(REAL_ROWS <= NUM_ROWS && numCorrect.length == REAL_ROWS && guess.length == REAL_ROWS * CODE_SIZE)) {
    return res.status(400).end();
  }
  const SCORE_FACTORS = process.env.SCORE_FACTORS ? (JSON.parse(process.env.SCORE_FACTORS)).slice(0, CODE_SIZE) : [3, 8, 25, 90];

  const generator = random(id.toString());
  const solution = [];
  for (let i = 0; i < CODE_SIZE; i++) {
    solution.push(Math.floor(generator.quick() * NUM_COLORS));
  }

  const poseidon = await buildPoseidon();

  const salt = id * 42;
  let rawHash = poseidon([salt, ...solution]);
  for (let i = 0; i < NUM_ROWS; i++)
    if (i < REAL_ROWS) {
      rawHash = poseidon([rawHash, ...guess.slice(i * CODE_SIZE, (i + 1) * CODE_SIZE)]);
    } else {
      emptyGuess = Array(CODE_SIZE).fill(NUM_COLORS);
      rawHash = poseidon([rawHash, ...emptyGuess]);
      guess.concat(emptyGuess);
      numPartial.concat([0]);
      numCorrect.concat([0]);
    }
  const gameplayHash = poseidon.F.toObject(rawHash).toString();
  const inputs = {
    gameplayHash,
    guess,
    numPartial,
    numCorrect,
    solution,
    gameplaySalt: salt,
    scoreFactor: SCORE_FACTORS,
  };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    inputs,
    "circuits/mastermind/keys/circuit.wasm",
    "circuits/mastermind/keys/circuit_final.zkey"
  );

  // required to generate solidity call params
  const editedPublicSignals = ff.utils.unstringifyBigInts(publicSignals);
  const editedProof = ff.utils.unstringifyBigInts(proof);

  // Generate solidity compatible params for Verifier.sol
  const calldata = await snarkjs.groth16.exportSolidityCallData(
    editedProof,
    editedPublicSignals
  );

  return res.status(200).json({
    proof,
    publicSignals,
    calldata: JSON.parse(`[${calldata}]`),
  });
};

export default handler;
