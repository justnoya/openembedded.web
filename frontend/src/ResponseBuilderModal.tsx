import { useMemo, useCallback, useRef } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { Capsule, Component, PassProps } from 'components-sdk';
import { DisplaySliceManager, RootState } from './state';
import { createResponseBuilderStore } from './responseBuilderStore';
import { BetterInput } from './BetterInput';
import { EmojiPicker } from './EmojiPicker';
import { EmojiShow } from './EmojiShow';
import { ColorPicker } from './ColorPicker';
import { webhookImplementation } from './webhook.impl';
import Styles from './ResponseBuilderModal.module.css';
import { ActionMenuComponent } from './ActionMenu';
import { useButtonActions } from './ButtonActionsContext';

function ModalInner({ onSave, onCancel }: { onSave: (json: string) => void; onCancel: () => void }) {
    const dispatch = useDispatch();
    const state = useSelector((s: RootState) => s.display.data);
    const stateManager = useMemo(() => new DisplaySliceManager(dispatch), [dispatch]);
    const stateKey = useMemo(() => ['data'], []);

    const { actions } = useButtonActions();
    const actionsRef = useRef(actions);
    actionsRef.current = actions;

    const passProps = useMemo((): PassProps => ({
        getFile: webhookImplementation.getFile,
        getFileName: webhookImplementation.getFileName,
        setFile: webhookImplementation.setFile,
        BetterInput,
        EmojiPicker,
        ColorPicker,
        EmojiShow,
        ActionMenu: ActionMenuComponent,
        interactiveDisabled: false,
        hasAction: (id: string) => !!actionsRef.current[id],
    }), []);

    const handleSave = useCallback(() => {
        onSave(state.length > 0 ? JSON.stringify(state) : '');
    }, [state, onSave]);

    return (
        <div className={Styles.modal}>
            <div className={Styles.header}>
                <span>🧩 Design Button Response</span>
                <button className={Styles.closeBtn} onClick={onCancel}>✕</button>
            </div>
            <div className={Styles.builderWrap}>
                <Capsule
                    state={state}
                    stateManager={stateManager}
                    stateKey={stateKey}
                    passProps={passProps}
                    errors={null}
                />
            </div>
            <div className={Styles.footer}>
                <p className={Styles.hint}>
                    Build the response that will be sent when the button is clicked.
                </p>
                <div className={Styles.footerBtns}>
                    <button className={Styles.cancelBtn} onClick={onCancel}>Cancel</button>
                    <button className={Styles.saveBtn} onClick={handleSave}>
                        Save Response
                    </button>
                </div>
            </div>
        </div>
    );
}

export function ResponseBuilderModal({
    initialJson,
    onSave,
    onCancel,
}: {
    initialJson: string;
    onSave: (json: string) => void;
    onCancel: () => void;
}) {
    let initialData: Component[] = [];
    try {
        if (initialJson) {
            const parsed = JSON.parse(initialJson);
            if (Array.isArray(parsed)) initialData = parsed;
        }
    } catch {}

    const store = useMemo(() => createResponseBuilderStore(initialData), []);

    return (
        <div
            className={Styles.overlay}
            onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
        >
            <Provider store={store}>
                <ModalInner onSave={onSave} onCancel={onCancel} />
            </Provider>
        </div>
    );
}
