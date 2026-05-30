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
import { Trans, useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { supportedLngs } from '../libs.config';
import { ActionMenuComponent } from './ActionMenu';
import { useButtonActions, STEP_LABELS, STEP_ICONS, stepSummary } from './ButtonActionsContext';
import { BotChannelSelector } from './BotChannelSelector';
import { BotGateway, GatewayStatus } from './BotGateway';


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
    const gateway = useRef<BotGateway | null>(null);

    // disconnect gateway on unmount
    useEffect(() => () => { gateway.current?.disconnect(); }, []);

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

    const discordGet = async (path: string, token: string) => {
        const res = await fetch(`https://discord.com/api/v10${path}`, {
            headers: { Authorization: `Bot ${token.trim()}` },
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body?.message || `Discord API error ${res.status}`);
        }
        return res.json();
    };

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

        // 1. Connect to Discord Gateway (makes bot appear online)
        if (!gateway.current) {
            gateway.current = new BotGateway((status, err) => {
                setGatewayStatus(status);
                if (err) setGatewayError(err);
            });
        }
        gateway.current.connect(token);

        // 2. Fetch guild list via REST so user can pick server + channel
        try {
            const data = await discordGet('/users/@me/guilds', token);
            const sorted = [...data].sort((a: any, b: any) => a.name.localeCompare(b.name));
            setBotGuilds(sorted);
        } catch (e: any) {
            setBotConnectError(e?.message || 'Failed to load servers. Check your bot token.');
            gateway.current?.disconnect();
        } finally {
            setBotConnecting(false);
        }
    };

    const selectGuild = async (guildId: string) => {
        setBotSelectedGuild(guildId);
        localStorage.setItem('discord.builders__guildId', guildId);
        setBotChannels([]);
        setChannelId('');
        if (!guildId) return;
        setChLoading(true);
        try {
            const data = await discordGet(`/guilds/${guildId}/channels`, botToken);
            const sorted = [...data].sort((a: any, b: any) => a.position - b.position);
            setBotChannels(sorted);
        } catch (e: any) {
            setBotConnectError(e?.message || 'Failed to load channels.');
        } finally {
            setChLoading(false);
        }
    };

    const sendViaBot = async () => {
        setBotResponse(null);
        try {
            const body = JSON.stringify({ components: state, flags: 32768 });
            const req = await fetch(
                `https://discord.com/api/v10/channels/${channelId.trim()}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bot ${botToken.trim()}`,
                    },
                    body,
                }
            );
            const status_code = req.status;
            if (status_code === 200 || status_code === 201) {
                setBotResponse({ status: `${status_code} Success` });
            } else {
                const error_data = await req.json();
                setBotResponse(error_data);
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

            <p><Trans t={t} i18nKey={"welcome.github"} components={{
                b: <b />,
                br: <br />,
                a: <a href="https://github.com/StartITBot/discord.builders" target="_blank"/>,
            }} /></p>
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
        <ErrorBoundary fallback={<></>}>
            <Capsule state={state}
                     stateManager={stateManager}
                     stateKey={stateKey}
                     passProps={passProps}
                     className={Styles.preview}
                     errors={errors}
            />
        </ErrorBoundary>
        <div className={Styles.json}>
            <h1>discord.builders — {t('homepage.title')}</h1>
            <a href="https://github.com/StartITBot/discord.builders" target="_blank"><div className={Styles.badges}>
                <img alt="Star on GitHub"
                     src="https://img.shields.io/github/stars/StartITBot/discord.builders?style=for-the-badge&logo=github&label=Star+on+GitHub&color=007ec6" />
                <img alt="GitHub contributors"
                     src="https://img.shields.io/github/contributors/StartITBot/discord.builders?style=for-the-badge&color=248045" />
                <img alt="GitHub commits"
                     src="https://img.shields.io/github/commit-activity/t/StartITBot/discord.builders?style=for-the-badge&color=248045" />
            </div></a>

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
                    gateway.current?.disconnect();
                }}
                style={{marginBottom: '0.75rem'}}
                onKeyDown={ev => { if (ev.key === 'Enter' && botToken.trim()) connectBot(); }}
            />

            <button
                className={Styles.button}
                disabled={!botToken.trim() || botConnecting || gatewayStatus === 'connecting'}
                onClick={connectBot}
                style={{width: '100%', marginBottom: '0.5rem'}}
            >
                {botConnecting || gatewayStatus === 'connecting'
                    ? 'Starting…'
                    : gatewayStatus === 'connected'
                    ? 'Restart Bot'
                    : 'Start Bot'}
            </button>

            {(botConnectError || gatewayError) && (
                <p style={{color: '#ed4245', fontSize: 13, marginBottom: '0.5rem'}}>
                    ⚠ {botConnectError || gatewayError}
                </p>
            )}

            {gatewayStatus === 'connected' && (
                <p style={{color: '#3ba55d', fontSize: 13, marginBottom: '0.5rem'}}>
                    ✓ Bot is online in Discord. It will go offline when you close this page.
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
                <div><Trans t={t} i18nKey={"author"} components={{
                    a: <a href={"https://startit.bot/?utm_source=discord.builders"} target={"_blank"} />
                }} /></div>
            </div>
        </div>
    </div>
}

export default App;
