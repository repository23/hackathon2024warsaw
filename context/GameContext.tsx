import { useToast } from "@chakra-ui/react";
//import { useContract } from "@thirdweb-dev/react";
import { useZkVerify } from "./useZkVerify";
import React, { useEffect, useState } from "react";
import vkey from "../circuits/mastermind/keys/verification_key.json";
import random from "seedrandom";

const CODE_SIZE = 4;
const NUM_ROWS = 10;
const NUM_COLORS = 8;

export const COLORS: Record<number, Record<string, string>> = {
  0: {
    name: "red",
    body: "red.400",
    border: "red.500",
  },
  1: {
    name: "orange",
    body: "orange.400",
    border: "orange.500",
  },
  2: {
    name: "yellow",
    body: "yellow.400",
    border: "yellow.500",
  },
  3: {
    name: "green",
    body: "green.400",
    border: "green.500",
  },
  4: {
    name: "cyan",
    body: "cyan.400",
    border: "cyan.500",
  },
  5: {
    name: "blue",
    body: "blue.400",
    border: "blue.500",
  },
  6: {
    name: "purple",
    body: "purple.400",
    border: "purple.500",
  },
  7: {
    name: "pink",
    body: "pink.400",
    border: "pink.500",
  },
  8: {
    name: "empty",
    body: "#111",
    border: "#333",
  },
};

type GameAction =
  | {
      type: "NEW_GAME";
    }
  | {
      type: "CHOOSE_COLOR";
      payload: {
        color: number;
      };
    }
  | {
      type: "EDIT_ROW";
      payload: {
        row: number;
        index: number;
        value: number;
      };
    }
  | {
      type: "SUBMIT_ROW";
      payload: {
        row: number;
      };
    }
  | {
      type: "SUBMIT_GAME";
      payload: {
        proof: ZKProof;
      }
    }
  | {
      type: "VERIFY_GAME";
      payload: {
        valid: boolean;
      };
    }
  | {
      type: "ADD_LOG";
      payload: Log;
    }
  | {
      type: "SET_LOADING";
      payload: {
        loading: boolean;
      };
    }
  ;

type ZKProof = {
  proof: {
    pi_a: string[3];
    pi_b: string[3][2];
    pi_c: string[3];
    protocol: string;
    curve: string;
  };
  publicSignals: string[];
  calldata: [string[2], string[2][2], string[2], string[8]];
};

type Row = {
  guess: number[];
  partial: number;
  correct: number;
  submitted: boolean;
};

type Log = {
  title: string;
  body?: string;
};

type Game = {
  id: number;
  board: Row[];
  focusedRow: number;
  color: number;
  solved: boolean;
  valid: boolean;
  verifiable: boolean;
  verified: boolean;
  isLoading: boolean;
  logs: Log[];
  proof?: ZKProof;
  score?: number;
};

type GameContextValue = {
  game: Game;
  accountAddr: string | null;
  setAccountAddr: React.Dispatch<React.SetStateAction<string | null>>;
  setWalletSource: React.Dispatch<React.SetStateAction<string | null>>;
  dispatch: React.Dispatch<GameAction>;
  submitRow: (row: number) => void;
  submitGame: () => void;
  verify: () => void;
};

interface TxInfo {
  domainId?: number;
  aggregationId?: number;
  blockHash?: string;
  txHash?: string;
  statement?: string | null;
  status: string;
}

const DEFAULT_GAME = {
  id: Math.floor(Math.random() * 0xDEADBEEF),
  board: Array.from(Array(NUM_ROWS).keys()).map(() => ({
    guess: Array(CODE_SIZE).fill(NUM_COLORS),
    partial: 0,
    correct: 0,
    submitted: false,
  })),
  color: 0,
  solved: false,
  valid: false,
  verifiable: false,
  verified: false,
  isLoading: false,
  logs: [],
  focusedRow: -1,
};

const GameContext = React.createContext<GameContextValue>(
  {} as GameContextValue
);

export function useGame() {
  return React.useContext(GameContext);
}

