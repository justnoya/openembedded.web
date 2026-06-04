import { useState, useRef, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';

const T = {
    blurple:      '#5865F2',
    blurpleDark:  '#4752C4',
    surface:      '#2B2D31',
    white:        '#FFFFFF',
    muted60:      'rgba(255,255,255,0.60)',
    muted50:      'rgba(255,255,255,0.50)',
    muted35:      'rgba(255,255,255,0.35)',
    label:        'rgba(255,255,255,0.85)',
    borderSubtle: 'rgba(255,255,255,0.15)',
};
const FONT = "'gg sans','Whitney','Segoe UI',sans-serif";

const DiscordLogo = ({ size = 36 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 71 55" fill="none">
        <path d="M60.1 4.9A58.6 58.6 0 0 0 45.5.7a40.7 40.7 0 0 0-1.8 3.7 54.2 54.2 0 0 0-16.3 0A40.8 40.8 0 0 0 25.6.7 58.5 58.5 0 0 0 11 4.9C1.6 19.4-1 33.5.3 47.4a59 59 0 0 0 18 9.1 44.6 44.6 0 0 0 3.9-6.3 38.5 38.5 0 0 1-6.1-2.9l1.5-1.1a42.2 42.2 0 0 0 35.8 0l1.5 1.1a38.5 38.5 0 0 1-6.1 2.9 44.5 44.5 0 0 0 3.9 6.3 58.8 58.8 0 0 0 18-9.1C72.1 31.2 68 17.2 60.1 4.9ZM23.7 39c-3.5 0-6.4-3.2-6.4-7.1s2.8-7.1 6.4-7.1c3.5 0 6.4 3.2 6.3 7.1 0 3.9-2.8 7.1-6.3 7.1Zm23.7 0c-3.5 0-6.4-3.2-6.4-7.1s2.8-7.1 6.4-7.1c3.5 0 6.4 3.2 6.3 7.1 0 3.9-2.8 7.1-6.3 7.1Z" fill="white"/>
    </svg>
);

const OpenEmbedLogo = ({ size = 36 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 100 100">
        <rect width="100" height="100" rx="14" fill="#5B5CF6"/>
        <defs>
            <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#dcdcec"/><stop offset="60%" stopColor="#ffffff"/>
            </linearGradient>
            <linearGradient id="lg2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff"/><stop offset="100%" stopColor="#d0d0e0"/>
            </linearGradient>
        </defs>
        <path d="M 47 14 A 36 36 0 1 0 47 86 L 47 72 A 22 22 0 1 1 47 28 Z" fill="url(#lg1)"/>
        <path d="M 53 14 A 36 36 0 1 1 53 86 L 53 72 A 22 22 0 1 0 53 28 Z" fill="url(#lg2)"/>
    </svg>
);

const AvatarPlaceholder = ({ size = 40 }: { size?: number }) => (
    <svg viewBox="0 0 40 40" width={size} height={size}>
        <circle cx="20" cy="20" r="20" fill="#4752C4"/>
        <circle cx="20" cy="16" r="8" fill="rgba(255,255,255,0.8)"/>
        <ellipse cx="20" cy="36" rx="13" ry="10" fill="rgba(255,255,255,0.8)"/>
    </svg>
);

const Chevron = ({ open }: { open: boolean }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
        style={{ transition: 'transform 0.22s cubic-bezier(.4,0,.2,1)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
        <path d="M4 6L8 10L12 6" stroke="#B5BAC1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const HashIcon = ({ color = '#80848E' }: { color?: string }) => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path d="M2.5 6h11M2.5 10h11M6.5 2.5L5 13.5M11 2.5L9.5 13.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);

const CheckIcon = ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
        <path d="M2 7l4 4 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const ArrowRight = () => (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const LinkIcon = () => (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L7.5 3.5" stroke="#B5BAC1" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5l1-1" stroke="#B5BAC1" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);

interface Guild {
    id:          string;
    name:        string;
    icon:        string | null;
    owner:       boolean;
    permissions: string;
}

interface Channel {
    id:   string;
    name: string;
    type: number;
}

function guildAbbr(name: string) {
    return name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function guildColor(id: string) {
    const COLORS = ['#E74C3C','#3498DB','#9B59B6','#F39C12','#1ABC9C','#5865F2','#E67E22','#2ECC71'];
    let n = 0;
    for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) >>> 0;
    return COLORS[n % COLORS.length];
}

interface DropdownItem {
    id:    string;
    name:  string;
    icon?: string | null;
    color?: string;
    abbr?:  string;
}

function DiscordDropdown({ label, items, type, value, onChange, loading, placeholder }: {
    label:        string;
    items:        DropdownItem[];
    type:         'server' | 'channel';
    value:        string | null;
    onChange:     (id: string) => void;
    loading?:     boolean;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const [hov,  setHov]  = useState<string | null>(null);
    const ref             = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const sel = items.find(i => i.id === value);

    return (
        <div ref={ref} style={{ fontFamily: FONT }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.9px', color: '#B5BAC1', marginBottom: 8 }}>{label}</div>
            <div
                onClick={() => !loading && setOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#1E1F22',
                    border: `1.5px solid ${open ? T.blurple : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: open ? '6px 6px 0 0' : 6,
                    padding: '9px 12px', cursor: loading ? 'default' : 'pointer', userSelect: 'none',
                    transition: 'border-color 0.15s',
                    boxShadow: open ? `0 0 0 1px ${T.blurple}` : 'none',
                    opacity: loading ? 0.6 : 1,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    {sel ? (
                        <>
                            {type === 'server' ? (
                                sel.icon
                                    ? <img src={`https://cdn.discordapp.com/icons/${sel.id}/${sel.icon}.webp?size=32`} alt="" style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0 }} />
                                    : <div style={{ width: 22, height: 22, borderRadius: 6, background: sel.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{sel.abbr}</div>
                            ) : (
                                <div style={{ width: 22, height: 22, borderRadius: 6, background: '#404249', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><HashIcon /></div>
                            )}
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#DBDEE1' }}>
                                {type === 'channel' ? `# ${sel.name}` : sel.name}
                            </span>
                        </>
                    ) : (
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#80848E' }}>
                            {loading ? 'Loading…' : (placeholder || `Select ${type}`)}
                        </span>
                    )}
                </div>
                {loading
                    ? <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#B5BAC1', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                    : <Chevron open={open} />
                }
            </div>

            {open && items.length > 0 && (
                <div style={{
                    background: '#111214',
                    border: '1.5px solid rgba(255,255,255,0.07)', borderTop: 'none',
                    borderRadius: '0 0 6px 6px',
                    maxHeight: 190, overflowY: 'auto',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.55)',
                    scrollbarWidth: 'thin', scrollbarColor: '#2E2F34 transparent',
                }}>
                    <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#4E5058' }}>
                            {type === 'server' ? `${items.length} server${items.length !== 1 ? 's' : ''}` : `${items.length} channel${items.length !== 1 ? 's' : ''}`}
                        </span>
                    </div>
                    {items.map(item => (
                        <div key={item.id}
                            onMouseEnter={() => setHov(item.id)}
                            onMouseLeave={() => setHov(null)}
                            onClick={() => { onChange(item.id); setOpen(false); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '8px 12px', cursor: 'pointer',
                                background: hov === item.id ? '#1E2029' : 'transparent',
                                transition: 'background 0.1s',
                            }}
                        >
                            {type === 'server' ? (
                                item.icon
                                    ? <img src={`https://cdn.discordapp.com/icons/${item.id}/${item.icon}.webp?size=32`} alt="" style={{ width: 30, height: 30, borderRadius: hov === item.id ? '50%' : 10, flexShrink: 0, transition: 'border-radius 0.18s' }} />
                                    : <div style={{
                                        width: 30, height: 30,
                                        borderRadius: hov === item.id ? '50%' : 10,
                                        background: item.color,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
                                        transition: 'border-radius 0.18s',
                                    }}>{item.abbr}</div>
                            ) : (
                                <div style={{ width: 30, height: 30, borderRadius: 8, background: hov === item.id ? '#404249' : '#2B2D31', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.1s' }}>
                                    <HashIcon color={hov === item.id ? '#DBDEE1' : '#80848E'} />
                                </div>
                            )}
                            <span style={{ fontSize: 13, fontWeight: 500, color: hov === item.id ? '#fff' : '#DBDEE1', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.1s' }}>
                                {type === 'channel' ? `# ${item.name}` : item.name}
                            </span>
                            {value === item.id && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.5L5.5 10.5L11.5 4.5" stroke={T.blurple} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                    ))}
                    {open && items.length === 0 && !loading && (
                        <div style={{ padding: '12px', textAlign: 'center', fontSize: 12, color: '#4E5058', fontFamily: FONT }}>
                            No {type === 'server' ? 'servers' : 'channels'} found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: '#DBDEE1', fontFamily: FONT }}>{label}</span>
            <div onClick={() => onChange(!on)} style={{ width: 36, height: 20, borderRadius: 10, background: on ? T.blurple : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 3, left: on ? 19 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }}/>
            </div>
        </div>
    );
}

function LoadingScreen({ serverName, channelName, onDone }: { serverName: string; channelName: string; onDone: () => void }) {
    const [phase, setPhase] = useState(0);
    const [dots,  setDots]  = useState(0);

    useEffect(() => {
        const dt = setInterval(() => setDots(d => (d + 1) % 4), 380);
        const t1 = setTimeout(() => setPhase(1), 1400);
        const t2 = setTimeout(() => setPhase(2), 2700);
        const t3 = setTimeout(() => onDone(),    3900);
        return () => { clearInterval(dt); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);

    const steps = [
        { label: 'Connecting to server', done: phase >= 1 },
        { label: 'Verifying webhook',    done: phase >= 2 },
        { label: 'Finalizing setup',     done: phase >= 3 },
    ];

    return (
        <div style={{ background: T.surface, padding: '28px 20px 24px', minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', marginBottom: 20 }}>
                <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: phase === 2 ? '#23A55A' : T.blurple,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.4s',
                    animation: phase < 2 ? 'orbPulse 1.4s ease-in-out infinite' : 'none',
                }}>
                    {phase === 2 ? <CheckIcon size={22}/> : <OpenEmbedLogo size={30}/>}
                </div>
                {phase < 2 && (
                    <div style={{ position: 'absolute', inset: -7, borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'rgba(255,255,255,0.5)', borderRightColor: 'rgba(255,255,255,0.15)', animation: 'spin 0.9s linear infinite' }}/>
                )}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#DBDEE1', fontFamily: FONT, marginBottom: 4, textAlign: 'center' }}>
                {phase === 2 ? 'All set!' : `Setting up${'.'.repeat(dots)}`}
            </div>
            <div style={{ fontSize: 12, color: '#80848E', fontFamily: FONT, marginBottom: 20, textAlign: 'center' }}>
                {phase === 2 ? `Webhook live in #${channelName}` : 'Configuring your webhook…'}
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {steps.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: i <= phase ? 1 : 0.35, transition: 'opacity 0.3s' }}>
                        <div style={{
                            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                            background: s.done ? '#23A55A' : i === phase ? T.blurple : 'rgba(255,255,255,0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.3s',
                        }}>
                            {s.done
                                ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5.5L4 7.5L8 3.5" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                : i === phase
                                    ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white', animation: 'dotBlink 0.8s ease-in-out infinite' }}/>
                                    : <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}/>
                            }
                        </div>
                        <span style={{ fontSize: 12, fontWeight: i <= phase ? 500 : 400, color: s.done ? '#DBDEE1' : i === phase ? '#fff' : '#4E5058', fontFamily: FONT, transition: 'color 0.3s' }}>{s.label}</span>
                    </div>
                ))}
            </div>
            {serverName && channelName && (
                <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '5px 12px' }}>
                    <span style={{ fontSize: 11, color: '#B5BAC1', fontFamily: FONT }}>{serverName}</span>
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>›</span>
                    <HashIcon color="#80848E"/>
                    <span style={{ fontSize: 11, color: '#B5BAC1', fontFamily: FONT }}>{channelName}</span>
                </div>
            )}
        </div>
    );
}

function SuccessScreen({ serverName, channelName, webhookUrl, onReset }: {
    serverName:  string;
    channelName: string;
    webhookUrl:  string;
    onReset:     () => void;
}) {
    const [copied, setCopied] = useState(false);

    return (
        <div style={{ background: T.surface, padding: '18px 16px 20px', minHeight: 220 }}>
            <div style={{ background: 'rgba(35,165,90,0.12)', border: '1px solid rgba(35,165,90,0.3)', borderRadius: 6, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#23A55A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckIcon size={12}/>
                </div>
                <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#23A55A', fontFamily: FONT }}>Webhook Connected</div>
                    <div style={{ fontSize: 11, color: '#80848E', fontFamily: FONT, marginTop: 1 }}>
                        Messages will post to <span style={{ color: '#B5BAC1' }}>#{channelName}</span>
                    </div>
                </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.9px', color: '#B5BAC1', marginBottom: 8, fontFamily: FONT }}>Configuration</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#80848E', fontFamily: FONT }}>Server</span>
                    <span style={{ fontSize: 12, color: '#DBDEE1', fontFamily: FONT }}>{serverName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#80848E', fontFamily: FONT }}>Channel</span>
                    <span style={{ fontSize: 12, color: '#DBDEE1', fontFamily: FONT }}>#{channelName}</span>
                </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.9px', color: '#B5BAC1', marginBottom: 8, fontFamily: FONT }}>Webhook URL</div>
            <div
                onClick={() => { navigator.clipboard.writeText(webhookUrl).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                style={{ background: '#1E1F22', border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '8px 10px', cursor: 'pointer', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}
            >
                <LinkIcon/>
                <span style={{ fontSize: 11, color: '#80848E', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {webhookUrl || 'https://discord.com/api/webhooks/••••••••'}
                </span>
                <span style={{ fontSize: 11, color: copied ? '#23A55A' : T.blurple, fontFamily: FONT, flexShrink: 0, fontWeight: 600 }}>
                    {copied ? 'Copied!' : 'Copy'}
                </span>
            </div>

            <div onClick={onReset} style={{ fontSize: 12, color: '#80848E', fontFamily: FONT, cursor: 'pointer', textAlign: 'center' }}>
                Start over
            </div>
        </div>
    );
}

function SetupPanel() {
    const [step,    setStep]    = useState<'server'|'channel'|'config'|'loading'|'done'>('server');
    const [guilds,  setGuilds]  = useState<Guild[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [guildsLoading,   setGuildsLoading]   = useState(false);
    const [channelsLoading, setChannelsLoading] = useState(false);
    const [guildsError,     setGuildsError]     = useState('');
    const [channelsError,   setChannelsError]   = useState('');
    const [requiresDiscord, setRequiresDiscord] = useState(false);
    const [server,   setServer]   = useState<string | null>(null);
    const [channel,  setChannel]  = useState<string | null>(null);
    const [webhook,  setWebhook]  = useState('');
    const [urlFocus, setUrlFocus] = useState(false);
    const [notify,   setNotify]   = useState(true);
    const [mentions, setMentions] = useState(false);
    const [btnHov,   setBtnHov]   = useState(false);

    useEffect(() => {
        setGuildsLoading(true);
        setGuildsError('');
        fetch('/api/auth/guilds', { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                if (data.requiresDiscord) {
                    setRequiresDiscord(true);
                } else if (data.error) {
                    setGuildsError(data.error);
                } else {
                    const sorted = [...(data.guilds || [])].sort((a: Guild, b: Guild) => a.name.localeCompare(b.name));
                    setGuilds(sorted);
                }
            })
            .catch(() => setGuildsError('Failed to load servers.'))
            .finally(() => setGuildsLoading(false));
    }, []);

    const selectServer = (id: string) => {
        setServer(id);
        setChannel(null);
        setChannels([]);
        setChannelsError('');
        setChannelsLoading(true);
        fetch(`/api/bot/guilds/${id}/channels`, { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const text = data
                        .filter((c: Channel) => c.type === 0)
                        .sort((a: Channel, b: Channel) => a.name.localeCompare(b.name));
                    setChannels(text);
                } else {
                    setChannelsError(data?.message || 'Could not load channels. Is the bot in this server?');
                }
            })
            .catch(() => setChannelsError('Failed to load channels.'))
            .finally(() => setChannelsLoading(false));
    };

    const guildItems: DropdownItem[] = guilds.map(g => ({
        id:    g.id,
        name:  g.name,
        icon:  g.icon,
        color: guildColor(g.id),
        abbr:  guildAbbr(g.name),
    }));

    const channelItems: DropdownItem[] = channels.map(c => ({
        id:   c.id,
        name: c.name,
    }));

    const selGuild   = guilds.find(g => g.id === server);
    const selChannel = channels.find(c => c.id === channel);

    const NxtBtn = ({ onClick, label = 'Next', icon = <ArrowRight/> }: { onClick: () => void; label?: string; icon?: React.ReactNode }) => (
        <button onClick={onClick}
            onMouseEnter={() => setBtnHov(true)} onMouseLeave={() => setBtnHov(false)}
            style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: btnHov ? T.blurpleDark : T.blurple,
                border: 'none', borderRadius: 4, padding: '7px 16px',
                fontSize: 13, fontWeight: 600, color: T.white,
                fontFamily: FONT, cursor: 'pointer',
                transition: 'background 0.15s',
                boxShadow: btnHov ? '0 2px 12px rgba(88,101,242,0.45)' : '0 2px 8px rgba(88,101,242,0.3)',
            }}
        >{label}{icon}</button>
    );

    const BackLink = ({ onClick }: { onClick: () => void }) => (
        <span onClick={onClick} style={{ fontSize: 12, color: '#80848E', fontFamily: FONT, cursor: 'pointer' }}>← Back</span>
    );

    const StepDots = () => {
        const steps: Array<'server'|'channel'|'config'> = ['server', 'channel', 'config'];
        const idx = steps.indexOf(step as any);
        return (
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px 0', gap: 0, marginBottom: 0 }}>
                {steps.map((s, i) => {
                    const done = i < idx, curr = i === idx;
                    return (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : undefined }}>
                            <div style={{
                                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                                background: done || curr ? T.blurple : 'rgba(255,255,255,0.08)',
                                border: curr ? '2px solid rgba(255,255,255,0.3)' : 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background 0.25s',
                            }}>
                                {done
                                    ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5.5L4 7.5L8 3.5" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    : <span style={{ fontSize: 10, fontWeight: 700, color: curr ? '#fff' : '#4E5058' }}>{i + 1}</span>
                                }
                            </div>
                            {i < steps.length - 1 && (
                                <div style={{ flex: 1, height: 1.5, margin: '0 4px', background: done ? T.blurple : 'rgba(255,255,255,0.08)', transition: 'background 0.25s' }}/>
                            )}
                        </div>
                    );
                })}
                <span style={{ fontSize: 11, fontWeight: 600, color: '#B5BAC1', marginLeft: 10, textTransform: 'uppercase', letterSpacing: '0.7px', fontFamily: FONT }}>
                    {step === 'server' ? 'Server' : step === 'channel' ? 'Channel' : 'Config'}
                </span>
            </div>
        );
    };

    if (step === 'loading') return (
        <LoadingScreen
            serverName={selGuild?.name || ''}
            channelName={selChannel?.name || ''}
            onDone={() => setStep('done')}
        />
    );
    if (step === 'done') return (
        <SuccessScreen
            serverName={selGuild?.name || ''}
            channelName={selChannel?.name || ''}
            webhookUrl={webhook}
            onReset={() => { setStep('server'); setServer(null); setChannel(null); setWebhook(''); setChannels([]); }}
        />
    );

    return (
        <div style={{ background: T.surface }}>
            <StepDots/>
            <div style={{ padding: '12px 16px 18px' }}>

                {/* ── Step 1: Server ── */}
                {step === 'server' && (
                    <>
                        {requiresDiscord ? (
                            <div style={{ background: 'rgba(88,101,242,0.1)', border: '1px solid rgba(88,101,242,0.25)', borderRadius: 8, padding: '14px 16px', textAlign: 'center' }}>
                                <div style={{ fontSize: 22, marginBottom: 6 }}>🔑</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#DBDEE1', fontFamily: FONT, marginBottom: 4 }}>Discord login required</div>
                                <div style={{ fontSize: 12, color: '#80848E', fontFamily: FONT, lineHeight: 1.5 }}>
                                    Sign in with Discord to see your servers where you have admin or ownership permissions.
                                </div>
                            </div>
                        ) : guildsError ? (
                            <div style={{ background: 'rgba(240,71,71,0.1)', border: '1px solid rgba(240,71,71,0.25)', borderRadius: 6, padding: '10px 12px', fontSize: 12, color: '#f04747', fontFamily: FONT }}>{guildsError}</div>
                        ) : (
                            <>
                                <DiscordDropdown
                                    label="Select Server"
                                    items={guildItems}
                                    type="server"
                                    value={server}
                                    onChange={selectServer}
                                    loading={guildsLoading}
                                    placeholder={guildsLoading ? 'Loading servers…' : guilds.length === 0 ? 'No admin servers found' : 'Choose a server'}
                                />
                                {!guildsLoading && guilds.length === 0 && (
                                    <div style={{ marginTop: 8, fontSize: 11, color: '#4E5058', fontFamily: FONT, lineHeight: 1.5 }}>
                                        No servers where you have Administrator permissions or ownership were found.
                                    </div>
                                )}
                                {server && (
                                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                                        <NxtBtn onClick={() => setStep('channel')}/>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* ── Step 2: Channel ── */}
                {step === 'channel' && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                            {selGuild?.icon
                                ? <img src={`https://cdn.discordapp.com/icons/${selGuild.id}/${selGuild.icon}.webp?size=16`} alt="" style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0 }} />
                                : <div style={{ width: 16, height: 16, borderRadius: 5, background: guildColor(selGuild?.id || ''), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}>{guildAbbr(selGuild?.name || '')}</div>
                            }
                            <span style={{ fontSize: 12, color: '#80848E', fontFamily: FONT }}>{selGuild?.name}</span>
                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>›</span>
                            <span style={{ fontSize: 12, color: '#B5BAC1', fontWeight: 500, fontFamily: FONT }}>Pick a channel</span>
                        </div>
                        {channelsError ? (
                            <div style={{ background: 'rgba(240,71,71,0.1)', border: '1px solid rgba(240,71,71,0.25)', borderRadius: 6, padding: '10px 12px', fontSize: 12, color: '#f04747', fontFamily: FONT }}>{channelsError}</div>
                        ) : (
                            <DiscordDropdown
                                label="Select Channel"
                                items={channelItems}
                                type="channel"
                                value={channel}
                                onChange={setChannel}
                                loading={channelsLoading}
                                placeholder={channelsLoading ? 'Loading channels…' : 'Choose a channel'}
                            />
                        )}
                        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <BackLink onClick={() => setStep('server')}/>
                            {channel && !channelsError && <NxtBtn onClick={() => setStep('config')}/>}
                        </div>
                    </>
                )}

                {/* ── Step 3: Config ── */}
                {step === 'config' && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14, flexWrap: 'wrap' }}>
                            {selGuild?.icon
                                ? <img src={`https://cdn.discordapp.com/icons/${selGuild.id}/${selGuild.icon}.webp?size=16`} alt="" style={{ width: 14, height: 14, borderRadius: 4, flexShrink: 0 }} />
                                : <div style={{ width: 14, height: 14, borderRadius: 4, background: guildColor(selGuild?.id || ''), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}>{guildAbbr(selGuild?.name || '')}</div>
                            }
                            <span style={{ fontSize: 11, color: '#80848E', fontFamily: FONT }}>{selGuild?.name}</span>
                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>›</span>
                            <span style={{ fontSize: 11, color: '#80848E', fontFamily: FONT }}>#{selChannel?.name}</span>
                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>›</span>
                            <span style={{ fontSize: 11, color: '#B5BAC1', fontWeight: 500, fontFamily: FONT }}>Config</span>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.9px', color: '#B5BAC1', marginBottom: 8, fontFamily: FONT }}>Webhook URL</div>
                            <div style={{
                                display: 'flex', alignItems: 'center',
                                background: '#1E1F22',
                                border: `1.5px solid ${urlFocus ? T.blurple : 'rgba(255,255,255,0.08)'}`,
                                borderRadius: 6, padding: '0 10px',
                                boxShadow: urlFocus ? '0 0 0 1px rgba(88,101,242,0.35)' : 'none',
                                transition: 'border-color 0.15s, box-shadow 0.15s',
                            }}>
                                <LinkIcon/>
                                <input type="text" value={webhook} onChange={e => setWebhook(e.target.value)}
                                    onFocus={() => setUrlFocus(true)} onBlur={() => setUrlFocus(false)}
                                    placeholder="https://discord.com/api/webhooks/…"
                                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: '#DBDEE1', fontFamily: FONT, padding: '9px 8px' }}/>
                            </div>
                            <div style={{ fontSize: 11, color: '#4E5058', marginTop: 5, fontFamily: FONT }}>Paste your Discord server webhook URL</div>
                        </div>

                        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 14 }}/>

                        <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.9px', color: '#B5BAC1', marginBottom: 10, fontFamily: FONT }}>Options</div>
                            <Toggle label="Send notifications" on={notify}   onChange={setNotify}/>
                            <Toggle label="Allow @mentions"    on={mentions} onChange={setMentions}/>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <BackLink onClick={() => setStep('channel')}/>
                            <NxtBtn onClick={() => setStep('loading')} label="Confirm" icon={<CheckIcon size={13}/>}/>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function UserInfoPanel({ user }: { user: ReturnType<typeof useAuth>['user'] }) {
    const isDiscord = user?.provider === 'discord';
    const displayName = user?.username || user?.email?.split('@')[0] || 'Unknown';
    const avatarUrl = isDiscord && user?.avatar && user?.id
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
        : null;

    return (
        <div style={{ background: T.surface, padding: 16, minHeight: 180 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: T.label, marginBottom: 12, fontFamily: FONT }}>Account</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#4752C4' }}>
                    {avatarUrl
                        ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <AvatarPlaceholder size={40} />
                    }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
                    {user?.email && (
                        <div style={{ fontSize: 11, color: '#80848E', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{user.email}</div>
                    )}
                </div>
                <div style={{
                    fontSize: 10, fontWeight: 700, color: isDiscord ? '#fff' : '#B5BAC1',
                    background: isDiscord ? T.blurple : 'rgba(255,255,255,0.08)',
                    borderRadius: 20, padding: '2px 8px', letterSpacing: '0.05em',
                    fontFamily: FONT, flexShrink: 0,
                }}>
                    {isDiscord ? 'Discord' : 'Email'}
                </div>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 12 }} />

            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: T.label, marginBottom: 8, fontFamily: FONT }}>About</div>
            <div style={{ fontSize: 12, color: '#80848E', fontFamily: FONT, lineHeight: 1.6 }}>
                Build and send Discord message components — buttons, embeds, select menus, and more — directly to your server via webhook or bot.
            </div>
            {!isDiscord && (
                <div style={{ marginTop: 12, background: 'rgba(88,101,242,0.1)', border: '1px solid rgba(88,101,242,0.2)', borderRadius: 6, padding: '8px 10px', fontSize: 11, color: '#7289da', fontFamily: FONT, lineHeight: 1.5 }}>
                    Sign in with Discord to unlock server integration and Rich Presence features.
                </div>
            )}
        </div>
    );
}

const TABS = [
    { id: 'info',  label: 'User\nInfo' },
    { id: 'setup', label: 'Setup', icon: true },
];

export function DiscordCard() {
    const { user } = useAuth();
    const [tab,     setTab]     = useState('info');
    const [elapsed, setElapsed] = useState('1:24:07');

    useEffect(() => {
        let s = 5047;
        const t = setInterval(() => {
            s++;
            const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
            setElapsed(`${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(t);
    }, []);

    const displayName = user?.username || user?.email?.split('@')[0] || '…';
    const avatarUrl = user?.provider === 'discord' && user?.avatar && user?.id
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
        : null;

    return (
        <div style={{ fontFamily: FONT }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg) } }
                @keyframes orbPulse {
                    0%,100% { box-shadow: 0 0 0 0 rgba(88,101,242,0.5), 0 0 20px rgba(88,101,242,0.3); }
                    50%     { box-shadow: 0 0 0 8px rgba(88,101,242,0), 0 0 28px rgba(88,101,242,0.5); }
                }
                @keyframes dotBlink {
                    0%,100% { opacity:1; transform:scale(1); }
                    50%     { opacity:0.4; transform:scale(0.7); }
                }
            `}</style>

            <div style={{ width: 340, borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>

                {/* ── Blurple top panel ── */}
                <div style={{ background: T.blurple, padding: '16px 16px 0 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', marginRight: 12, flexShrink: 0, background: '#4752C4' }}>
                            {avatarUrl
                                ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <AvatarPlaceholder size={40} />
                            }
                        </div>
                        <span style={{ fontSize: 18, fontWeight: 700, color: T.white, lineHeight: 1.2, fontFamily: FONT }}>{displayName}</span>
                    </div>

                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: T.label, marginBottom: 8, fontFamily: FONT }}>
                        Playing a Game
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
                        <div style={{ width: 64, height: 64, borderRadius: 6, background: T.blurpleDark, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <DiscordLogo size={36}/>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: T.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>OpenEmbedded</div>
                            <div style={{ fontSize: 12, color: T.muted60, marginTop: 2 }}>Building Discord components</div>
                            <div style={{ fontSize: 12, color: T.muted50, marginTop: 2 }}>{elapsed} elapsed</div>
                        </div>
                    </div>

                    {/* ── Tabs ── */}
                    <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.12)', marginTop: 4 }}>
                        {TABS.map(t => (
                            <div key={t.id}
                                onClick={() => setTab(t.id)}
                                style={{
                                    flex: 1, padding: '8px 4px 10px', cursor: 'pointer', textAlign: 'center',
                                    borderBottom: tab === t.id ? `2px solid ${T.white}` : '2px solid transparent',
                                    transition: 'border-color 0.15s',
                                }}
                            >
                                <span style={{
                                    fontSize: 11, fontWeight: tab === t.id ? 700 : 500,
                                    color: tab === t.id ? T.white : T.muted50,
                                    whiteSpace: 'pre-line', lineHeight: 1.25,
                                    transition: 'color 0.15s', fontFamily: FONT,
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                }}>
                                    {t.icon && <svg width="11" height="11" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
                                    {t.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Tab panels ── */}
                <div>
                    {tab === 'info'  && <UserInfoPanel user={user} />}
                    {tab === 'setup' && <SetupPanel />}
                </div>
            </div>
        </div>
    );
}
