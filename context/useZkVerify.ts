import { useAccount } from "./AccountContext";
import { CurveType, Library } from "zkverifyjs";

export function useZkVerify() {
  const { selectedAccount, selectedWalletSource } = useAccount();
  const onVerifyProof = async (proof: string, publicSignals: string[], vk: any): Promise<{ verified: boolean; cancelled: boolean; error?: string }> => {

    let localCancelled = false;

    try {
      if (typeof window === 'undefined') {
        throw new Error('This operation can only be performed in the browser.');
      }

      if (!proof || !publicSignals || !vk) {
        throw new Error('Proof, public signals, or verification key is missing');
      }

      const proofData = JSON.parse(proof);

      let zkVerifySession;
      try {
        zkVerifySession = (await import('zkverifyjs')).zkVerifySession;
      } catch (error: unknown) {
        throw new Error(`Failed to load zkVerifySession: ${(error as Error).message}`);
      }

      const session = await zkVerifySession.start()
          .Testnet()
          .withWallet({
            accountAddress: selectedAccount!,
            source: selectedWalletSource!
      });
      const { events, transactionResult } = await session.verify()
          .groth16(Library.snarkjs, CurveType.bn128)
          .execute({
            proofData: {
        proof: proofData,
        publicSignals: publicSignals,
        vk: vk
        }
      });

      events.on('ErrorEvent', (eventData) => {
        console.error('ErrorEvent:', JSON.stringify(eventData));
      });

      let transactionInfo = null;
      try {
        transactionInfo = await transactionResult;
      } catch (error: unknown) {
        if ((error as Error).message.includes('Rejected by user')) {
          localCancelled = true;
          return { verified: false, cancelled: true };
        }
        throw new Error(`Transaction failed: ${(error as Error).message}`);
      }

      if (transactionInfo && transactionInfo.attestationId) {
        return { verified: true, cancelled: false };
      } else {
        throw new Error("Your proof isn't correct.");
      }
    } catch (error: unknown) {
      if (!localCancelled) {
        const errorMessage = (error as Error).message;
        return { verified: false, cancelled: false, error: errorMessage };
      }
      return { verified: false, cancelled: true };
    }
  };

  return { onVerifyProof };
}
