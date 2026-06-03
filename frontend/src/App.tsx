import { Capsule, PassProps, Component, ComponentType } from 'components-sdk';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { actions, DisplaySliceManager, RootState } from './state';
import { BetterInput } from './BetterInput';
import { EmojiPicker } from './EmojiPicker';
import { EmojiShow } from './EmojiShow';
import Styles from './App.module.css';
import { webhookImplementation } from './webhook.impl';
import { ErrorBoundary } from 'react-error-boundary';
import { ColorPicker } from './ColorPicker';
import { useHashRouter } from './useHashRouter';
import { Codegen } from './Codegen';
import { useRouter } from './useRouter';
import { Trans, useTranslation } from 'react-i18next'; // Trans used for webhook.codegen
import i18next from 'i18next';
import { supportedLngs } from '../libs.config';
import { ActionMenuComponent } from './ActionMenu';
import { useButtonActions, STEP_LABELS, STEP_ICONS, stepSummary } from './ButtonActionsContext';
import { BotChannelSelector } from './BotChannelSelector';
type GatewayStatus = 'disconnected' | 'connecting' | 'connected' | 'error';


webhookImplementation.init();

function getThreadId(webhookUrl: string) {
    try {
        const parsed_url = new URL(webhookUrl);
        const parsed_query = new URLSearchParams(parsed_url.search);
        const thread_id = parsed_query.get('thread_id');
        return thread_id || null;
    } catch (e) {
        return null;
    }
}

type ButtonInfo = { label: string; customId: string };

function extractButtons(components: Component[]): ButtonInfo[] {
    const result: ButtonInfo[] = [];
    for (const comp of components) {
        if (comp.type === ComponentType.ACTION_ROW) {
            const row = comp as any;
            for (const child of (row.components || [])) {
                if (child.type === ComponentType.BUTTON && child.custom_id) {
                    result.push({ label: child.label || child.custom_id, customId: child.custom_id });
                }
            }
        } else if (comp.type === ComponentType.CONTAINER) {
            result.push(...extractButtons((comp as any).components || []));
        }
    }
    return result;
}


