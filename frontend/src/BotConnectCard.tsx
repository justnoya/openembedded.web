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

const TABS: { id: Tab; label: string }[] = [
    { id: 'connect', label: 'User Info'       },
    { id: 'server',  label: 'Mutual Servers'  },
    { id: 'channel', label: 'Mutual Friends'  },
];

/* Discord logo SVG used as fallback activity icon */
function DiscordIcon() {
    return (
        <svg width="28" height="22" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.44077 45.4204 0.52529C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.52529C25.5141 0.44359 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.292408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6953 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="rgba(255,255,255,0.5)"/>
        </svg>
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
    const displayName = botUser?.username || 'OpenEmbedded';

    /* ── Status dot color ── */
    const dotColor = isConnected ? '#23a55a' : isConnecting ? '#f0b232' : '#80848e';

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

    const currentGuild   = guilds.find(g => g.id === selectedGuildId);
    const currentChannel = allFlat.find(c => c.value === channelId);

    /* ── Activity label + detail lines ── */
    const activityLine1 = currentGuild?.name  || 'No server selected';
    const activityLine2 = currentChannel?.label || 'No channel selected';
    const activityLine3 = isConnected ? 'Ready to send' : isConnecting ? 'Connecting…' : 'Paste token → User Info';

    return (
        <div className={Styles.card}>

            {/* ══ BLURPLE TOP SECTION ══ */}
            <div className={Styles.topSection}>

                {/* Avatar + username row */}
                <div className={Styles.avatarNameRow}>
                    <div className={Styles.avatarWrap}>
                        {avatarUrl
                            ? <img className={Styles.avatar} src={avatarUrl} alt={displayName} />
                            : (
                                <div className={Styles.avatarFallback}>
                                    <img src="/logo.png" alt="OpenEmbedded" />
                                </div>
                            )
                        }
                        <span className={Styles.presenceDot} style={{ background: dotColor }} />
                    </div>

                    <div>
                        <span className={Styles.username}>
                            {displayName}
                            {isConnected && <span className={Styles.botBadge}>BOT</span>}
                        </span>
                    </div>
                </div>

                {/* Activity / send card */}
                <div className={Styles.activitySection}>
                    <div className={Styles.activityLabel}>
                        {isConnected ? 'Sending a Message' : 'Bot Connection'}
                    </div>

                    <div className={Styles.activityCard}>
                        {/* Icon */}
                        <div className={Styles.activityIcon}>
                            {isConnected && currentGuild?.icon
                                ? <img
                                    src={`https://cdn.discordapp.com/icons/${currentGuild.id}/${currentGuild.icon}.png?size=48`}
                                    className={Styles.activityIconImg}
                                    alt={currentGuild.name}
                                  />
                                : <div className={Styles.activityIconFallback}><DiscordIcon /></div>
                            }
                        </div>

                        {/* Text info */}
                        <div className={Styles.activityInfo}>
                            <div className={Styles.activityName}>
                                {isConnected
                                    ? (currentGuild?.name || <span className={Styles.activityPlaceholder}>No server</span>)
                                    : 'OpenEmbed...'
                                }
                            </div>
                            <div className={Styles.activityDetail}>
                                {isConnected
                                    ? (currentChannel?.label || <span className={Styles.activityPlaceholder}>No channel</span>)
                                    : (isConnecting ? 'Connecting…' : 'Competitive')
                                }
                            </div>
                            <div className={Styles.activityDetail2}>
                                {isConnected ? 'Ready to send' : (isConnecting ? 'Please wait…' : 'Playing Solo...')}
                            </div>
                        </div>

                        {/* Action button */}
                        <button
                            className={Styles.askToJoinBtn}
                            disabled={!isConnected || !channelId || sending}
                            onClick={isConnected ? onSend : undefined}
                            title={isConnected ? 'Send message' : 'Connect a bot first'}
                        >
                            {sending ? '…' : isConnected ? '↑ Send' : 'Ask to Join'}
                        </button>
                    </div>
                </div>

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
            </div>

            {/* ══ DARK BOTTOM SECTION ══ */}
            <div className={Styles.bottomSection}>
                <div className={Styles.noteLabel}>
                    {tab === 'connect' ? 'Note' : tab === 'server' ? 'Server' : 'Channel'}
                </div>

                {/* ── User Info (connect) tab ── */}
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

                {/* ── Mutual Servers (server) tab ── */}
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

                {/* ── Mutual Friends (channel) tab ── */}
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
                                Select a server first on the Mutual Servers tab.
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
