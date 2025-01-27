import React, { createContext, useContext, useState, ReactNode, FC } from 'react';

interface AccountContextType {
    selectedAccount: string | null;
    setSelectedAccount: React.Dispatch<React.SetStateAction<string | null>>;
    selectedWalletSource: string | null;
    setSelectedWalletSource: React.Dispatch<React.SetStateAction<string | null>>;
}

export const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
    const [selectedWalletSource, setSelectedWalletSource] = useState<string | null>(null);

    return (
        <AccountContext.Provider
            value={{
                selectedAccount,
                setSelectedAccount,
                selectedWalletSource,
                setSelectedWalletSource
            }}
        >
            {children}
        </AccountContext.Provider>
    );
};

export const useAccount = (): AccountContextType => {
    const context = useContext(AccountContext);
    if (!context) {
        throw new Error('useAccount must be used within an AccountProvider');
    }
    return context;
};
