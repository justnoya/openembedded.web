import { useState } from 'react';
import Select from 'react-select';
import { select_styles } from './Select';
import { InlineAlert } from './InlineAlert';
import { ApiResponseCard } from './ApiResponseCard';
import Styles from './BotConnectCard.module.css';

type GatewayStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
type Guild   = { id: string; name: string; icon: string | null };
type Channel = { id: string; name: string; type: number; parent_id: string | null; position: number };
type BotUser = { id: string; username: string; discriminator?: string; avatar: string | null };
type SelectOpt  = { value: string; label: string; icon?: string | null };
type GroupedOpt = { label: string; options: SelectOpt[] };

const TEXT_TYPES = new Set([0, 5]);

const groupHeadingStyles = (p: any) => ({
    ...p, color: '#72767d', fontSize: 11, fontWeight: 700,
    textTransform: 'uppercase' as const, letterSpacing: '0.5px', padding: '4px 16px',
});

interface BotConnectCardProps {
    botToken:        string;
    setBotToken:     (t: string) => void;
    gatewayStatus:   GatewayStatus;
    botConnecting:   boolean;
    botConnectError: string | null;
    gatewayError:    string | null;
    onConnect:       () => void;
    onDisconnect:    () => void;
    onClearError:    () => void;
    botUser:         BotUser | null;
    guilds:          Guild[];
    channels:        Channel[];
    selectedGuildId: string;
    channelId:       string;
    chLoading:       boolean;
    onGuildChange:   (id: string) => void;
    onChannelChange: (id: string) => void;
    onSend:          () => void;
    sending:         boolean;
    botResponse:     object | null;
    onClearResponse: () => void;
}

type Tab = 'connect' | 'server' | 'channel';

function StatusDot({ status }: { status: GatewayStatus }) {
    const map: Record<GatewayStatus, { color: string; label: string }> = {
        connected:    { color: '#23a55a', label: 'Online' },
        connecting:   { color: '#f0b232', label: 'Connecting…' },
        error:        { color: '#f23f43', label: 'Error' },
        disconnected: { color: '#80848e', label: 'Offline' },
    };
    const { color, label } = map[status];
    return (
        <span className={Styles.statusChip} style={{ color }}>
            <span className={Styles.statusDotInline} style={{ background: color }} />
            {label}
        </span>
    );
}

