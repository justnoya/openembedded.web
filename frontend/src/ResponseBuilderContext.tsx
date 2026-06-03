import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ResponseBuilderModal } from './ResponseBuilderModal';

type OpenFn = (initialJson: string, onSave: (json: string) => void) => void;

const ResponseBuilderContext = createContext<OpenFn>(() => {});

export function useResponseBuilder(): OpenFn {
    return useContext(ResponseBuilderContext);
}

type ModalState = { initialJson: string; onSave: (json: string) => void } | null;

export function ResponseBuilderProvider({ children }: { children: ReactNode }) {
    const [modal, setModal] = useState<ModalState>(null);

    const open = useCallback<OpenFn>((initialJson, onSave) => {
        setModal({ initialJson, onSave });
    }, []);

    const close = useCallback(() => setModal(null), []);

    const handleSave = useCallback((json: string) => {
        if (modal) modal.onSave(json);
        setModal(null);
    }, [modal]);

    return (
        <ResponseBuilderContext.Provider value={open}>
            {children}
            {modal !== null && (
                <ResponseBuilderModal
                    initialJson={modal.initialJson}
                    onSave={handleSave}
                    onCancel={close}
                />
            )}
        </ResponseBuilderContext.Provider>
    );
}
