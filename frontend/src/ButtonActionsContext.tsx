import { createContext, useContext, useState, ReactNode } from 'react';

export type InteractionStepType =
    | 'reply'
    | 'reply_embed'
    | 'give_role'
    | 'remove_role'
    | 'send_channel'
    | 'dm_user'
    | 'delete_message';

export type InteractionStep = {
    id: string;
    type: InteractionStepType;
    // reply / reply_embed / dm_user
    content?: string;
    ephemeral?: boolean;
    // reply_embed — JSON string of Component[]
    embedJson?: string;
    // give_role / remove_role
    roleId?: string;
    // send_channel
    channelId?: string;
};

export type ButtonAction = {
    steps: InteractionStep[];
};

type ButtonActionsContextType = {
    actions: Record<string, ButtonAction>;
    setAction: (customId: string, action: ButtonAction | null) => void;
};

const ButtonActionsContext = createContext<ButtonActionsContextType>({
    actions: {},
    setAction: () => {},
});

function loadFromStorage(): Record<string, ButtonAction> {
    try {
        const raw = localStorage.getItem('discord.builders__buttonActions2') || '{}';
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

export function ButtonActionsProvider({ children }: { children: ReactNode }) {
    const [actions, setActions] = useState<Record<string, ButtonAction>>(loadFromStorage);

    const setAction = (customId: string, action: ButtonAction | null) => {
        setActions(prev => {
            const next = { ...prev };
            if (action === null || action.steps.length === 0) {
                delete next[customId];
            } else {
                next[customId] = action;
            }
            localStorage.setItem('discord.builders__buttonActions2', JSON.stringify(next));
            return next;
        });
    };

    return (
        <ButtonActionsContext.Provider value={{ actions, setAction }}>
            {children}
        </ButtonActionsContext.Provider>
    );
}

export function useButtonActions() {
    return useContext(ButtonActionsContext);
}

export const STEP_LABELS: Record<InteractionStepType, string> = {
    reply:          'Reply with message',
    reply_embed:    'Reply with embed / components',
    give_role:      'Give role to user',
    remove_role:    'Remove role from user',
    send_channel:   'Send message to channel',
    dm_user:        'DM the user',
    delete_message: 'Delete the original message',
};

export const STEP_ICONS: Record<InteractionStepType, string> = {
    reply:          '💬',
    reply_embed:    '🧩',
    give_role:      '✅',
    remove_role:    '❌',
    send_channel:   '📨',
    dm_user:        '✉️',
    delete_message: '🗑️',
};

export function stepSummary(step: InteractionStep): string {
    switch (step.type) {
        case 'reply':
        case 'dm_user':
            return step.content ? `"${step.content.slice(0, 50)}${step.content.length > 50 ? '…' : ''}"` : '(no content)';
        case 'reply_embed':
            return step.content
                ? `"${step.content.slice(0, 30)}…" + embed`
                : step.embedJson ? 'embed only' : '(no content)';
        case 'give_role':
        case 'remove_role':
            return step.roleId ? `Role: ${step.roleId}` : '(no role ID)';
        case 'send_channel':
            return step.channelId
                ? `→ #${step.channelId}${step.content ? `: "${step.content.slice(0, 30)}"` : ''}`
                : '(no channel)';
        case 'delete_message':
            return 'deletes the triggered message';
        default:
            return '';
    }
}

let _idCounter = Date.now();
export function newStepId(): string {
    return String(++_idCounter);
}
