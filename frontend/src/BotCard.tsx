import Select from 'react-select';
import { select_styles } from './Select';
import Styles from './BotCard.module.css';

type Guild   = { id: string; name: string; icon: string | null };
type Channel = { id: string; name: string; type: number; parent_id: string | null; position: number };
type BotUser = { id: string; username: string; discriminator?: string; avatar: string | null; bot?: boolean };
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

interface BotCardProps {
    botUser: BotUser | null;
    guilds: Guild[];
    channels: Channel[];
    selectedGuildId: string;
    channelId: string;
    chLoading: boolean;
    onGuildChange: (guildId: string) => void;
    onChannelChange: (channelId: string) => void;
    onSend: () => void;
    sending?: boolean;
}

export function BotCard({
    botUser,
    guilds,
    channels,
    selectedGuildId,
    channelId,
    chLoading,
    onGuildChange,
    onChannelChange,
    onSend,
    sending,
}: BotCardProps) {
    const avatarUrl = botUser?.avatar && botUser?.id
        ? `https://cdn.discordapp.com/avatars/${botUser.id}/${botUser.avatar}.png?size=80`
        : null;
    const displayName = botUser?.username || 'Bot';
    const initial = displayName.charAt(0).toUpperCase();

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
        <div className={Styles.card}>
            {/* ── Bot identity ── */}
            <div className={Styles.identity}>
                <div className={Styles.avatarWrap}>
                    {avatarUrl
                        ? <img className={Styles.avatar} src={avatarUrl} alt={displayName} />
                        : <div className={Styles.avatarFallback}>{initial}</div>
                    }
                    <span className={Styles.statusDot} title="Online" />
                </div>
                <div className={Styles.botInfo}>
                    <div className={Styles.botNameRow}>
                        <span className={Styles.botName}>{displayName}</span>
                        <span className={Styles.botBadge}>BOT</span>
                    </div>
                    <div className={Styles.botStatus}>● Online</div>
                </div>
            </div>

            {/* ── Server + Channel selectors ── */}
            {guilds.length > 0 && (
                <div className={Styles.selectors}>
                    <div>
                        <div className={Styles.selectLabel}>Server</div>
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
                                        ? <img
                                            src={`https://cdn.discordapp.com/icons/${opt.value}/${opt.icon}.png?size=32`}
                                            style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0 }}
                                          />
                                        : <div style={{
                                            width: 22, height: 22, borderRadius: '50%', background: '#5865f2',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 9, color: '#fff', flexShrink: 0, fontWeight: 700,
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

                    {selectedGuildId && (
                        <div>
                            <div className={Styles.selectLabel}>Channel</div>
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
                    )}
                </div>
            )}

            {/* ── Send button ── */}
            <button
                className={Styles.sendBtn}
                disabled={!channelId || sending}
                onClick={onSend}
            >
                {sending ? 'Sending…' : '↑ Send Message'}
            </button>
        </div>
    );
}
