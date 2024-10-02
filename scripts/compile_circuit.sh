#!/bin/bash

set -e

CIRCUIT_PATH="./circuits/mastermind/circuit.circom"
BUILD_DIR="./circuits/mastermind"
KEYS_DIR="$BUILD_DIR/keys"
PTAU_FILE="powersOfTau28_hez_final_10.ptau"
ZKEY_FINAL="circuit_final.zkey"
WASM_FILE="circuit.wasm"
R1CS_FILE="circuit.r1cs"
VERIFICATION_KEY="verification_key.json"

mkdir -p $KEYS_DIR

CIRCOMLIB_PATH="$(pwd)/node_modules/circomlib/circuits"

check_file_existence() {
  if [ -f $1 ]; then
    echo "File $1 already exists. Do you want to overwrite it? (y/n)"
    read answer
    if [ "$answer" != "${answer#[Yy]}" ]; then
      return 0
    else
      echo "Skipping $1"
      return 1
    fi
  else
    return 0
  fi
}

# Step 1: Compile the circuit with the absolute path to circomlib
echo "Compiling the circuit..."
if ! circom $CIRCUIT_PATH --r1cs --wasm --sym -o $BUILD_DIR -l $CIRCOMLIB_PATH; then
  echo "Error: Failed to compile the circuit."
  exit 1
fi

# Move the wasm file to the keys directory
if check_file_existence "$KEYS_DIR/$WASM_FILE"; then
  mv $BUILD_DIR/circuit_js/$WASM_FILE $KEYS_DIR/$WASM_FILE
fi

# Step 2: Check if the Powers of Tau file exists, if not, download it
if [ ! -f $PTAU_FILE ]; then
    echo "Downloading powers of tau file..."
    if ! curl -o $PTAU_FILE https://hermez.s3-eu-west-1.amazonaws.com/$PTAU_FILE; then
        echo "Error: Failed to download powers of tau file."
        exit 1
    fi
fi

# Step 3: Generate the initial zkey (Phase 2 ceremony)
echo "Generating the initial zkey..."
if ! snarkjs groth16 setup $BUILD_DIR/$R1CS_FILE $PTAU_FILE $KEYS_DIR/circuit_0000.zkey; then
  echo "Error: Failed to generate initial zkey."
  exit 1
fi

# Step 4: Contribute to the Phase 2 ceremony
echo "Contributing to phase 2..."
if check_file_existence "$KEYS_DIR/$ZKEY_FINAL"; then
  if ! snarkjs zkey contribute $KEYS_DIR/circuit_0000.zkey $KEYS_DIR/$ZKEY_FINAL --name="My Contribution" -v; then
    echo "Error: Failed to contribute to the Phase 2 ceremony."
    exit 1
  fi
fi

# Step 5: Export the verification key
echo "Exporting the verification key..."
if check_file_existence "$KEYS_DIR/$VERIFICATION_KEY"; then
  if ! snarkjs zkey export verificationkey $KEYS_DIR/$ZKEY_FINAL $KEYS_DIR/$VERIFICATION_KEY; then
    echo "Error: Failed to export the verification key."
    exit 1
  fi
fi

# Step 6: Clean up intermediate files (optional)
echo "Cleaning up intermediate files..."

rm -rf $BUILD_DIR/circuit_js
rm -f $BUILD_DIR/$R1CS_FILE
rm -f $KEYS_DIR/circuit_0000.zkey

echo "Compilation and trusted setup completed."
echo "Generated files in $KEYS_DIR:"
echo "$KEYS_DIR/$WASM_FILE"
echo "$KEYS_DIR/$ZKEY_FINAL"
echo "$KEYS_DIR/$VERIFICATION_KEY"
