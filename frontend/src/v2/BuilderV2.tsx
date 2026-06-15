import { useCallback, useEffect, useMemo, useState } from 'react';
import { Capsule, PassProps } from 'components-sdk';
import { useDispatch, useSelector } from 'react-redux';
import { actions, DisplaySliceManager, RootState } from '../state';
import { BetterInput } from '../BetterInput';
import { EmojiPicker } from '../EmojiPicker';
import { EmojiShow } from '../EmojiShow';
import { ColorPicker } from '../ColorPicker';
import { ActionMenuComponent } from '../ActionMenu';
import { webhookImplementation } from '../webhook.impl';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '../ErrorFallback';
import { ApiResponseCard } from '../ApiResponseCard';
import { DiscordCard } from '../DiscordCard';
import { Codegen } from '../Codegen';
import { UserProfile } from '../UserProfile';
import { useRouter } from '../useRouter';
import { useToast } from '../Toast';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { supportedLngs } from '../../libs.config';
import Styles from './BuilderV2.module.css';

webhookImplementation.init();

type PanelTab = 'webhook' | 'bot' | 'code' | 'settings';

function getThreadId(webhookUrl: string) {
    try {
        const u = new URL(webhookUrl);
        return new URLSearchParams(u.search).get('thread_id') || null;
    } catch { return null; }
}

function now12h() {
    return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/* ── SVG Icons ─────────────────────────────────────────────────────────────── */
const IconHash = () => (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <path d="M2.5 6h11M2.5 10h11M6.5 2.5L5 13.5M11 2.5L9.5 13.5"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
);
const IconSearch = () => (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
        <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
);
const IconBell = () => (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
        <path d="M10 2a6 6 0 00-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 00-6-6z"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.5 17a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
);
const IconPin = () => (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
        <path d="M12 2l6 6-2 2-3-1-4 4 1 3-2 2-6-6 2-2 3 1 4-4-1-3 2-2z"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 18l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
);
const IconSend = () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M3 10h14M13 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const IconDiscord = () => (
    <svg width="18" height="18" viewBox="0 0 71 55" fill="currentColor">
        <path d="M60.1 4.9A58.6 58.6 0 0 0 45.5.7a40.7 40.7 0 0 0-1.8 3.7 54.2 54.2 0 0 0-16.3 0A40.8 40.8 0 0 0 25.6.7 58.5 58.5 0 0 0 11 4.9C1.6 19.4-1 33.5.3 47.4a59 59 0 0 0 18 9.1 44.6 44.6 0 0 0 3.9-6.3 38.5 38.5 0 0 1-6.1-2.9l1.5-1.1a42.2 42.2 0 0 0 35.8 0l1.5 1.1a38.5 38.5 0 0 1-6.1 2.9 44.5 44.5 0 0 0 3.9 6.3 58.8 58.8 0 0 0 18-9.1C72.1 31.2 68 17.2 60.1 4.9ZM23.7 39c-3.5 0-6.4-3.2-6.4-7.1s2.8-7.1 6.4-7.1c3.5 0 6.4 3.2 6.3 7.1 0 3.9-2.8 7.1-6.3 7.1Zm23.7 0c-3.5 0-6.4-3.2-6.4-7.1s2.8-7.1 6.4-7.1c3.5 0 6.4 3.2 6.3 7.1 0 3.9-2.8 7.1-6.3 7.1Z" />
    </svg>
);
const IconCode = () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M7 5L3 10l4 5M13 5l4 5-4 5" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const IconSettings = () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="2.8" stroke="currentColor" strokeWidth="1.7" />
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4"
            stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
);
const IconArrowLeft = () => (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        <path d="M11 7H3M6 4L3 7l3 3" stroke="currentColor" strokeWidth="1.7"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const IconSmile = () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 12s1 2 3 2 3-2 3-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="7.5" cy="8.5" r="1" fill="currentColor" />
        <circle cx="12.5" cy="8.5" r="1" fill="currentColor" />
    </svg>
);
const IconPlus = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
);
const IconGift = () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="8" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 8v10M2 12h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 8C10 8 7 5 5 6s-1 4 5 2zM10 8c0 0 3-3 5-2s1 4-5 2z"
            stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
);

