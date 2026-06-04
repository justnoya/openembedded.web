import { useState, useRef, useEffect } from 'react';

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
    borderBtn:    'rgba(255,255,255,0.30)',
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

const AvatarPlaceholder = () => (
    <svg viewBox="0 0 40 40" width="40" height="40">
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

const SERVERS = [
    { id: 1, name: 'Anime & Chill',  color: '#E74C3C', abbr: 'A' },
    { id: 2, name: 'Dev Hub',        color: '#3498DB', abbr: 'D' },
    { id: 3, name: 'Design System',  color: '#9B59B6', abbr: 'D' },
    { id: 4, name: 'Music Lounge',   color: '#F39C12', abbr: 'M' },
    { id: 5, name: 'OpenEmbed HQ',   color: '#5865F2', abbr: 'O' },
    { id: 6, name: 'Chill Zone',     color: '#1ABC9C', abbr: 'C' },
];

const CHANNELS = [
    { id: 1, name: 'general' },
    { id: 2, name: 'announcements' },
    { id: 3, name: 'bot-commands' },
    { id: 4, name: 'media' },
    { id: 5, name: 'introductions' },
    { id: 6, name: 'off-topic' },
];

const FRIENDS = [
    { id: 1, name: 'luna.dev',    avatar: '#E74C3C' },
    { id: 2, name: 'pixel_cat',   avatar: '#9B59B6' },
    { id: 3, name: 'neon.rabbit', avatar: '#F39C12' },
    { id: 4, name: 'ghostwave',   avatar: '#1ABC9C' },
];

interface DropdownItem {
    id: number;
    name: string;
    color?: string;
    abbr?: string;
}

function DiscordDropdown({ label, items, type, value, onChange }: {
    label: string;
    items: DropdownItem[];
    type: 'server' | 'channel';
    value: number | null;
    onChange: (id: number) => void;
}) {
    const [open, setOpen] = useState(false);
    const [hov, setHov]   = useState<number | null>(null);
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
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#1E1F22',
                    border: `1.5px solid ${open ? T.blurple : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: open ? '6px 6px 0 0' : 6,
                    padding: '9px 12px', cursor: 'pointer', userSelect: 'none',
                    transition: 'border-color 0.15s',
                    boxShadow: open ? `0 0 0 1px ${T.blurple}` : 'none',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    {sel ? (
                        <>
                            {type === 'server' ? (
                                <div style={{ width: 22, height: 22, borderRadius: 6, background: sel.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{sel.abbr}</div>
                            ) : (
                                <div style={{ width: 22, height: 22, borderRadius: 6, background: '#404249', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><HashIcon /></div>
                            )}
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#DBDEE1' }}>
                                {type === 'channel' ? `# ${sel.name}` : sel.name}
                            </span>
                        </>
                    ) : (
                        <>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#23A55A', boxShadow: '0 0 0 2.5px rgba(35,165,90,0.22)', flexShrink: 0 }}/>
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#B5BAC1' }}>
                                {items.length} {type === 'server' ? 'Mutual Servers' : 'Available'}
                            </span>
                        </>
                    )}
                </div>
                <Chevron open={open} />
            </div>

            {open && (
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
                            {type === 'server' ? `${items.length} Mutual Servers` : `${items.length} Channels`}
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
                                <div style={{
                                    width: 30, height: 30,
                                    borderRadius: hov === item.id ? '50%' : 10,
                                    background: item.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                                    boxShadow: hov === item.id ? `0 2px 8px ${item.color}66` : 'none',
                                    transition: 'border-radius 0.18s, box-shadow 0.18s',
                                    userSelect: 'none',
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
                </div>
            )}
        </div>
    );
}

function UserInfoPanel({ note, setNote, editing, setEditing }: {
    note: string;
    setNote: (v: string) => void;
    editing: boolean;
    setEditing: (v: boolean) => void;
}) {
    return (
        <div style={{ background: T.surface, padding: 16, minHeight: 180 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: T.label, marginBottom: 8, fontFamily: FONT }}>Note</div>
            {editing ? (
                <textarea
                    autoFocus
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    onBlur={() => setEditing(false)}
                    placeholder="Click to add note"
                    style={{
                        width: '100%', background: 'rgba(255,255,255,0.04)',
                        border: `1.5px solid rgba(88,101,242,0.65)`,
                        borderRadius: 4, outline: 'none', resize: 'none',
                        fontSize: 14, fontWeight: 400, color: T.white,
                        fontFamily: FONT, lineHeight: 1.5,
                        padding: '0',
                        minHeight: 60,
                        boxShadow: '0 0 0 1px rgba(88,101,242,0.25)',
                    }}
                />
            ) : (
                <div
                    onClick={() => setEditing(true)}
                    style={{ fontSize: 14, fontWeight: 400, color: note ? T.white : T.muted35, cursor: 'text', fontFamily: FONT, lineHeight: 1.5 }}
                >
                    {note || 'Click to add note'}
                </div>
            )}
        </div>
    );
}

