import { useState } from 'react';

export function useZkVerify(selectedAccount: string | null) {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onVerifyProof = async (proof: string, publicSignals: string[], vk: any) => {
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
      if (!selectedAccount) {
        throw new Error('No account connected');
      }
*/
      const proofData = JSON.parse(proof);

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
        session = await zkVerifySession.start().Testnet().withWallet();
      } catch (error: unknown) {
        throw new Error(`Connection failed: ${(error as Error).message}`);
      }

      const { events, transactionResult } = await session
        .verify()
        .groth16()
        .execute(proofData, publicSignals, vk);

      events.on('ErrorEvent', (eventData) => {
        console.error(JSON.stringify(eventData));
      });

      let transactionInfo = null;
      try {
        transactionInfo = await transactionResult;
      } catch (error: unknown) {
        throw new Error(`Transaction failed: ${(error as Error).message}`);
      }

      if (transactionInfo && transactionInfo.attestationId) {
        setVerified(true);
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