/* ── Rail button with tooltip ──────────────────────────────────────────────── */
function RailButton({ icon, label, active, onClick }: {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    const [showTip, setShowTip] = useState(false);
    return (
        <button
            className={`${Styles.railBtn} ${active ? Styles.railBtnActive : ''}`}
            onClick={onClick}
            onMouseEnter={() => setShowTip(true)}
            onMouseLeave={() => setShowTip(false)}
            aria-label={label}
        >
            {active && <span className={Styles.railActivePip} />}
            {icon}
            {showTip && <span className={Styles.railTooltip}>{label}</span>}
        </button>
    );
}

/* ── Fake static Discord messages (decorative) ─────────────────────────────── */
function FakeMessages() {
    const t = now12h();
    return (
        <>
            <div className={Styles.dcDateDivider}>
                <div className={Styles.dcDateLine} />
                <span className={Styles.dcDateLabel}>Today</span>
                <div className={Styles.dcDateLine} />
            </div>

            <div className={`${Styles.dcMessage} ${Styles.dcMessageFull}`}>
                <div className={Styles.dcAvatarWrap}>
                    <div className={Styles.dcAvatar} style={{ background: '#E74C3C', fontSize: '1.4rem' }}>A</div>
                </div>
                <div className={Styles.dcMessageBody}>
                    <div className={Styles.dcMessageHeader}>
                        <span className={`${Styles.dcUsername} ${Styles.dcUsernameColor1}`}>alex_dev</span>
                        <span className={Styles.dcTimestamp}>{t}</span>
                    </div>
                    <div className={Styles.dcMessageText}>
                        hey can someone test the new embed for the announcement channel?
                    </div>
                </div>
            </div>

            <div className={`${Styles.dcMessage} ${Styles.dcMessageContinue}`}>
                <div className={Styles.dcAvatarWrap}>
                    <span className={Styles.dcTimeHover}>
                        {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s?(AM|PM)/, '')}
                    </span>
                </div>
                <div className={Styles.dcMessageBody}>
                    <div className={Styles.dcMessageText}>
                        building it now in OpenEmbedded 👇
                    </div>
                </div>
            </div>

            <div className={`${Styles.dcMessage} ${Styles.dcMessageFull}`}>
                <div className={Styles.dcAvatarWrap}>
                    <div className={Styles.dcAvatar} style={{ background: '#3498DB', fontSize: '1.4rem' }}>M</div>
                </div>
                <div className={Styles.dcMessageBody}>
                    <div className={Styles.dcMessageHeader}>
                        <span className={`${Styles.dcUsername} ${Styles.dcUsernameColor2}`}>maya</span>
                        <span className={Styles.dcTimestamp}>{t}</span>
                    </div>
                    <div className={Styles.dcMessageText}>looks good so far! drag the components around to reorder them</div>
                </div>
            </div>
        </>
    );
}

