import { useState } from 'react';
import { Library, CurveType } from 'zkverifyjs';

export function useZkVerify(selectedAccount: string | null) {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onVerifyProof = async (proof: string, publicSignals: string[], vk: any, connectedWallet: string | null, connectedAccountAddress: string | null) => {
    setVerifying(true);
    setVerified(false);
    setError(null);

    try {
      if (typeof window === 'undefined') {
        throw new Error('This operation can only be performed in the browser.');
      }

      if (!proof || !publicSignals || !vk) {
        throw new Error('Proof, public signals, or verification key is missing');
      }
/*
      if (!connectedAccountAddress) {
        throw new Error('No account connected');
      }
*/

      let zkVerifySession;
      try {
        zkVerifySession = (await import('zkverifyjs')).zkVerifySession;
      } catch (error: unknown) {
        throw new Error(
          `Failed to load zkVerifySession: ${(error as Error).message}`
        );
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

      events.on('ErrorEvent', (eventData) => {
        console.error(JSON.stringify(eventData));
      });

      let transactionInfo = null;
      try {
        transactionInfo = await transactionResult;
      } catch (error: unknown) {
        throw new Error(`Transaction failed: ${(error as Error).message}`);
      }

      console.log(transactionInfo);
      console.log({"aggregationId": transactionInfo.aggregationId});

      if (transactionInfo && transactionInfo.aggregationId) {
        setVerified(true);
	console.log(transactionInfo.aggregationId + "...");
        return transactionInfo;
      } else {
        throw new Error("Your proof isn't correct.");
      }
    } catch (error: unknown) {
      setError((error as Error).message);
    } finally {
      setVerifying(false);
    }
  };

  return { verifying, verified, error, onVerifyProof };
}
