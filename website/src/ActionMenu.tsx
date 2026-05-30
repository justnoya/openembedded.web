import { useState } from 'react';
import ReactSelect from 'react-select';
import { ActionMenuProps } from 'components-sdk/src/polyfills/ActionMenu';
import {
    useButtonActions,
    InteractionStep,
    InteractionStepType,
    ButtonAction,
    STEP_LABELS,
    STEP_ICONS,
    stepSummary,
    newStepId,
} from './ButtonActionsContext';
import { select_styles } from './Select';
import Styles from './ActionMenu.module.css';

const ALL_TYPES: InteractionStepType[] = [
    'reply',
    'reply_embed',
    'give_role',
    'remove_role',
    'send_channel',
    'dm_user',
    'delete_message',
];

const TYPE_OPTIONS = ALL_TYPES.map(t => ({
    value: t,
    label: `${STEP_ICONS[t]}  ${STEP_LABELS[t]}`,
}));

/* ── select styles tuned for the dark 1c1d20 editor background ── */
const editorSelectStyles: typeof select_styles = {
    ...select_styles,
    control: (p) => ({
        ...(select_styles.control as Function)(p, {}),
        background: '#2f3136',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 0 2px rgba(0,0,0,0.4)',
        minHeight: '3.6rem',
        cursor: 'pointer',
    }),
    valueContainer: (p) => ({
        padding: '0.4rem 1.2rem',
    }),
    singleValue: (p) => ({
        color: '#dcddde',
        fontSize: '1.4rem',
    }),
    input: (p) => ({
        color: '#dcddde',
        fontSize: '1.4rem',
    }),
    menu: (p) => ({
        ...(select_styles.menu as Function)(p, {}),
        zIndex: 999,
        fontSize: '1.3rem',
    }),
    option: (p, state) => ({
        ...(select_styles.option as Function)(p, state),
        fontSize: '1.3rem',
        padding: '0.7rem 1rem',
        margin: '2px 0',
    }),
};

function needsContent(type: InteractionStepType) {
    return type === 'reply' || type === 'reply_embed' || type === 'send_channel' || type === 'dm_user';
}
function needsEmbed(type: InteractionStepType) { return type === 'reply_embed'; }
function needsRole(type: InteractionStepType) { return type === 'give_role' || type === 'remove_role'; }
function needsChannel(type: InteractionStepType) { return type === 'send_channel'; }
function canBeEphemeral(type: InteractionStepType) { return type === 'reply' || type === 'reply_embed'; }

function blankStep(type: InteractionStepType): InteractionStep {
    return { id: newStepId(), type, content: '', ephemeral: false, roleId: '', channelId: '', embedJson: '' };
}

/* ── Step Editor ── */
function StepEditor({
    initial,
    onSave,
    onCancel,
    title,
}: {
    initial: InteractionStep;
    onSave: (s: InteractionStep) => void;
    onCancel: () => void;
    title: string;
}) {
    const [step, setStep] = useState<InteractionStep>(initial);
    const set = (patch: Partial<InteractionStep>) => setStep(prev => ({ ...prev, ...patch }));
    const changeType = (type: InteractionStepType) => setStep({ ...blankStep(type), id: step.id });

    const valid = () => {
        if (step.type === 'give_role' || step.type === 'remove_role') return !!step.roleId?.trim();
        if (step.type === 'send_channel') return !!step.channelId?.trim();
        if (step.type === 'delete_message') return true;
        if (step.type === 'reply_embed') return !!(step.content?.trim() || step.embedJson?.trim());
        return !!(step.content?.trim());
    };

    const selectedType = TYPE_OPTIONS.find(o => o.value === step.type) ?? null;

    return (
        <div className={Styles.editor}>
            <p className={Styles.editorTitle}>{title}</p>

            <label className={Styles.label} style={{ marginTop: 0 }}>Action type</label>
            <ReactSelect
                styles={editorSelectStyles}
                options={TYPE_OPTIONS}
                value={selectedType}
                onChange={opt => opt && changeType(opt.value as InteractionStepType)}
                isSearchable={false}
                menuPosition="fixed"
            />

            {needsContent(step.type) && <>
                <label className={Styles.label}>Message content</label>
                <textarea
                    className={Styles.textarea}
                    value={step.content || ''}
                    onChange={e => set({ content: e.target.value })}
                    placeholder={step.type === 'dm_user' ? 'What should the bot DM the user?' : 'What should the bot say?'}
                    rows={3}
                />
            </>}

            {needsEmbed(step.type) && <>
                <label className={Styles.label}>Components / Embed JSON (optional)</label>
                <textarea
                    className={Styles.textarea}
                    value={step.embedJson || ''}
                    onChange={e => set({ embedJson: e.target.value })}
                    placeholder='Paste JSON from the "Generator for programmers" panel'
                    rows={4}
                />
                <p className={Styles.hint}>
                    Build your layout in the left panel → copy JSON from the Generator section → paste here.
                </p>
            </>}

            {needsRole(step.type) && <>
                <label className={Styles.label}>Role ID</label>
                <input
                    className={Styles.input}
                    type="text"
                    value={step.roleId || ''}
                    onChange={e => set({ roleId: e.target.value })}
                    placeholder="Right-click the role in Discord → Copy ID"
                />
                <p className={Styles.hint}>Developer Mode must be on in Discord settings to copy IDs.</p>
            </>}

            {needsChannel(step.type) && <>
                <label className={Styles.label}>Channel ID</label>
                <input
                    className={Styles.input}
                    type="text"
                    value={step.channelId || ''}
                    onChange={e => set({ channelId: e.target.value })}
                    placeholder="Right-click the channel → Copy ID"
                />
            </>}

            {canBeEphemeral(step.type) && (
                <label className={Styles.checkRow}>
                    <input
                        type="checkbox"
                        checked={!!step.ephemeral}
                        onChange={e => set({ ephemeral: e.target.checked })}
                    />
                    Ephemeral — only visible to the user who clicked
                </label>
            )}

            <div className={Styles.editorBtns}>
                <button className={Styles.cancelBtn} onClick={onCancel}>Cancel</button>
                <button className={Styles.saveBtn} disabled={!valid()} onClick={() => onSave(step)}>
                    Save
                </button>
            </div>
        </div>
    );
}

