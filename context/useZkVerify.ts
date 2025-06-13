import { useState } from 'react';
import { zkVerifySession, Library, CurveType } from 'zkverifyjs';

export function useZkVerify(selectedAccount: string | null) {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onVerifyProof = async (proof: string, publicSignals: string[], vk: any, connectedWallet: string | null, connectedAccountAddress: string | null) => {
    setVerifying(true);
    setVerified(false);
    setTxHash(null);
    setError(null);

    try {
      if (typeof window === 'undefined') {
        throw new Error('This operation can only be performed in the browser.');
      }

      if (!proof || !publicSignals || !vk) {
        throw new Error('Proof, public signals, or verification key is missing');
      }

      if (!connectWallet || !connectedAccountAddress) {
        throw new Error('No wallet or account connected');
      }

      let session;
      try {
        session = await zkVerifySession.start().Volta().withWallet({
	  source: connectedWallet,
	  accountAddress: connectedAccountAddress
	});
      } catch (error: unknown) {
        throw new Error(`Connection failed: ${(error as Error).message}`);
      }
      
      const { events, transactionResult } = await session
        .verify()
        .groth16({
          library: Library.snarkjs,
          curve: CurveType.bn128
        })
        .execute({
          proofData: {
            proof,
	    publicSignals,
	    vk,
	  },
	  domainId: 42,
	});

      events.on('includedInBlock', (eventData) => {
        console.log('Proof transaction is included in block:', eventData);
      });

      events.on('finalized', (eventData) => {
        console.log('Proof transaction processing is finalized:', eventData);
        if (eventData.status == "finalized" && eventData.blockHash && (eventData.txHash || eventData.transactionHash)) {
          setTxHash(eventData.txHash ? eventData.txHash : eventData.transactionHash);
          setVerified(true);
	}
      });

      events.on('error', (error) => {
        console.error(JSON.stringify(eventData));
      });

// The following does not work as the responded {transactionInfo.domainId} and {transactionInfo.aggregationId} are still undefined despite the proof transaction get processed successfully
/*
      let transactionInfo = null;
      try {
        transactionInfo = await transactionResult;
      } catch (error: unknown) {
        throw new Error(`Transaction failed: ${(error as Error).message}`);
      }

      console.log(transactionInfo);

      if (transactionInfo && transactionInfo.aggregationId) {
        setVerified(true);
	console.log(transactionInfo.aggregationId + "...");
        return transactionInfo;
      } else {
        throw new Error("Your proof isn't correct.");
      }
*/
    } catch (error: unknown) {
      setError((error as Error).message);
    } finally {
      setVerifying(false);
    }
  };

  return { verifying, verified, txHash, error, onVerifyProof };
}
