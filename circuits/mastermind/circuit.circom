pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/gates.circom";

template ValidColor(numColors) {
  signal input color;
  signal output out;

  component isValid = LessThan(4);
  isValid.in[0] <== color;
  isValid.in[1] <== numColors;

  out <== isValid.out;
}

template Mastermind(codeSize, numRows, numColors) {
  // ================== ASSERTIONS =================
  assert(codeSize <= 8); // No more than 8 possible values in code
  assert(numRows <= 32); // No more than 32 guess rounds as maximum
  assert(numColors <= 16); // No more that 16 possible colors
  assert(codeSize <= numRows); // No more possible values than guess rounds
  assert(codeSize <= numColors); // No more possible values than colors

  // ============= PUBLIC INPUT SIGANLS ============
  signal input gameplayHash; // Currently the hash of the breakers gameplay acts as authentication

  // ============ PRIVATE INPUT SIGNALS ============
  signal input guess[numRows * codeSize]; // The players guess, aligned by round
  signal input numPartial[numRows]; // The number of partial matches (correct color but incorrect location) of each guess
  signal input numCorrect[numRows]; // The number of correct matches (correct color and correct location) of each guess
  signal input solution[codeSize]; // The game masters private solution
  signal input gameplaySalt; // The game masters private salt for the gameplay hash calculation

  // ================ OUTPUT SIGNALS ===============
  signal output score; // The score of the gameplay

  component guessColorsValid[numRows * codeSize];
  component solutionColorsValid[codeSize];

  // Verify that guess and solution have valid colors
  for (var i = 0; i < codeSize; i++) {
    for (var j = 0; j < numRows; j++) {
      guessColorsValid[j * codeSize + i] = ValidColor(numColors);
      guessColorsValid[j * codeSize + i].color <== guess[j * codeSize + i];
      guessColorsValid[j * codeSize + i].out === 1;
    }
    solutionColorsValid[i] = ValidColor(numColors);
    solutionColorsValid[i].color <== solution[i];
    solutionColorsValid[i].out === 1;
  }

  component matchedForCorrect[numRows * codeSize];
  component partialEqual[numRows * codeSize * codeSize];
  component partialMatched[numRows * codeSize * codeSize];
  component matchedForPartialGuess[numRows * codeSize * codeSize];
  component matchedForPartialSolution[numRows * codeSize * codeSize];

  var codeIdx = 0; // It always equals to (k * codeSize + i)
  for (var k = 0; k < numRows; k++) {
    var countCorrect = 0; // Count the number of correct values in this round of guess
    for (var i = 0; i < codeSize; i++) {
      matchedForCorrect[codeIdx] = IsEqual();
      matchedForCorrect[codeIdx].in[0] <== guess[codeIdx];
      matchedForCorrect[codeIdx].in[1] <== solution[i];

      countCorrect += matchedForCorrect[codeIdx].out;
      
      codeIdx++;
    }

    countCorrect === numCorrect[k];
    
    codeIdx -= codeSize;
    var countPartial = 0; // Count the number of partial values in the guess round
    for (var i = 0; i < codeSize; i++) {    
      for (var j = 0; j < codeSize; j++) {
        if (i != j) {
          partialEqual[codeIdx * codeSize + j] = IsEqual();
          partialEqual[codeIdx * codeSize + j].in[0] <== guess[codeIdx];
          partialEqual[codeIdx * codeSize + j].in[1] <== solution[j];

          partialMatched[codeIdx * codeSize + j] = MultiAND(3);
          partialMatched[codeIdx * codeSize + j].in[0] <== partialEqual[codeIdx * codeSize + j].out;

          if (i == 0 && j == 1 || j == 0)
            partialMatched[codeIdx * codeSize + j].in[1] <== 1 - matchedForCorrect[codeIdx].out;
          else if (j == i + 1)
            partialMatched[codeIdx * codeSize + j].in[1] <== 1 - matchedForPartialGuess[codeIdx * codeSize + j - 2].out;
          else
            partialMatched[codeIdx * codeSize + j].in[1] <== 1 - matchedForPartialGuess[codeIdx * codeSize + j - 1].out;

          if (i == 0 || i == 1 && j == 0)
            partialMatched[codeIdx * codeSize + j].in[2] <== 1 - matchedForCorrect[k * codeSize + j].out;
          else if (i == j + 1)
            partialMatched[codeIdx * codeSize + j].in[2] <== 1 - matchedForPartialSolution[(k * codeSize + i - 2) * codeSize + j].out;
          else
            partialMatched[codeIdx * codeSize + j].in[2] <== 1 - matchedForPartialSolution[(k * codeSize + i - 1) * codeSize + j].out;

          matchedForPartialGuess[codeIdx * codeSize + j] = OR();
          matchedForPartialGuess[codeIdx * codeSize + j].a <== 1 - partialMatched[codeIdx * codeSize + j].in[1];
          matchedForPartialGuess[codeIdx * codeSize + j].b <== partialMatched[codeIdx * codeSize + j].out;

          matchedForPartialSolution[codeIdx * codeSize + j] = OR();
          matchedForPartialSolution[codeIdx * codeSize + j].a <== 1 - partialMatched[codeIdx * codeSize + j].in[2];
          matchedForPartialSolution[codeIdx * codeSize + j].b <== partialMatched[codeIdx * codeSize + j].out;

          countPartial += partialMatched[codeIdx * codeSize + j].out;
        }
      }

      codeIdx++;
    }

    countPartial === numPartial[k];
  }

  // Authenticate the gameplay by hashing
  component solutionHash = Poseidon(1 + codeSize);
  solutionHash.inputs[0] <== gameplaySalt;
  for (var i = 0; i < codeSize; i++) {
    solutionHash.inputs[i + 1] <== solution[i];
  }

  component gameplayHashByRound[numRows];
  for (var i = 0; i < numRows; i++) {
    gameplayHashByRound[i] = Poseidon(1 + codeSize);
    if (i == 0)
      gameplayHashByRound[i].inputs[0] <== solutionHash.out;
    else
      gameplayHashByRound[i].inputs[0] <== gameplayHashByRound[i - 1].out;

    for (var j = 0; j < codeSize; j++) {
      gameplayHashByRound[i].inputs[j + 1] <== guess[i * codeSize + j];
    }
  }

  gameplayHashByRound[numRows - 1].out === gameplayHash;

  // Calculate score
  var realNumRows = 0;
  component broken[numRows];
  component finished[numRows];
  for (var i = 0; i < numRows; i++) {
    broken[i] = IsEqual();
    broken[i].in[0] <== codeSize;
    broken[i].in[1] <== numCorrect[i];
    
    finished[i] = OR();
    if (i == 0)
      finished[i].a <== 0;
    else
      finished[i].a <== finished[i - 1].out;
    finished[i].b <== broken[i].out;

    realNumRows += 1 - finished[i].out;
  }

  score <== numRows - realNumRows;
}

component main { public [gameplayHash] } = Mastermind(4, 10, 9);