export function BotConnectCard({
    botToken, setBotToken, gatewayStatus, botConnecting,
    botConnectError, gatewayError, onConnect, onDisconnect, onClearError,
    botUser, guilds, channels, selectedGuildId, channelId,
    chLoading, onGuildChange, onChannelChange, onSend, sending,
    botResponse, onClearResponse,
}: BotConnectCardProps) {
    const [tab, setTab] = useState<Tab>('connect');

    const isConnected  = gatewayStatus === 'connected';
    const isConnecting = gatewayStatus === 'connecting' || botConnecting;

    /* ── Avatar ── */
    const avatarUrl = botUser?.avatar && botUser?.id
        ? `https://cdn.discordapp.com/avatars/${botUser.id}/${botUser.avatar}.png?size=80`
        : null;
    const displayName = botUser?.username || 'Connect a Bot';
    const initial     = displayName.charAt(0).toUpperCase();

    /* ── Guild / channel options ── */
    const guildOptions: SelectOpt[] = guilds.map(g => ({ value: g.id, label: g.name, icon: g.icon }));
    const selectedGuild = guildOptions.find(g => g.value === selectedGuildId) || null;

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
        ? (allFlat.find(o => o.value === channelId) || { value: channelId, label: `# ${channelId}` })
        : null;

    /* ── Selected server/channel display info ── */
    const currentGuild   = guilds.find(g => g.id === selectedGuildId);
    const currentChannel = allFlat.find(c => c.value === channelId);

    const TABS: { id: Tab; label: string }[] = [
        { id: 'connect', label: 'Connect' },
        { id: 'server',  label: 'Server'  },
        { id: 'channel', label: 'Channel' },
    ];

    return (
        <div className={Styles.card}>

            {/* ══ BANNER ══ */}
            <div className={`${Styles.banner} ${isConnected ? Styles.bannerConnected : ''}`}>
                {isConnected && (
                    <div className={Styles.bannerBubbles}>
                        <div className={Styles.bubble1} />
                        <div className={Styles.bubble2} />
                    </div>
                )}
            </div>

            {/* ══ AVATAR ROW ══ */}
            <div className={Styles.avatarRow}>
                <div className={Styles.avatarWrap}>
                    {avatarUrl
                        ? <img className={Styles.avatar} src={avatarUrl} alt={displayName} />
                        : <div className={`${Styles.avatarFallback} ${isConnected ? Styles.avatarFallbackConnected : ''}`}>
                            {isConnected ? initial : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" opacity="0.6">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                                </svg>
                            )}
                          </div>
                    }
                    <span
                        className={Styles.presenceDot}
                        style={{ background: isConnected ? '#23a55a' : isConnecting ? '#f0b232' : '#80848e' }}
                        title={isConnected ? 'Online' : isConnecting ? 'Connecting' : 'Offline'}
                    />
                </div>

                {/* action buttons top-right */}
                {isConnected && (
                    <button className={Styles.disconnectBtn} onClick={onDisconnect} title="Stop bot">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42A6.92 6.92 0 0 1 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.28 1.09-4.3 2.58-5.42L6.17 5.17A8.932 8.932 0 0 0 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/>
                        </svg>
                        Disconnect
                    </button>
                )}
            </div>

            {/* ══ PROFILE INFO ══ */}
            <div className={Styles.profileInfo}>
                <div className={Styles.nameRow}>
                    <span className={Styles.username}>{displayName}</span>
                    {isConnected && <span className={Styles.botBadge}>BOT</span>}
                </div>
                <StatusDot status={gatewayStatus} />
            </div>

            {/* ══ ACTIVITY — shown when connected ══ */}
            {isConnected && (
                <div className={Styles.activity}>
                    <div className={Styles.activityLabel}>Send a Message</div>
                    <div className={Styles.activityRow}>
                        {/* Server icon */}
                        <div className={Styles.activityIcon}>
                            {currentGuild?.icon
                                ? <img
                                    src={`https://cdn.discordapp.com/icons/${currentGuild.id}/${currentGuild.icon}.png?size=48`}
                                    className={Styles.activityIconImg}
                                    alt={currentGuild.name}
                                  />
                                : <div className={Styles.activityIconFallback}>
                                    {currentGuild ? currentGuild.name.charAt(0) : '#'}
                                  </div>
                            }
                        </div>
                        {/* Info */}
                        <div className={Styles.activityInfo}>
                            <div className={Styles.activityName}>
                                {currentGuild?.name || <span className={Styles.activityPlaceholder}>No server selected</span>}
                            </div>
                            <div className={Styles.activityDetail}>
                                {currentChannel?.label || <span className={Styles.activityPlaceholder}>No channel selected</span>}
                            </div>
                        </div>
                        {/* Send button */}
                        <button
                            className={Styles.sendBtn}
                            disabled={!channelId || sending}
                            onClick={onSend}
                            title="Send message"
                        >
                            {sending ? '…' : '↑ Send'}
                        </button>
                    </div>
                </div>
            )}

            {/* ══ DIVIDER ══ */}
            <div className={Styles.divider} />

            {/* ══ TABS ══ */}
            <div className={Styles.tabs}>
                {TABS.map(t => (
                    <button
                        key={t.id}
                        className={`${Styles.tabBtn} ${tab === t.id ? Styles.tabActive : ''}`}
                        onClick={() => setTab(t.id)}
                        disabled={t.id !== 'connect' && !isConnected}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ══ TAB CONTENT ══ */}
            <div className={Styles.tabContent}>

                {/* ── Connect tab ── */}
                {tab === 'connect' && (
                    <div className={Styles.connectTab}>
                        <div className={Styles.fieldLabel}>Bot Token</div>
                        <input
                            className={Styles.tokenInput}
                            placeholder="Paste your bot token here"
                            type="password"
                            value={botToken}
                            onChange={ev => {
                                setBotToken(ev.target.value);
                                if (isConnected) onDisconnect();
                                onClearError();
                            }}
                            onKeyDown={ev => { if (ev.key === 'Enter' && botToken.trim()) onConnect(); }}
                            autoComplete="off"
                        />

                        <div className={Styles.connectBtns}>
                            <button
                                className={Styles.startBtn}
                                disabled={!botToken.trim() || isConnecting}
                                onClick={onConnect}
                            >
                                {isConnecting
                                    ? <><span className={Styles.spinner} /> Starting…</>
                                    : isConnected
                                    ? '↺ Restart'
                                    : '▶ Start Bot'}
                            </button>
                            {isConnected && (
                                <button className={Styles.stopBtn} onClick={onDisconnect}>
                                    ■ Stop
                                </button>
                            )}
                        </div>

                        {(botConnectError || gatewayError) && (
                            <InlineAlert
                                type="error"
                                message={botConnectError || gatewayError!}
                                onDismiss={onClearError}
                            />
                        )}

                        <div className={Styles.securityNote}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{flexShrink:0, marginTop:1}}>
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                            </svg>
                            Token stored locally — never sent anywhere except Discord's API.
                        </div>
                    </div>
                )}

                {/* ── Server tab ── */}
                {tab === 'server' && isConnected && (
                    <div className={Styles.selectorTab}>
                        <div className={Styles.fieldLabel}>Select Server</div>
                        <Select
                            styles={{ ...select_styles, groupHeading: groupHeadingStyles }}
                            options={guildOptions}
                            value={selectedGuild}
                            onChange={opt => onGuildChange((opt as SelectOpt | null)?.value || '')}
                            placeholder="Choose a server…"
                            noOptionsMessage={() => 'No servers found'}
                            formatOptionLabel={(opt: any) => (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                    {opt.icon
                                        ? <img src={`https://cdn.discordapp.com/icons/${opt.value}/${opt.icon}.png?size=32`}
                                               style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0 }} />
                                        : <div style={{
                                            width: 22, height: 22, borderRadius: '50%', background: '#5865f2',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 9, color: '#fff', flexShrink: 0, fontWeight: 700,
                                          }}>{opt.label.charAt(0).toUpperCase()}</div>
                                    }
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {opt.label}
                                    </span>
                                </div>
                            )}
                        />
                        {guilds.length === 0 && (
                            <p className={Styles.emptyHint}>
                                No servers found. Make sure the bot is added to at least one server.
                            </p>
                        )}
                    </div>
                )}

                {/* ── Channel tab ── */}
                {tab === 'channel' && isConnected && (
                    <div className={Styles.selectorTab}>
                        {selectedGuildId ? (
                            <>
                                <div className={Styles.fieldLabel}>Select Channel</div>
                                <Select
                                    styles={{ ...select_styles, groupHeading: groupHeadingStyles }}
                                    options={channelOpts as any}
                                    value={selectedChannel}
                                    onChange={opt => onChannelChange((opt as SelectOpt | null)?.value || '')}
                                    isLoading={chLoading}
                                    placeholder={chLoading ? 'Loading channels…' : 'Choose a channel…'}
                                    isDisabled={chLoading}
                                    noOptionsMessage={() => 'No text channels found'}
                                />
                                <button
                                    className={Styles.sendBtnFull}
                                    disabled={!channelId || sending}
                                    onClick={onSend}
                                >
                                    {sending ? 'Sending…' : '↑ Send Message'}
                                </button>
                            </>
                        ) : (
                            <p className={Styles.emptyHint}>
                                Select a server first on the Server tab.
                            </p>
                        )}
                    </div>
                )}

                {/* Bot API response */}
                {botResponse && (
                    <ApiResponseCard response={botResponse} onDismiss={onClearResponse} />
                )}
            </div>
        </div>
    );
}