const getSolution = (seed: number) => {
  const generator = random(seed.toString());
  const solution = [];
  for (let i = 0; i < CODE_SIZE; i++) {
    solution.push(Math.floor(generator.quick() * NUM_COLORS));
  }
  return solution;
}

const gameReducer = (state: Game, action: GameAction) => {
  const updatedState: Game = JSON.parse(JSON.stringify(state));
  switch (action.type) {
    case "NEW_GAME":
      const game: Game = JSON.parse(JSON.stringify(DEFAULT_GAME));
      game.id = Math.floor(Math.random() * 0xDEADBEEF);
      game.color = NUM_COLORS;
      game.solved = false;
      game.valid = false;
      game.verified = false;
      game.isLoading = false;
      game.logs = [];
      game.focusedRow = -1;
      game.proof = undefined;
      game.score = undefined;
      return game;
    case "CHOOSE_COLOR":
      updatedState.color = action.payload.color;
      return updatedState;
    case "EDIT_ROW":
      updatedState.board[action.payload.row].guess[action.payload.index] = state.color;
      updatedState.focusedRow = action.payload.row;
      return updatedState;
    case "SUBMIT_ROW":
      const solution = getSolution(state.id);
      const colorCountOfGuess = Array(NUM_COLORS + 1).fill(0);
      const colorCountOfSolution = Array(NUM_COLORS + 1).fill(0);

      let correct = 0;
      for (let i = 0; i < CODE_SIZE; i++)
        if (state.board[action.payload.row].guess[i] == solution[i])
          correct++;
        else {
          colorCountOfGuess[state.board[action.payload.row].guess[i]]++;
          colorCountOfSolution[solution[i]]++;
        }
      updatedState.board[action.payload.row].correct = parseInt(correct);

      let partial = 0;
      for (let i = 0; i < NUM_COLORS; i++)
        partial += Math.min(colorCountOfGuess[i], colorCountOfSolution[i]);
      updatedState.board[action.payload.row].partial = parseInt(partial);

      updatedState.board[action.payload.row].submitted = true;
      if (updatedState.board[action.payload.row].correct === CODE_SIZE) {
        updatedState.solved = true;
      }
      updatedState.focusedRow = -1;
      return updatedState;
    case "SUBMIT_GAME":
      updatedState.proof = action.payload.proof;
      updatedState.score = parseInt(action.payload.proof.publicSignals[0]);
      updatedState.focusedRow = -1;
      return updatedState;
    case "SUBMISSION_DONE":
      updatedState.verifiable = action.payload.verifiable;
      return updatedState;
    case "VERIFY_GAME":
      updatedState.verified = true;
      updatedState.valid = action.payload.valid;
      updatedState.focusedRow = -1;
      return updatedState;
    case "ADD_LOG":
      updatedState.logs.push(action.payload);
      return updatedState;
    case "SET_LOADING":
      updatedState.isLoading = action.payload.loading;
      return updatedState;
  }
};