/* ── Main ActionMenu ── */
export function ActionMenuComponent({ closeCallback, customId }: ActionMenuProps) {
    const { actions, setAction } = useButtonActions();
    const existing: ButtonAction = actions[customId] ?? { steps: [] };

    const [steps, setSteps] = useState<InteractionStep[]>(existing.steps);
    const [mode, setMode] = useState<string>('idle');

    const persist = (newSteps: InteractionStep[]) => {
        setSteps(newSteps);
        setAction(customId, newSteps.length > 0 ? { steps: newSteps } : null);
    };

    const addStep    = (step: InteractionStep) => { persist([...steps, step]); setMode('idle'); };
    const updateStep = (step: InteractionStep) => { persist(steps.map(s => s.id === step.id ? step : s)); setMode('idle'); };
    const removeStep = (id: string)            => { persist(steps.filter(s => s.id !== id)); setMode('idle'); };
    const clearAll   = ()                      => { persist([]); setMode('idle'); };

    const editingId   = mode.startsWith('editing:') ? mode.slice(8) : null;
    const editingStep = editingId ? steps.find(s => s.id === editingId) : null;

    return (
        <div className={Styles.menu}>
            <div className={Styles.header}>
                <span>⚡ Button Interactions</span>
                <button className={Styles.closeBtn} onClick={closeCallback}>✕</button>
            </div>
            <div className={Styles.body}>

                {steps.length === 0 && mode === 'idle' && (
                    <p className={Styles.emptyHint}>No actions yet. Add one below.</p>
                )}

                <div className={Styles.stepList}>
                    {steps.map(step => (
                        <div key={step.id}>
                            {editingId === step.id && editingStep ? (
                                <StepEditor
                                    title="Edit action"
                                    initial={editingStep}
                                    onSave={updateStep}
                                    onCancel={() => setMode('idle')}
                                />
                            ) : (
                                <div
                                    className={Styles.stepCard}
                                    onClick={() => mode === 'idle' && setMode(`editing:${step.id}`)}
                                >
                                    <span className={Styles.stepIcon}>{STEP_ICONS[step.type]}</span>
                                    <div className={Styles.stepInfo}>
                                        <p className={Styles.stepType}>
                                            {STEP_LABELS[step.type]}
                                            {step.ephemeral && <span className={Styles.stepEphemeral}>ephemeral</span>}
                                        </p>
                                        <p className={Styles.stepSummary}>{stepSummary(step)}</p>
                                    </div>
                                    <button
                                        className={Styles.stepRemove}
                                        onClick={e => { e.stopPropagation(); removeStep(step.id); }}
                                        title="Remove this action"
                                    >✕</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {mode === 'adding' ? (
                    <StepEditor
                        title="Add action"
                        initial={blankStep('reply')}
                        onSave={addStep}
                        onCancel={() => setMode('idle')}
                    />
                ) : mode === 'idle' && (
                    <button className={Styles.addBtn} onClick={() => setMode('adding')}>
                        + Add action
                    </button>
                )}

                {steps.length > 0 && mode === 'idle' && (
                    <button className={Styles.clearAllBtn} onClick={clearAll}>
                        Clear all actions
                    </button>
                )}
            </div>
        </div>
    );
}