/* ── Webhook Panel ─────────────────────────────────────────────────────────── */
function WebhookPanel({
    webhookUrl, onUrlChange,
    threadId, showThread, onToggleThread, onThreadChange,
    onSend, sending, parsed_url, response, onDismiss,
}: {
    webhookUrl: string;
    onUrlChange: (v: string) => void;
    threadId: string | null;
    showThread: boolean;
    onToggleThread: () => void;
    onThreadChange: (v: string) => void;
    onSend: () => void;
    sending: boolean;
    parsed_url: URL | null;
    response: object | null;
    onDismiss: () => void;
}) {
    return (
        <div>
            <div className={Styles.fieldGroup}>
                <p className={Styles.fieldLabel}>Webhook URL</p>
                <div className={Styles.inputRow}>
                    <input
                        className={`${Styles.input} ${Styles.inputLeft}`}
                        placeholder="https://discord.com/api/webhooks/…"
                        type="text"
                        value={webhookUrl}
                        onChange={e => onUrlChange(e.target.value)}
                    />
                    <button
                        className={Styles.sendBtn}
                        disabled={parsed_url == null || sending}
                        onClick={onSend}
                    >
                        {sending
                            ? <><span className={Styles.btnSpinner} />Sending…</>
                            : <><IconSend />Send</>
                        }
                    </button>
                </div>
                {!showThread && (
                    <span className={Styles.threadToggle} onClick={onToggleThread}>
                        + Thread ID
                    </span>
                )}
            </div>

            {showThread && (
                <div className={Styles.fieldGroup}>
                    <p className={Styles.fieldLabel}>Thread ID</p>
                    <input
                        className={Styles.input}
                        type="text"
                        value={threadId || ''}
                        onChange={e => onThreadChange(e.target.value)}
                        placeholder="optional thread_id"
                    />
                </div>
            )}

            {!!response && (
                <ApiResponseCard response={response} onDismiss={onDismiss} />
            )}

            {parsed_url === null && webhookUrl.trim() !== '' && (
                <div style={{ fontSize: '1.2rem', color: 'var(--text-danger)', marginTop: 6 }}>
                    Invalid webhook URL — paste a full Discord webhook link.
                </div>
            )}

            {parsed_url !== null && !sending && (
                <div style={{ marginTop: 8 }}>
                    <div className={Styles.statusOnline}>
                        <span className={Styles.statusDot} />
                        Ready to send
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Settings Panel ─────────────────────────────────────────────────────────── */
function SettingsPanel() {
    const { t } = useTranslation('website');
    return (
        <div>
            <div className={Styles.settingsSection}>
                <p className={Styles.settingsLabel}>Language</p>
                <p className={Styles.settingsSublabel}>Switch the UI to a different language.</p>
                <div className={Styles.langGrid}>
                    {supportedLngs.map(lang => (
                        <button
                            key={lang}
                            className={Styles.langBtn}
                            onClick={() => i18next.changeLanguage(lang)}
                        >
                            {lang}
                        </button>
                    ))}
                </div>
            </div>

            <div className={Styles.settingsSection}>
                <p className={Styles.settingsLabel}>Layout</p>
                <p className={Styles.settingsSublabel}>Switch between the original and studio layouts.</p>
                <div className={Styles.settingsLinkRow}>
                    <a href="/" className={Styles.settingsLink}>
                        <IconArrowLeft />
                        Classic layout (V1)
                    </a>
                </div>
            </div>

            <div className={Styles.settingsSection}>
                <p className={Styles.settingsLabel}>Links</p>
                <div className={Styles.settingsLinkRow}>
                    <a href="/terms" className={Styles.settingsLink} target="_blank" rel="noopener noreferrer">
                        Terms of Service
                    </a>
                    <a href="/privacy" className={Styles.settingsLink} target="_blank" rel="noopener noreferrer">
                        Privacy Policy
                    </a>
                </div>
            </div>
        </div>
    );
}

/* ── Main BuilderV2 ─────────────────────────────────────────────────────────── */
export function BuilderV2() {
    const dispatch    = useDispatch();
    const toast       = useToast();
    const stateManager = useMemo(() => new DisplaySliceManager(dispatch), [dispatch]);
    const state       = useSelector((s: RootState) => s.display.data);
    const webhookUrl  = useSelector((s: RootState) => s.display.webhookUrl);
    const response    = useSelector((s: RootState) => s.display.webhookResponse);
    const showThread  = useSelector((s: RootState) => s.display.showThread);
    const [page, setPage] = useRouter();
    const [activePanel, setActivePanel] = useState<PanelTab>('webhook');
    const [sending, setSending]         = useState(false);

    const stateKey = useMemo(() => ['data'], []);

    const setFile     = useCallback(webhookImplementation.setFile, []);
    const getFile     = useCallback(webhookImplementation.getFile, []);
    const getFileName = useCallback(webhookImplementation.getFileName, []);

    const passProps = useMemo((): PassProps => ({
        getFile, getFileName, setFile,
        BetterInput, EmojiPicker, ColorPicker,
        ActionMenu: ActionMenuComponent,
        EmojiShow,
        interactiveDisabled: false,
        hasAction: () => false,
    }), []);

    const errors = useMemo(() => webhookImplementation.getErrors(response), [response]);

    const threadId = useMemo(() => getThreadId(webhookUrl), [webhookUrl]);
    useEffect(() => {
        if (threadId) dispatch(actions.setShowThread());
    }, [threadId]);

    useEffect(() => {
        const t = setTimeout(() =>
            localStorage.setItem('discord.builders__webhookToken', webhookUrl), 1000);
        return () => clearTimeout(t);
    }, [webhookUrl]);

    let parsed_url: URL | null = null;
    try {
        parsed_url = new URL(webhookUrl);
        if (parsed_url.pathname.startsWith('/api/webhooks/') && parsed_url.hostname === 'discord.com') {
            parsed_url.protocol = 'https:';
            parsed_url.pathname = '/api/v10/webhooks/' + parsed_url.pathname.slice('/api/webhooks/'.length);
        }
        const q = new URLSearchParams(parsed_url.search);
        q.set('with_components', 'true');
        parsed_url.search = q.toString();
    } catch { parsed_url = null; }

    const sendMessage = async () => {
        if (!parsed_url) return;
        setSending(true);
        try {
            const req = await fetch(String(parsed_url), webhookImplementation.prepareRequest(state));
            if (req.status === 204) {
                dispatch(actions.setWebhookResponse(null));
                toast.success('Message sent successfully');
                return;
            }
            const err = await req.json();
            dispatch(actions.setWebhookResponse(err));
        } catch {
            toast.error('Network error — could not reach Discord', 'Send failed');
        } finally {
            setSending(false);
        }
    };

    const panelTabs: { id: PanelTab; icon: React.ReactNode; label: string }[] = [
        { id: 'webhook',  icon: <IconSend />,     label: 'Send'     },
        { id: 'bot',      icon: <IconDiscord />,  label: 'Bot'      },
        { id: 'code',     icon: <IconCode />,     label: 'Code'     },
        { id: 'settings', icon: <IconSettings />, label: 'Settings' },
    ];

    const panelTitles: Record<PanelTab, string> = {
        webhook:  'Send Message',
        bot:      'Discord Bot',
        code:     'Code Export',
        settings: 'Settings',
    };

    return (
        <div className={Styles.layout}>

            {/* ── Top Header ──────────────────────────────────────────────── */}
            <header className={Styles.header}>
                <div className={Styles.headerBrand}>
                    <img src="/logo.png" className={Styles.headerLogo} alt="OpenEmbedded" />
                </div>

                <div className={Styles.headerCenter}>
                    <span className={Styles.headerTitle}>OpenEmbedded</span>
                    <span className={Styles.v2Badge}>V2</span>
                    <div className={Styles.headerDivider} />
                    <span className={Styles.headerChannelInfo}>
                        <span className={Styles.dcChannelIcon}><IconHash /></span>
                        general
                    </span>
                    <div className={Styles.dcTitleDivider} />
                    <span className={Styles.dcTopicText}>Live message preview</span>
                </div>

                <div className={Styles.headerRight}>
                    <UserProfile />
                    <a href="/" className={Styles.backBtn}>
                        <IconArrowLeft /> Classic
                    </a>
                </div>
            </header>

            {/* ── Left Icon Rail ──────────────────────────────────────────── */}
            <nav className={Styles.rail}>
                {panelTabs.map((tab, i) => (
                    <>
                        {i === 3 && <div key="sep" className={Styles.railSeparator} />}
                        <RailButton
                            key={tab.id}
                            icon={tab.icon}
                            label={tab.label}
                            active={activePanel === tab.id}
                            onClick={() => setActivePanel(tab.id)}
                        />
                    </>
                ))}
            </nav>

            {/* ── Center: Discord Chrome + Live Preview ───────────────────── */}
            <main className={Styles.preview}>
                {/* Channel titlebar */}
                <div className={Styles.discordTitlebar}>
                    <div className={Styles.dcTitleLeft}>
                        <span className={Styles.dcChannelIcon}><IconHash /></span>
                        <span className={Styles.dcChannelName}>general</span>
                        <div className={Styles.dcTitleDivider} />
                        <span className={Styles.dcTopicText}>Live component preview</span>
                    </div>
                    <div className={Styles.dcTitleActions}>
                        <div className={Styles.dcTitleIcon}><IconPin /></div>
                        <div className={Styles.dcTitleIcon}><IconBell /></div>
                        <div className={Styles.dcTitleIcon}><IconSearch /></div>
                    </div>
                </div>

                {/* Messages area */}
                <div className={Styles.dcMessages}>
                    <FakeMessages />

                    {/* Live preview as a bot message */}
                    <div className={Styles.previewMessage}>
                        <div className={Styles.previewMessageInner}>
                            <div className={Styles.previewBotAvatar}>
                                <img src="/logo.png" style={{ width: 22, height: 22, objectFit: 'contain' }} alt="" />
                            </div>
                            <div className={Styles.previewBotContent}>
                                <div className={Styles.previewBotHeader}>
                                    <span className={Styles.dcUsername}>OpenEmbedded Bot</span>
                                    <span className={Styles.dcBotTag}>BOT</span>
                                    <span className={Styles.dcTimestamp}>{now12h()}</span>
                                </div>
                                <div className={Styles.capsuleWrap}>
                                    <ErrorBoundary FallbackComponent={ErrorFallback}>
                                        <Capsule
                                            state={state}
                                            stateManager={stateManager}
                                            stateKey={stateKey}
                                            passProps={passProps}
                                            errors={errors}
                                        />
                                    </ErrorBoundary>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Read-only input bar */}
                <div className={Styles.dcInputBar}>
                    <div className={Styles.dcInputInner}>
                        <span className={Styles.dcInputActions}>
                            <span className={Styles.dcInputIcon}><IconPlus /></span>
                        </span>
                        <span className={Styles.dcInputPlaceholder}>Message #general</span>
                        <span className={Styles.dcInputActions}>
                            <span className={Styles.dcInputIcon}><IconGift /></span>
                            <span className={Styles.dcInputIcon}><IconSmile /></span>
                        </span>
                    </div>
                </div>
            </main>

            {/* ── Right Context Panel ─────────────────────────────────────── */}
            <aside className={Styles.panel}>
                <div className={Styles.panelHeader}>
                    <p className={Styles.panelTitle}>{panelTitles[activePanel]}</p>
                </div>

                <div className={Styles.panelBody}>
                    {activePanel === 'webhook' && (
                        <WebhookPanel
                            webhookUrl={webhookUrl}
                            onUrlChange={v => dispatch(actions.setWebhookUrl(v))}
                            threadId={threadId}
                            showThread={showThread}
                            onToggleThread={() => dispatch(actions.setShowThread())}
                            onThreadChange={v => dispatch(actions.setThreadId(v))}
                            onSend={sendMessage}
                            sending={sending}
                            parsed_url={parsed_url}
                            response={response}
                            onDismiss={() => dispatch(actions.setWebhookResponse(null))}
                        />
                    )}

                    {activePanel === 'bot' && (
                        <div className={Styles.discordCardWrap}>
                            <DiscordCard />
                        </div>
                    )}

                    {activePanel === 'code' && (
                        <div className={Styles.codegenWrap}>
                            <Codegen
                                state={state}
                                page={page === '404.not-found' ? '200.home' : page}
                                setPage={setPage}
                            />
                        </div>
                    )}

                    {activePanel === 'settings' && <SettingsPanel />}
                </div>
            </aside>
        </div>
    );
}
