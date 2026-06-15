import { useCallback, useMemo, useRef, useState } from 'react';
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
import { useRouter } from '../useRouter';
import { useToast } from '../Toast';
import Styles from './BuilderV2.module.css';

webhookImplementation.init();

type Tab = 'components' | 'send' | 'bot' | 'code';

function getThreadId(webhookUrl: string) {
    try {
        const u = new URL(webhookUrl);
        return new URLSearchParams(u.search).get('thread_id') || null;
    } catch { return null; }
}

function now12h() {
    return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

const HashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2.5 6h11M2.5 10h11M6.5 2.5L5 13.5M11 2.5L9.5 13.5"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
);

const GiftIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="10" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.7"/>
        <path d="M3 10h18M12 10V22M8 10c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
        <path d="M12 6c0 0-1.5-4 1.5-4s1.5 4 1.5 4M12 6c0 0 1.5-4-1.5-4S10.5 6 10.5 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
);

const EmojiIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7"/>
        <path d="M8.5 14.5c1 1.5 5 1.5 6 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
        <circle cx="9" cy="10" r="1.1" fill="currentColor"/>
        <circle cx="15" cy="10" r="1.1" fill="currentColor"/>
    </svg>
);

export function BuilderV2() {
    const dispatch    = useDispatch();
    const toast       = useToast();
    const stateManager = useMemo(() => new DisplaySliceManager(dispatch), [dispatch]);

    const state      = useSelector((s: RootState) => s.display.data);
    const webhookUrl = useSelector((s: RootState) => s.display.webhookUrl);
    const response   = useSelector((s: RootState) => s.display.webhookResponse);
    const showThread = useSelector((s: RootState) => s.display.showThread);

    const [page, setPage] = useRouter();
    const [tab, setTab]   = useState<Tab>('components');
    const [sending, setSending] = useState(false);
    const [postTitle, setPostTitle] = useState('');
    const dialog = useRef<HTMLDialogElement>(null);
    const stateKey = useMemo(() => ['data'], []);
    const time = useMemo(() => now12h(), []);

    const setFile    = useCallback(webhookImplementation.setFile, []);
    const getFile    = useCallback(webhookImplementation.getFile, []);
    const getFileName = useCallback(webhookImplementation.getFileName, []);

    /* passProps for the EDITOR (left — interactive, full controls) */
    const editorProps = useMemo((): PassProps => ({
        getFile, getFileName, setFile,
        BetterInput, EmojiPicker, ColorPicker,
        ActionMenu: ActionMenuComponent,
        EmojiShow,
        interactiveDisabled: false,
        hasAction: () => false,
    }), []);

    /* passProps for the PREVIEW (right — read-only, no edit handles) */
    const previewProps = useMemo((): PassProps => ({
        getFile, getFileName, setFile,
        BetterInput, EmojiPicker, ColorPicker,
        ActionMenu: ActionMenuComponent,
        EmojiShow,
        interactiveDisabled: true,
        hasAction: () => false,
    }), []);

    /* Webhook URL normalisation */
    let parsedUrl: URL | null = null;
    try {
        parsedUrl = new URL(webhookUrl);
        if (parsedUrl.pathname.startsWith('/api/webhooks/') && parsedUrl.hostname === 'discord.com') {
            parsedUrl.protocol = 'https:';
            parsedUrl.pathname = '/api/v10/webhooks/' + parsedUrl.pathname.slice('/api/webhooks/'.length);
        }
        const q = new URLSearchParams(parsedUrl.search);
        q.set('with_components', 'true');
        parsedUrl.search = q.toString();
    } catch { /* invalid url */ }

    const threadId = useMemo(() => getThreadId(webhookUrl), [webhookUrl]);

    const sendMessage = async () => {
        if (!parsedUrl) return;
        setSending(true);
        try {
            const req = await fetch(String(parsedUrl), webhookImplementation.prepareRequest(state));
            if (req.status === 204) {
                dispatch(actions.setWebhookResponse(null));
                toast.success('Message sent successfully');
                return;
            }
            const err = await req.json();
            if (err?.code === 220001 && dialog.current) {
                dialog.current.showModal();
                dispatch(actions.setWebhookResponse(null));
                return;
            }
            dispatch(actions.setWebhookResponse(err));
        } catch {
            toast.error('Network error — could not reach Discord', 'Send failed');
        } finally {
            setSending(false);
        }
    };

    const sendWithTitle = async () => {
        if (!postTitle || !parsedUrl) return;
        dialog.current?.close();
        setSending(true);
        try {
            const req = await fetch(String(parsedUrl), webhookImplementation.prepareRequest(state, postTitle));
            if (req.status === 204) {
                dispatch(actions.setWebhookResponse(null));
                toast.success('Message sent successfully');
                return;
            }
            dispatch(actions.setWebhookResponse(await req.json()));
        } catch {
            toast.error('Network error', 'Send failed');
        } finally {
            setSending(false);
        }
    };

    const safePage = page === '404.not-found' ? '200.home' : page;

    return (
        <div className={Styles.layout}>
            {/* ── TOP BAR ─────────────────────────────────────────────────── */}
            <div className={Styles.topbar}>
                <span className={Styles.logo}>
                    <img src="/logo.png" width={22} height={22} alt="" style={{ borderRadius: 4 }} />
                    OpenEmbedded
                    <span className={Styles.v2badge}>V2</span>
                </span>

                <div className={Styles.topbarTabs}>
                    {([
                        { id: 'components', label: '🧩 Builder' },
                        { id: 'send',       label: '📤 Send' },
                        { id: 'bot',        label: '🤖 Bot' },
                        { id: 'code',       label: '</> Code' },
                    ] as { id: Tab; label: string }[]).map(t => (
                        <button
                            key={t.id}
                            className={`${Styles.topbarTab} ${tab === t.id ? Styles.topbarTabActive : ''}`}
                            onClick={() => setTab(t.id)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className={Styles.topbarRight}>
                    <a href="/" className={Styles.classicLink}>← Classic</a>
                </div>
            </div>

            {/* ── BODY: builder left | preview right ──────────────────────── */}
            <div className={Styles.body}>

                {/* ── LEFT: Builder ──────────────────────────────────────── */}
                <div className={Styles.builder}>
                    <div className={Styles.builderScroll}>

                        {/* Components tab — Capsule editor */}
                        {tab === 'components' && (
                            <div className={Styles.capsuleWrap}>
                                <ErrorBoundary FallbackComponent={ErrorFallback}>
                                    <Capsule
                                        state={state}
                                        stateManager={stateManager}
                                        stateKey={stateKey}
                                        passProps={editorProps}
                                    />
                                </ErrorBoundary>
                            </div>
                        )}

                        {/* Send tab */}
                        {tab === 'send' && (
                            <div className={Styles.sendSection}>
                                <p className={Styles.sectionLabel}>Webhook URL</p>
                                <div className={Styles.webhookRow}>
                                    <input
                                        className={Styles.webhookInput}
                                        type="text"
                                        placeholder="https://discord.com/api/webhooks/..."
                                        value={webhookUrl}
                                        onChange={e => dispatch(actions.setWebhookUrl(e.target.value))}
                                    />
                                    <button
                                        className={Styles.sendBtn}
                                        disabled={parsedUrl === null || sending}
                                        onClick={sendMessage}
                                    >
                                        {sending
                                            ? <><span className={Styles.spinner} /> Sending…</>
                                            : '→ Send'}
                                    </button>
                                </div>

                                {!showThread && (
                                    <button
                                        className={Styles.threadLink}
                                        onClick={() => dispatch(actions.setShowThread())}
                                    >
                                        + Thread ID
                                    </button>
                                )}
                                {showThread && (
                                    <input
                                        className={Styles.threadInput}
                                        type="text"
                                        placeholder="Thread ID"
                                        value={threadId || ''}
                                        onChange={e => dispatch(actions.setThreadId(e.target.value))}
                                    />
                                )}

                                {!!response && (
                                    <div className={Styles.responseWrap}>
                                        <ApiResponseCard
                                            response={response}
                                            onDismiss={() => dispatch(actions.setWebhookResponse(null))}
                                        />
                                    </div>
                                )}

                                <dialog ref={dialog} style={{
                                    borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                                    background: '#2b2d31', color: '#dbdee1', padding: '2rem',
                                    width: 400, maxWidth: 'calc(100vw - 2rem)',
                                }}>
                                    <form method="dialog">
                                        <button style={{ position: 'absolute', top: '0.8rem', right: '0.8rem', background: 'none', border: 'none', color: '#72767d', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>
                                    </form>
                                    <p style={{ marginBottom: '0.6rem', fontSize: '1.3rem' }}>Forum post title</p>
                                    <input
                                        className={Styles.webhookInput}
                                        style={{ borderRadius: 6, borderRight: '1px solid rgba(255,255,255,0.08)', width: '100%', boxSizing: 'border-box' }}
                                        autoFocus
                                        type="text"
                                        value={postTitle}
                                        onChange={e => setPostTitle(e.target.value)}
                                        placeholder="Post title…"
                                    />
                                    <button
                                        className={Styles.sendBtn}
                                        style={{ marginTop: '1rem', borderRadius: 6, width: '100%', justifyContent: 'center' }}
                                        onClick={sendWithTitle}
                                    >
                                        Send post
                                    </button>
                                </dialog>
                            </div>
                        )}

                        {/* Bot tab */}
                        {tab === 'bot' && (
                            <div className={Styles.discordCardWrap}>
                                <DiscordCard />
                            </div>
                        )}

                        {/* Code tab */}
                        {tab === 'code' && (
                            <div className={Styles.codegenWrap}>
                                <Codegen state={state} page={safePage} setPage={setPage} />
                            </div>
                        )}
                    </div>
                </div>

                {/* ── RIGHT: Discord Live Preview ─────────────────────────── */}
                <div className={Styles.preview}>
                    {/* Channel header */}
                    <div className={Styles.previewHeader}>
                        <span className={Styles.previewHeaderHash}><HashIcon /></span>
                        <span className={Styles.previewHeaderName}>general</span>
                        <div className={Styles.previewHeaderDivider} />
                        <span className={Styles.previewHeaderSub}>Live preview</span>
                        <div className={Styles.topbarRight}>
                            <span className={Styles.previewBadge}>read-only</span>
                        </div>
                    </div>

                    {/* Chat area */}
                    <div className={Styles.chatArea}>
                        {/* Fake messages */}
                        <div className={Styles.chatMsg}>
                            <div className={Styles.chatAvatar} style={{ background: '#e67e22' }}>A</div>
                            <div className={Styles.chatContent}>
                                <div className={Styles.chatMeta}>
                                    <span className={Styles.chatUsername}>alex_dev</span>
                                    <span className={Styles.chatTime}>Today at {time}</span>
                                </div>
                                <div className={Styles.chatText}>
                                    hey, building a new announcement embed 👇
                                </div>
                            </div>
                        </div>

                        <div className={Styles.chatMsg}>
                            <div className={Styles.chatAvatar} style={{ background: '#2ecc71' }}>M</div>
                            <div className={Styles.chatContent}>
                                <div className={Styles.chatMeta}>
                                    <span className={Styles.chatUsername}>maya</span>
                                    <span className={Styles.chatTime}>Today at {time}</span>
                                </div>
                                <div className={Styles.chatText}>looks clean! preview looks exactly like Discord</div>
                            </div>
                        </div>

                        <div className={Styles.chatDivider}>Today</div>

                        {/* Bot message — live preview */}
                        <div className={Styles.chatMsg}>
                            <div className={Styles.chatAvatar} style={{ background: '#5865f2' }}>
                                <img src="/logo.png" width={24} height={24} alt="" style={{ borderRadius: '50%' }} />
                            </div>
                            <div className={Styles.chatContent}>
                                <div className={Styles.chatMeta}>
                                    <span className={Styles.chatUsername}>OpenEmbedded Bot</span>
                                    <span className={Styles.chatBotBadge}>BOT</span>
                                    <span className={Styles.chatTime}>Today at {time}</span>
                                </div>
                                {/* Read-only Capsule — this is the LIVE PREVIEW */}
                                <ErrorBoundary FallbackComponent={ErrorFallback}>
                                    <Capsule
                                        state={state}
                                        stateManager={stateManager}
                                        stateKey={stateKey}
                                        passProps={previewProps}
                                        className={Styles.capsuleWrap}
                                    />
                                </ErrorBoundary>
                            </div>
                        </div>
                    </div>

                    {/* Fake input bar */}
                    <div className={Styles.inputBar}>
                        <div className={Styles.inputBarPlus}>+</div>
                        <div className={Styles.inputBarPlaceholder}>Message #general</div>
                        <div className={Styles.inputBarIcons}>
                            <GiftIcon />
                            <EmojiIcon />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