function App() {
    const dispatch = useDispatch();
    const stateManager = useMemo(() => new DisplaySliceManager(dispatch), [dispatch]);
    const state = useSelector((state: RootState) => state.display.data)
    const webhookUrl = useSelector((state: RootState) => state.display.webhookUrl);
    const response = useSelector((state: RootState) => state.display.webhookResponse);
    const showThread = useSelector((state: RootState) => state.display.showThread);
    const isDefault = useSelector((state: RootState) => state.display.isDefault);
    const [page, setPage] = useRouter();
    const [postTitle, setPostTitle] = useState<string>("");
    useHashRouter();

    const { actions: buttonActions } = useButtonActions();
    // NOTE: do NOT redeclare { actions } from useButtonActions here — it would shadow the Redux actions import

    const [botToken, setBotToken] = useState<string>(
        () => localStorage.getItem('discord.builders__botToken') || ''
    );
    const [channelId, setChannelId] = useState<string>(
        () => localStorage.getItem('discord.builders__channelId') || ''
    );
    const [botResponse,       setBotResponse]       = useState<object | null>(null);
    const [botConnecting,     setBotConnecting]     = useState<boolean>(false);
    const [botConnectError,   setBotConnectError]   = useState<string | null>(null);
    const [botGuilds,         setBotGuilds]         = useState<{id:string;name:string;icon:string|null}[]>([]);
    const [botSelectedGuild,  setBotSelectedGuild]  = useState<string>(
        () => localStorage.getItem('discord.builders__guildId') || ''
    );
    const [botChannels,       setBotChannels]       = useState<{id:string;name:string;type:number;parent_id:string|null;position:number}[]>([]);
    const [chLoading,         setChLoading]         = useState<boolean>(false);
    const [gatewayStatus,     setGatewayStatus]     = useState<GatewayStatus>('disconnected');
    const [gatewayError,      setGatewayError]      = useState<string | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // On mount: check if bot is already running server-side (survives page refresh)
    useEffect(() => {
        const savedGuildId = localStorage.getItem('discord.builders__guildId') || '';
        fetch('/api/bot/status')
            .then(r => r.json())
            .then((data: any) => {
                if (data.status === 'connected' || data.status === 'connecting') {
                    setGatewayStatus(data.status);
                    if (data.guilds?.length) setBotGuilds(data.guilds);
                    startPolling();
                    // Re-fetch channels for the previously-selected guild
                    if (savedGuildId) {
                        setChLoading(true);
                        fetch(`/api/bot/guilds/${savedGuildId}/channels`)
                            .then(r => r.json())
                            .then((ch: any) => {
                                if (Array.isArray(ch)) setBotChannels(ch);
                            })
                            .catch(() => {})
                            .finally(() => setChLoading(false));
                    }
                }
            })
            .catch(() => {});
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, []);

    const startPolling = () => {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
            try {
                const res = await fetch('/api/bot/status');
                const data: any = await res.json();
                setGatewayStatus(data.status);
                if (data.error) setGatewayError(data.error);
                if (data.guilds?.length) setBotGuilds(data.guilds);
                // Stop polling once terminal state reached
                if (data.status === 'error' || data.status === 'disconnected') {
                    clearInterval(pollRef.current!);
                    pollRef.current = null;
                }
            } catch { /* network blip — keep polling */ }
        }, 2000);
    };

    useEffect(() => {
        const t = setTimeout(() => localStorage.setItem('discord.builders__botToken', botToken), 500);
        return () => clearTimeout(t);
    }, [botToken]);

    useEffect(() => {
        const t = setTimeout(() => localStorage.setItem('discord.builders__channelId', channelId), 500);
        return () => clearTimeout(t);
    }, [channelId]);

    const setFile = useCallback(webhookImplementation.setFile, []);
    const getFile = useCallback(webhookImplementation.getFile, [])
    const getFileName = useCallback(webhookImplementation.getFileName, [])
    const actionsRef = useRef(buttonActions);
    actionsRef.current = buttonActions;
    const passProps = useMemo((): PassProps => ({
        getFile,
        getFileName,
        setFile,
        BetterInput,
        EmojiPicker,
        ColorPicker,
        ActionMenu: ActionMenuComponent,
        EmojiShow,
        interactiveDisabled: false,
        hasAction: (id: string) => !!actionsRef.current[id],
    }), []);


    useEffect(() => {
        const getData = setTimeout(() => localStorage.setItem("discord.builders__webhookToken", webhookUrl), 1000)
        return () => clearTimeout(getData)
    }, [webhookUrl]);


    let parsed_url: URL | null = null;
    try {
        parsed_url = new URL(webhookUrl);

        if (parsed_url.pathname.startsWith('/api/webhooks/') && parsed_url.hostname === 'discord.com') {
            parsed_url.protocol = 'https:';
            parsed_url.pathname = '/api/v10/webhooks/' + parsed_url.pathname.slice('/api/webhooks/'.length);
        }

        const parsed_query = new URLSearchParams(parsed_url.search);
        parsed_query.set('with_components', 'true');
        parsed_url.search = parsed_query.toString();
    } catch (e) {}

    const stateKey = useMemo(() => ['data'], [])

    const errors = useMemo(() => webhookImplementation.getErrors(response), [response]);

    const threadId = useMemo(() => getThreadId(webhookUrl), [webhookUrl]);
    useEffect(() => {
        if (threadId) dispatch(actions.setShowThread())
    }, [threadId]);

    const sendMessage = async () => {
        const req = await fetch(String(parsed_url), webhookImplementation.prepareRequest(state))

        const status_code = req.status;
        if (status_code === 204) return dispatch(actions.setWebhookResponse({"status": "204 Success"}));

        const error_data = await req.json();

        if (error_data?.code === 220001 && dialog.current !== null) {
            dialog.current.showModal();
            dispatch(actions.setWebhookResponse(null))
            return;
        }

        dispatch(actions.setWebhookResponse(error_data))
    }

    const sendMessageWithTitle = async () => {
        if (!postTitle) return;
        dialog.current?.close();

        const req = await fetch(String(parsed_url), webhookImplementation.prepareRequest(state, postTitle))

        const status_code = req.status;
        if (status_code === 204) return dispatch(actions.setWebhookResponse({"status": "204 Success"}));

        const error_data = await req.json();
        dispatch(actions.setWebhookResponse(error_data))
    }

    const connectBot = async () => {
        const token = botToken.trim();
        if (!token) return;
        setBotConnecting(true);
        setBotConnectError(null);
        setBotGuilds([]);
        setBotChannels([]);
        setChannelId('');
        setGatewayStatus('connecting');
        setGatewayError(null);

        try {
            const res = await fetch('/api/bot/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });
            const data: any = await res.json();
            if (!res.ok) {
                setBotConnectError(data.error || 'Failed to start bot.');
                setGatewayStatus('error');
                return;
            }
            if (data.guilds?.length) setBotGuilds(data.guilds);
            startPolling();
            // Re-fetch channels for the previously-selected guild (if any)
            const savedGuildId = localStorage.getItem('discord.builders__guildId') || '';
            if (savedGuildId) {
                setChLoading(true);
                fetch(`/api/bot/guilds/${savedGuildId}/channels`)
                    .then(r => r.json())
                    .then((ch: any) => { if (Array.isArray(ch)) setBotChannels(ch); })
                    .catch(() => {})
                    .finally(() => setChLoading(false));
            }
        } catch (e: any) {
            setBotConnectError(e?.message || 'Network error — is the bot server running?');
            setGatewayStatus('error');
        } finally {
            setBotConnecting(false);
        }
    };

    const disconnectBot = async () => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        setGatewayStatus('disconnected');
        setGatewayError(null);
        setBotGuilds([]);
        setBotChannels([]);
        fetch('/api/bot/stop', { method: 'POST' }).catch(() => {});
    };

    const selectGuild = async (guildId: string) => {
        setBotSelectedGuild(guildId);
        localStorage.setItem('discord.builders__guildId', guildId);
        setBotChannels([]);
        setChannelId('');
        if (!guildId) return;
        setChLoading(true);
        try {
            const res = await fetch(`/api/bot/guilds/${guildId}/channels`);
            const data: any = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load channels.');
            setBotChannels(data);
        } catch (e: any) {
            setBotConnectError(e?.message || 'Failed to load channels.');
        } finally {
            setChLoading(false);
        }
    };

    const sendViaBot = async () => {
        setBotResponse(null);
        try {
            const fileNames = webhookImplementation.scrapFiles(state);
            const attachments: { name: string; data: string; type: string }[] = [];
            for (const name of fileNames) {
                const blob: Blob | undefined = window.uploadedFiles?.[name];
                if (blob) {
                    const base64 = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve((reader.result as string).split(',')[1]);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                    attachments.push({ name, data: base64, type: blob.type || 'application/octet-stream' });
                }
            }

            const res = await fetch(`/api/bot/channels/${channelId.trim()}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ components: state, flags: 32768, attachments }),
            });
            const data: any = await res.json().catch(() => null);
            if (res.ok) {
                setBotResponse({ status: `${res.status} Success` });
                // Sync button action configs so the server can handle interaction callbacks
                fetch('/api/bot/actions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ actions: buttonActions }),
                }).catch(() => {});
            } else {
                setBotResponse(data || { error: `HTTP ${res.status}` });
            }
        } catch (e: any) {
            setBotResponse({ error: e?.message || 'Network error' });
        }
    };

    const dialog = useRef<HTMLDialogElement>(null);

    const buttons = useMemo(() => extractButtons(state), [state]);
    const configuredButtons = useMemo(
        () => buttons.filter(b => buttonActions[b.customId]),
        [buttons, buttonActions]
    );

    if (page === '404.not-found') {
        if (!window.location.href.includes('/not-found')) window.location.href = '/not-found';
        return <div><meta name="robots" content="noindex" /><h1>404 — Page not found</h1></div>;
    }
    
    const { t } = useTranslation('website');


    return <div className={Styles.app}>
        {(isDefault && page === '200.home') && <div className={Styles.alert}>
            <p>{t('welcome.welcome')}</p>
            <p>{t('welcome.home')}</p>
            <p><button onClick={() => {
                dispatch(actions.setKey({key: ['data'], value: []}));
            }}>{t('welcome.clear')}</button></p>
        </div>}
        {(isDefault && page !== '200.home') && <div className={Styles.alert}>
            <p>{t('welcome.welcome')}</p>
            <p><Trans t={t} i18nKey={"welcome.codegen"} components={{
                b: <b />,
            }} values={{page: page}} /></p>

            <p><button onClick={() => {
                dispatch(actions.setKey({key: ['data'], value: []}));
            }}>Clear everything</button></p>
        </div>}
        <div className={Styles.leftColumn}>
            <ErrorBoundary fallback={<></>}>
                <Capsule state={state}
                         stateManager={stateManager}
                         stateKey={stateKey}
                         passProps={passProps}
                         className={Styles.preview}
                         errors={errors}
                />
            </ErrorBoundary>
        </div>
        <div className={Styles.json}>
            <h1 style={{color: '#ffffff'}}>OpenEmbedded — {t('homepage.title')}</h1>

            <p style={{marginBottom: '0.5rem', marginTop: '4rem'}}><span style={{fontSize: 16, color: 'white', fontWeight: '500'}}>{t('webhook.title')}</span>{!showThread && <> (<span className={Styles.link} onClick={() => dispatch(actions.setShowThread())}>{t('webhook.thread')}</span>) </>}</p>
            <div className={Styles.input_pair}>
                <div>
                    <input className={Styles.input} placeholder={"Webhook link"} type="text" value={webhookUrl}
                           onChange={ev => dispatch(actions.setWebhookUrl(ev.target.value))}/>
                </div>
                <button className={Styles.button} disabled={parsed_url == null} onClick={sendMessage}>
                    {t('webhook.send')}
                </button>
            </div>

            <p style={{marginTop: '0.5rem', marginBottom: '2rem', color: 'grey'}}>{t('webhook.warning')}</p>

            {showThread && <div style={{marginBottom: '2rem'}}>
                <p style={{marginBottom: '0.5rem'}}>{t('thread.id')}</p>
                <input className={Styles.input} type="text" value={threadId || ""} onChange={ev => dispatch(actions.setThreadId(ev.target.value))} placeholder={t('thread.placeholder')}/>
            </div>}

            <dialog ref={dialog} className={Styles.dialog}>
                <form method="dialog"><button className={Styles.close}>✕</button></form>
                <div>
                    <p className={Styles.input_name}>{t('thread.post.label')}</p>
                    <input className={Styles.input} autoFocus={true} type="text" value={postTitle} onChange={ev => setPostTitle(ev.target.value)} placeholder={t('thread.post.placeholder')}/>
                </div>
                <div className={Styles.button} onClick={sendMessageWithTitle}>{t('thread.post.button')}</div>
            </dialog>

            {!!response && <div className={Styles.data}
                                style={{
                                    marginBottom: '2rem',
                                    color: '#dd9898'
                                }}>{JSON.stringify(response, undefined, 4)}</div>}

            {/* ── Bot Connection ── */}
            <p style={{marginBottom: '0.5rem', marginTop: '3rem', display: 'flex', alignItems: 'center', gap: '0.6rem'}}>
                <span style={{fontSize: 16, color: 'white', fontWeight: '500'}}>Connect a Bot</span>
                {gatewayStatus === 'connecting' && (
                    <span style={{fontSize: 12, color: '#faa61a', fontWeight: 600}}>● Connecting…</span>
                )}
                {gatewayStatus === 'connected' && (
                    <span style={{fontSize: 12, color: '#3ba55d', fontWeight: 600}}>● Online</span>
                )}
                {gatewayStatus === 'error' && (
                    <span style={{fontSize: 12, color: '#ed4245', fontWeight: 600}}>● Error</span>
                )}
            </p>

            <p style={{marginBottom: '0.5rem'}}>
                <span style={{fontSize: 13, color: '#dcddde', fontWeight: '500'}}>Bot Token</span>
            </p>
            <input
                className={Styles.input}
                placeholder="Paste your bot token here"
                type="password"
                value={botToken}
                onChange={ev => {
                    setBotToken(ev.target.value);
                    setBotGuilds([]);
                    setBotConnectError(null);
                    setGatewayStatus('disconnected');
                    setGatewayError(null);
                    disconnectBot();
                }}
                style={{marginBottom: '0.75rem'}}
                onKeyDown={ev => { if (ev.key === 'Enter' && botToken.trim()) connectBot(); }}
            />

            <div style={{display: 'flex', gap: '0.5rem', marginBottom: '0.5rem'}}>
                <button
                    className={Styles.button}
                    disabled={!botToken.trim() || botConnecting || gatewayStatus === 'connecting'}
                    onClick={connectBot}
                    style={{flex: 1}}
                >
                    {botConnecting || gatewayStatus === 'connecting'
                        ? 'Starting…'
                        : gatewayStatus === 'connected'
                        ? 'Restart Bot'
                        : 'Start Bot'}
                </button>
                {gatewayStatus === 'connected' && (
                    <button
                        className={Styles.button}
                        onClick={disconnectBot}
                        style={{background: '#4f545c'}}
                    >
                        Stop Bot
                    </button>
                )}
            </div>

            {(botConnectError || gatewayError) && (
                <p style={{color: '#ed4245', fontSize: 13, marginBottom: '0.5rem'}}>
                    ⚠ {botConnectError || gatewayError}
                </p>
            )}

            {gatewayStatus === 'connected' && (
                <p style={{color: '#3ba55d', fontSize: 13, marginBottom: '0.5rem'}}>
                    ✓ Bot is online in Discord. It stays online as long as this app is running — even if you close this tab.
                </p>
            )}

            <BotChannelSelector
                guilds={botGuilds}
                channels={botChannels}
                selectedGuildId={botSelectedGuild}
                channelId={channelId}
                chLoading={chLoading}
                onGuildChange={selectGuild}
                onChannelChange={id => {
                    setChannelId(id);
                    localStorage.setItem('discord.builders__channelId', id);
                }}
            />

            {gatewayStatus === 'connected' && channelId && (
                <div style={{marginTop: '1rem'}}>
                    <button
                        className={Styles.button}
                        onClick={sendViaBot}
                        style={{width: '100%'}}
                    >
                        Send Message
                    </button>
                </div>
            )}

            <p style={{marginTop: '0.5rem', marginBottom: '2rem', color: 'grey', fontSize: 13}}>
                Token is stored locally and never sent anywhere except Discord's API.
            </p>

            {!!botResponse && <div className={Styles.data}
                                   style={{marginBottom: '2rem', color: (botResponse as any)?.status ? '#98dd98' : '#dd9898'}}>
                {JSON.stringify(botResponse, undefined, 4)}
            </div>}

            {/* ── Button Interactions ── */}
            {configuredButtons.length > 0 && <>
                <p style={{marginBottom: '0.75rem', marginTop: '0rem'}}>
                    <span style={{fontSize: 16, color: 'white', fontWeight: '500'}}>Button Interactions</span>
                </p>
                {configuredButtons.map(btn => {
                    const act = buttonActions[btn.customId];
                    return <div key={btn.customId} style={{
                        background: '#292b2f',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 6,
                        padding: '0.75rem 1rem',
                        marginBottom: '0.75rem',
                    }}>
                        <div style={{color: '#fff', fontWeight: 600, fontSize: 13, marginBottom: 6}}>
                            🔘 {btn.label}
                        </div>
                        {act.steps.map((step, i) => (
                            <div key={step.id} style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 8,
                                padding: '5px 0',
                                borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined,
                            }}>
                                <span style={{fontSize: 13, flexShrink: 0}}>{STEP_ICONS[step.type]}</span>
                                <div style={{minWidth: 0}}>
                                    <span style={{color: '#b5bac1', fontSize: 12, fontWeight: 600}}>{STEP_LABELS[step.type]}</span>
                                    {step.ephemeral && <span style={{
                                        fontSize: 10, background: '#5865f2', color: '#fff',
                                        borderRadius: 3, padding: '1px 5px', marginLeft: 6,
                                    }}>ephemeral</span>}
                                    <div style={{color: '#72767d', fontSize: 11, marginTop: 1, wordBreak: 'break-all'}}>
                                        {stepSummary(step)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>;
                })}
                <p style={{marginBottom: '2rem'}}/>
            </>}

            <Codegen state={state} page={page} setPage={setPage} />

            <div className={Styles.footer}>
                <div className={Styles.langs}>
                    {supportedLngs.map((lang) => (
                        <span key={lang} className={Styles.lang} onClick={() => i18next.changeLanguage(lang)}>{lang}</span>
                    ))}
                </div>
                <div style={{color: '#4e5058', fontSize: '1.2rem'}}>© {new Date().getFullYear()} OpenEmbedded</div>
            </div>
        </div>
    </div>
}

export default App;