const GameProvider: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const toast = useToast();
  /*const { contract } = useContract(
    process.env.NEXT_PUBLIC_VERIFYING_CONTRACT_ADDRESS
  );*/
  const [game, dispatch] = React.useReducer(
    gameReducer,
    JSON.parse(JSON.stringify(DEFAULT_GAME))
  );

  const [ accountAddr, setAccountAddr ] = useState<string | null>(null);
  const [ walletSource, setWalletSource ] = useState<string | null>(null);
  const { onVerifyProof } = useZkVerify(null);

  // The error "destroy is not a function" occurs with this useEffect
  /*useEffect(async () => {
    if (game.solved) {
      toast({
        title: "Congratulations, you broke the code!",
        status: "success",
      });
    }
    return () => {};
  }, [game.solved, toast]);*/

  async function submitRow(row: number) {
    const guessText = game.board[row].guess
      .map((color: number) => COLORS[color].name)
      .join(", ");
    dispatch({
      type: "ADD_LOG",
      payload: {
        title: `Sending guess ${
          row + 1
        } [${guessText}] to be checked by the code maker`,
      },
    });

    dispatch({
      type: "SUBMIT_ROW",
      payload: { row },
    });
  }

  async function submitGame() {
    dispatch({
      type: "SET_LOADING",
      payload: {
        loading: true,
      },
    });

    const guessData = {
      guess: game.board.map((thisRow: Row) => thisRow.guess).reduce((_, __) => _.concat(__), []),
      numPartial: game.board.map((thisRow: Row) => thisRow.partial),
      numCorrect: game.board.map((thisRow: Row) => thisRow.correct),
    };
    
    try {
      const res = await fetch("/api/proof", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ guessData, id: game.id }),
      });

      const data = await res.json();

      dispatch({
        type: "SUBMIT_GAME",
        payload: {
          proof: data,
        }
      });

      dispatch({
        type: "ADD_LOG",
        payload: {
          title: `Received zkSNARK proof from the code maker of the game, with a score of ${data.publicSignals[0]}`,
          body: `${JSON.stringify(data.proof)}`
        },
      });

      dispatch({
        type: "SUBMISSION_DONE",
        payload: {
          verifiable: true,
        },
      });
    } catch (error: unknown) {
      dispatch({
        type: "ADD_LOG",
        payload: {
          title: `Error in zkSNARK proof generation of this game: ${(error as Error).message}`,
        },
      });

      dispatch({
        type: "SUBMISSION_DONE",
        payload: {
          verifiable: false,
        },
      });
    } finally {
      dispatch({
        type: "SET_LOADING",
        payload: {
          loading: false,
        },
      });
    }
  }

  async function verify() {
    const proof = game.proof;

    dispatch({
      type: "ADD_LOG",
      payload: {
        title: `Verifying proof of gameplay authenticated by hash ${proof.publicSignals[1]}`,
      },
    });

    dispatch({
      type: "SET_LOADING",
      payload: {
        loading: true,
      },
    });

    try {
      const { events } = await onVerifyProof(
        proof.proof,
        proof.publicSignals,
        vkey,
        walletSource,
        accountAddr
      );
    
      events.on('error', (error: Error) => {
        console.error('Error in proof transaction processing:', error);
        //throw error;
      });

      events.on('includedInBlock', (eventData) => {
        console.log('Proof transaction is included in block:', eventData);
      });

      events.on('finalized', (eventData) => {
        console.log('Proof transaction processing is finalized:', eventData);
        const finalizedTx: TxInfo = {
          ...eventData,
          txHash: eventData.txHash ? eventData.txHash : eventData.transactionHash,
        };
        
        const valid = !!(finalizedTx && finalizedTx.status == "finalized" && finalizedTx.blockHash && finalizedTx.txHash)
          
        dispatch({
          type: "VERIFY_GAME",
          payload: {
            valid: valid,
          },
        });

        dispatch({
          type: "ADD_LOG",
          payload: {
            title: valid
              ? 'Proof succesfully verified by contract!'
              : 'Contract rejected, proof is invalid!',
          },
        });
        
        fetch("/api/leaderboard", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            account: accountAddr,
            score: game.score,
            verified: valid,
            gameplayHash: game.proof.publicSignals[1]
          }),
        });

        dispatch({
          type: "SET_LOADING",
          payload: {
            loading: false,
          },
        });
      });
    } catch (error: unknown) {
      dispatch({
        type: "ADD_LOG",
        payload: {
          title: `Error in proof verification process: ${(error as Error).message}`,
        },
      });
      
      dispatch({
        type: "VERIFY_GAME",
        payload: {
          valid: false,
        },
      });

      dispatch({
        type: "SET_LOADING",
        payload: {
          loading: false,
        },
      });
    }
  }

  return (
    <GameContext.Provider value={{ game, dispatch, accountAddr, setAccountAddr, walletSource, setWalletSource, submitRow, submitGame, verify }}>
      {children}
    </GameContext.Provider>
  );
};

export default GameProvider;