function MutualServersPanel() {
    const [val, setVal] = useState<number | null>(null);
    return (
        <div style={{ background: T.surface, padding: 16, minHeight: 180 }}>
            <DiscordDropdown label="Mutual Servers" items={SERVERS} type="server" value={val} onChange={setVal}/>
        </div>
    );
}

function MutualFriendsPanel() {
    return (
        <div style={{ background: T.surface, padding: 16, minHeight: 180 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.9px', color: '#B5BAC1', marginBottom: 10, fontFamily: FONT }}>
                Mutual Friends
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {FRIENDS.map(f => (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: f.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                            {f.name[0].toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#DBDEE1', fontFamily: FONT }}>{f.name}</span>
                    </div>
                ))}
            </div>
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

function LoadingScreen({ server, channel, onDone }: { server: number | null; channel: number | null; onDone: () => void }) {
    const [phase, setPhase] = useState(0);
    const [dots, setDots]   = useState(0);
    const svr = SERVERS.find(s => s.id === server);
    const ch  = CHANNELS.find(c => c.id === channel);

    useEffect(() => {
        const dt = setInterval(() => setDots(d => (d + 1) % 4), 380);
        const t1 = setTimeout(() => setPhase(1), 1400);
        const t2 = setTimeout(() => setPhase(2), 2700);
        const t3 = setTimeout(() => onDone(), 3900);
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
                {phase === 2 ? `Webhook live in #${ch?.name}` : 'Configuring your webhook…'}
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
            {svr && ch && (
                <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '5px 12px' }}>
                    <div style={{ width: 14, height: 14, borderRadius: 4, background: svr.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}>{svr.abbr}</div>
                    <span style={{ fontSize: 11, color: '#B5BAC1', fontFamily: FONT }}>{svr.name}</span>
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>›</span>
                    <HashIcon color="#80848E"/>
                    <span style={{ fontSize: 11, color: '#B5BAC1', fontFamily: FONT }}>{ch.name}</span>
                </div>
            )}
        </div>
    );
}

function SuccessScreen({ server, channel, webhookUrl, onReset }: { server: number | null; channel: number | null; webhookUrl: string; onReset: () => void }) {
    const svr = SERVERS.find(s => s.id === server);
    const ch  = CHANNELS.find(c => c.id === channel);
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
                        Messages will post to <span style={{ color: '#B5BAC1' }}>#{ch?.name}</span>
                    </div>
                </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.9px', color: '#B5BAC1', marginBottom: 8, fontFamily: FONT }}>Configuration</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#80848E', fontFamily: FONT }}>Server</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 4, background: svr?.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}>{svr?.abbr}</div>
                        <span style={{ fontSize: 12, color: '#DBDEE1', fontFamily: FONT }}>{svr?.name}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#80848E', fontFamily: FONT }}>Channel</span>
                    <span style={{ fontSize: 12, color: '#DBDEE1', fontFamily: FONT }}>#{ch?.name}</span>
                </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.9px', color: '#B5BAC1', marginBottom: 8, fontFamily: FONT }}>Webhook URL</div>
            <div
                onClick={() => setCopied(true)}
                style={{ background: '#1E1F22', border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '8px 10px', cursor: 'pointer', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, transition: 'border-color 0.15s' }}
            >
                <LinkIcon/>
                <span style={{ fontSize: 11, color: '#80848E', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {webhookUrl || 'https://discord.com/api/webhooks/••••••••'}
                </span>
                <span style={{ fontSize: 11, color: copied ? '#23A55A' : T.blurple, fontFamily: FONT, flexShrink: 0, fontWeight: 600 }}>
                    {copied ? 'Copied!' : 'Copy'}
                </span>
            </div>

            <div onClick={onReset} style={{ fontSize: 12, color: '#80848E', fontFamily: FONT, cursor: 'pointer', textAlign: 'center', transition: 'color 0.15s' }}>
                Start over
            </div>
        </div>
    );
}

function SetupPanel() {
    const [step,     setStep]     = useState('server');
    const [server,   setServer]   = useState<number | null>(null);
    const [channel,  setChannel]  = useState<number | null>(null);
    const [webhook,  setWebhook]  = useState('');
    const [urlFocus, setUrlFocus] = useState(false);
    const [notify,   setNotify]   = useState(true);
    const [mentions, setMentions] = useState(false);
    const [btnHov,   setBtnHov]   = useState(false);

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
        <span onClick={onClick} style={{ fontSize: 12, color: '#80848E', fontFamily: FONT, cursor: 'pointer', transition: 'color 0.15s' }}>← Back</span>
    );

    const StepDots = () => {
        const steps = ['server', 'channel', 'config'];
        const idx = steps.indexOf(step);
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

    if (step === 'loading') return <LoadingScreen server={server} channel={channel} onDone={() => setStep('done')}/>;
    if (step === 'done')    return <SuccessScreen server={server} channel={channel} webhookUrl={webhook} onReset={() => { setStep('server'); setServer(null); setChannel(null); setWebhook(''); }}/>;

    return (
        <div style={{ background: T.surface }}>
            <StepDots/>
            <div style={{ padding: '12px 16px 18px' }}>
                {step === 'server' && (
                    <>
                        <DiscordDropdown label="Select Server" items={SERVERS} type="server" value={server} onChange={setServer}/>
                        {server && (
                            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                                <NxtBtn onClick={() => setStep('channel')}/>
                            </div>
                        )}
                    </>
                )}

                {step === 'channel' && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                            {(() => { const s = SERVERS.find(x => x.id === server); return (
                                <>
                                    <div style={{ width: 16, height: 16, borderRadius: 5, background: s?.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}>{s?.abbr}</div>
                                    <span style={{ fontSize: 12, color: '#80848E', fontFamily: FONT }}>{s?.name}</span>
                                </>
                            ); })()}
                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>›</span>
                            <span style={{ fontSize: 12, color: '#B5BAC1', fontWeight: 500, fontFamily: FONT }}>Pick a channel</span>
                        </div>
                        <DiscordDropdown label="Select Channel" items={CHANNELS} type="channel" value={channel} onChange={setChannel}/>
                        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <BackLink onClick={() => setStep('server')}/>
                            {channel && <NxtBtn onClick={() => setStep('config')}/>}
                        </div>
                    </>
                )}

                {step === 'config' && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14, flexWrap: 'wrap' }}>
                            {(() => { const s = SERVERS.find(x => x.id === server); const c = CHANNELS.find(x => x.id === channel); return (
                                <>
                                    <div style={{ width: 14, height: 14, borderRadius: 4, background: s?.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}>{s?.abbr}</div>
                                    <span style={{ fontSize: 11, color: '#80848E', fontFamily: FONT }}>{s?.name}</span>
                                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>›</span>
                                    <span style={{ fontSize: 11, color: '#80848E', fontFamily: FONT }}>#{c?.name}</span>
                                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>›</span>
                                    <span style={{ fontSize: 11, color: '#B5BAC1', fontWeight: 500, fontFamily: FONT }}>Config</span>
                                </>
                            ); })()}
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

const TABS = [
    { id: 'info',    label: 'User\nInfo' },
    { id: 'servers', label: 'Mutual\nServers' },
    { id: 'friends', label: 'Mutual\nFriends' },
    { id: 'setup',   label: 'Setup', icon: true },
];

export function DiscordCard() {
    const [tab,         setTab]         = useState('info');
    const [note,        setNote]        = useState('');
    const [editingNote, setEditingNote] = useState(false);
    const [elapsed,     setElapsed]     = useState('1:24:07');

    useEffect(() => {
        let s = 5047;
        const t = setInterval(() => {
            s++;
            const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
            setElapsed(`${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(t);
    }, []);

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
                        <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', marginRight: 12, flexShrink: 0 }}>
                            <AvatarPlaceholder/>
                        </div>
                        <span style={{ fontSize: 18, fontWeight: 700, color: T.white, lineHeight: 1.2, fontFamily: FONT }}>just.tiwari</span>
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
                    {tab === 'info'    && <UserInfoPanel note={note} setNote={setNote} editing={editingNote} setEditing={setEditingNote}/>}
                    {tab === 'servers' && <MutualServersPanel/>}
                    {tab === 'friends' && <MutualFriendsPanel/>}
                    {tab === 'setup'   && <SetupPanel/>}
                </div>
            </div>
        </div>
    );
}
