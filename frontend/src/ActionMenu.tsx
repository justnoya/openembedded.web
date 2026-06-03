import { useState } from 'react';
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
import Styles from './ActionMenu.module.css';
import { useResponseBuilder } from './ResponseBuilderContext';

/* ── Icon imports (same icons used by CapsuleButton) ── */
import TextDisplayIcon  from '../../components-sdk/src/icons/TextDisplay.svg';
import ContainerIcon    from '../../components-sdk/src/icons/Container.svg';
import DefaultActiveIcon from '../../components-sdk/src/icons/DefaultActive.svg';
import LockActiveIcon   from '../../components-sdk/src/icons/LockActive.svg';
import ActionIcon       from '../../components-sdk/src/icons/Action.svg';
import EditIcon         from '../../components-sdk/src/icons/Edit.svg';
import TrashIcon        from '../../components-sdk/src/icons/Trash.svg';
import ButtonIconSvg    from '../../components-sdk/src/icons/Button.svg';
import ButtonLinkIcon   from '../../components-sdk/src/icons/ButtonLink.svg';
import MediaGalleryIcon from '../../components-sdk/src/icons/MediaGallery.svg';
import UploadIcon       from '../../components-sdk/src/icons/Upload.svg';
import SeparatorIcon    from '../../components-sdk/src/icons/Separator.svg';
import SelectIcon       from '../../components-sdk/src/icons/Select.svg';

/* ── Action type → icon mapping ── */
const ACTION_ICONS: Record<InteractionStepType, string> = {
    reply:          TextDisplayIcon,
    reply_embed:    ContainerIcon,
    give_role:      DefaultActiveIcon,
    remove_role:    LockActiveIcon,
    send_channel:   ActionIcon,
    dm_user:        EditIcon,
    delete_message: TrashIcon,
};

/* ── Component sub-picker items (for embed/container response) ── */
const EMBED_COMPONENTS = [
    { key: 'button',      icon: ButtonIconSvg,    label: 'Button' },
    { key: 'button-link', icon: ButtonLinkIcon,   label: 'Button link' },
    { key: 'container',   icon: ContainerIcon,    label: 'Container' },
    { key: 'image',       icon: MediaGalleryIcon, label: 'Image' },
    { key: 'file',        icon: UploadIcon,       label: 'File' },
    { key: 'separator',   icon: SeparatorIcon,    label: 'Separator' },
    { key: 'select',      icon: SelectIcon,       label: 'Select menu' },
];

const ALL_TYPES: InteractionStepType[] = [
    'reply',
    'reply_embed',
    'give_role',
    'remove_role',
    'send_channel',
    'dm_user',
    'delete_message',
];

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

function embedSummary(embedJson: string | undefined): string {
    if (!embedJson) return '';
    try {
        const parsed = JSON.parse(embedJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
            return `${parsed.length} component${parsed.length !== 1 ? 's' : ''} configured`;
        }
    } catch {}
    return '';
}

/* ── Shared dropdown card item (matches CapsuleButton exactly) ── */
function CtxItem({ icon, label, onClick, separator }: { icon: string; label: string; onClick: () => void; separator?: boolean }) {
    return (
        <div
            className={Styles.ctxItem + (separator ? ' ' + Styles.ctxItemSeparator : '')}
            onClick={onClick}
        >
            <div className={Styles.ctxItemImg}>
                <img src={icon} alt="" />
            </div>
            <div className={Styles.ctxItemText}>{label}</div>
        </div>
    );
}

/* ── Action type picker — first level ── */
function ActionTypePicker({ onPick, onPickEmbed, onCancel }: {
    onPick: (type: InteractionStepType) => void;
    onPickEmbed: () => void;
    onCancel: () => void;
}) {
    return (
        <div className={Styles.ctxCard}>
            {ALL_TYPES.map((t) => (
                <CtxItem
                    key={t}
                    icon={ACTION_ICONS[t]}
                    label={STEP_LABELS[t]}
                    onClick={() => t === 'reply_embed' ? onPickEmbed() : onPick(t)}
                    separator={t === 'give_role'}
                />
            ))}
            <div className={Styles.ctxCancelRow}>
                <button className={Styles.ctxCancelBtn} onClick={onCancel}>Cancel</button>
            </div>
        </div>
    );
}

/* ── Embed component sub-picker — second level ── */
function EmbedComponentPicker({ onSelect, onBack }: {
    onSelect: () => void;
    onBack: () => void;
}) {
    return (
        <div className={Styles.ctxCard}>
            <div className={Styles.ctxHeader}>
                <button className={Styles.ctxBackBtn} onClick={onBack}>‹ Back</button>
                <span className={Styles.ctxHeaderLabel}>Embed / Container components</span>
            </div>
            {EMBED_COMPONENTS.map((comp) => (
                <CtxItem
                    key={comp.key}
                    icon={comp.icon}
                    label={comp.label}
                    onClick={onSelect}
                />
            ))}
        </div>
    );
}

/* ── Step editor (shown after picking an action type) ── */
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
    const openResponseBuilder = useResponseBuilder();

    const valid = () => {
        if (step.type === 'give_role' || step.type === 'remove_role') return !!step.roleId?.trim();
        if (step.type === 'send_channel') return !!step.channelId?.trim();
        if (step.type === 'delete_message') return true;
        if (step.type === 'reply_embed') return !!(step.content?.trim() || step.embedJson?.trim());
        return !!(step.content?.trim());
    };

    const summary = embedSummary(step.embedJson);

    return (
        <div className={Styles.editor}>
            <div className={Styles.editorTitleRow}>
                <span className={Styles.editorTypeIcon}>{STEP_ICONS[step.type]}</span>
                <p className={Styles.editorTitle}>{STEP_LABELS[step.type]}</p>
            </div>

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
                <label className={Styles.label}>Response layout (optional)</label>
                {summary && <p className={Styles.embedPreview}>✓ {summary}</p>}
                <button
                    type="button"
                    className={Styles.designBtn}
                    onClick={() => openResponseBuilder(step.embedJson || '', (json) => set({ embedJson: json }))}
                >
                    {summary ? '✏️  Edit Response Layout' : '🧩  Design Response Layout'}
                </button>
                {summary && (
                    <button type="button" className={Styles.clearEmbedBtn} onClick={() => set({ embedJson: '' })}>
                        Clear layout
                    </button>
                )}
                <p className={Styles.hint}>
                    Use the visual builder to design the container or embed shown when clicked.
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
                    Apply
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
    const [pickedType, setPickedType] = useState<InteractionStepType>('reply');

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
                <span>⚡ Interactions</span>
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

                {mode === 'picking' && (
                    <ActionTypePicker
                        onPick={(type) => { setPickedType(type); setMode('adding'); }}
                        onPickEmbed={() => setMode('embed-picking')}
                        onCancel={() => setMode('idle')}
                    />
                )}

                {mode === 'embed-picking' && (
                    <EmbedComponentPicker
                        onSelect={() => { setPickedType('reply_embed'); setMode('adding'); }}
                        onBack={() => setMode('picking')}
                    />
                )}

                {mode === 'adding' && (
                    <StepEditor
                        title="Add action"
                        initial={blankStep(pickedType)}
                        onSave={addStep}
                        onCancel={() => setMode('idle')}
                    />
                )}

                {mode === 'idle' && (
                    <button className={Styles.addBtn} onClick={() => setMode('picking')}>
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
