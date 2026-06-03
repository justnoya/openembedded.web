import Select from 'react-select';
import { select_styles } from './Select';

type Guild   = { id: string; name: string; icon: string | null };
type Channel = { id: string; name: string; type: number; parent_id: string | null; position: number };
type SelectOpt  = { value: string; label: string; icon?: string | null };
type GroupedOpt = { label: string; options: SelectOpt[] };

const TEXT_TYPES = new Set([0, 5]);

const groupHeadingStyles = (p: any) => ({
    ...p,
    color: '#72767d',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    padding: '4px 16px',
});

export function BotChannelSelector({
    guilds,
    channels,
    selectedGuildId,
    channelId,
    chLoading,
    onGuildChange,
    onChannelChange,
}: {
    guilds: Guild[];
    channels: Channel[];
    selectedGuildId: string;
    channelId: string;
    chLoading: boolean;
    onGuildChange: (guildId: string) => void;
    onChannelChange: (channelId: string) => void;
}) {
    if (guilds.length === 0) return null;

    /* ── guild options ── */
    const guildOptions: SelectOpt[] = guilds.map(g => ({
        value: g.id, label: g.name, icon: g.icon,
    }));
    const selectedGuild = guildOptions.find(g => g.value === selectedGuildId) || null;

    /* ── channel options grouped by category ── */
    const categories = channels.filter(c => c.type === 4);
    const channelOpts: GroupedOpt[] = [];
    const uncategorized = channels.filter(c => !c.parent_id && TEXT_TYPES.has(c.type));
    if (uncategorized.length)
        channelOpts.push({ label: 'Channels', options: uncategorized.map(c => ({ value: c.id, label: `# ${c.name}` })) });
    for (const cat of categories) {
        const kids = channels.filter(c => c.parent_id === cat.id && TEXT_TYPES.has(c.type));
        if (kids.length)
            channelOpts.push({ label: cat.name.toUpperCase(), options: kids.map(c => ({ value: c.id, label: `# ${c.name}` })) });
    }
    const allFlat: SelectOpt[] = channelOpts.flatMap(g => g.options);
    const selectedChannel = channelId
        ? (allFlat.find(o => o.value === channelId) || { value: channelId, label: channelId })
        : null;

    return (
        <div style={{ marginTop: '0.75rem' }}>
            {/* Server */}
            <p style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: 13, color: '#dcddde', fontWeight: '500' }}>Server</span>
            </p>
            <div style={{ marginBottom: '0.75rem' }}>
                <Select
                    styles={{ ...select_styles, groupHeading: groupHeadingStyles }}
                    options={guildOptions}
                    value={selectedGuild}
                    onChange={opt => onGuildChange((opt as SelectOpt | null)?.value || '')}
                    placeholder="Select a server…"
                    noOptionsMessage={() => 'No servers found'}
                    formatOptionLabel={(opt: any) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            {opt.icon
                                ? <img src={`https://cdn.discordapp.com/icons/${opt.value}/${opt.icon}.png?size=32`}
                                       style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0 }} />
                                : <div style={{
                                    width: 24, height: 24, borderRadius: '50%', background: '#5865f2',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 10, color: '#fff', flexShrink: 0, fontWeight: 700,
                                  }}>
                                    {opt.label.charAt(0).toUpperCase()}
                                  </div>
                            }
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {opt.label}
                            </span>
                        </div>
                    )}
                />
            </div>

            {/* Channel — only shown after a guild is selected */}
            {selectedGuildId && (
                <>
                    <p style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: 13, color: '#dcddde', fontWeight: '500' }}>Channel</span>
                    </p>
                    <div style={{ marginBottom: '0.25rem' }}>
                        <Select
                            styles={{ ...select_styles, groupHeading: groupHeadingStyles }}
                            options={channelOpts as any}
                            value={selectedChannel}
                            onChange={opt => onChannelChange((opt as SelectOpt | null)?.value || '')}
                            isLoading={chLoading}
                            placeholder={chLoading ? 'Loading channels…' : 'Select a channel…'}
                            isDisabled={chLoading}
                            noOptionsMessage={() => 'No text channels found'}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
