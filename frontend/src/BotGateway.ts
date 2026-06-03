export type GatewayStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

type StatusCallback = (status: GatewayStatus, error?: string) => void;

const GATEWAY_URL = 'wss://gateway.discord.gg/?v=10&encoding=json';

const GUILDS_INTENT = 1 << 0; // Required for bot to appear online and receive guild events

export class BotGateway {
    private ws: WebSocket | null = null;
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    private heartbeatAckReceived: boolean = true;
    private sequence: number | null = null;
    private onStatus: StatusCallback;

    constructor(onStatus: StatusCallback) {
        this.onStatus = onStatus;
    }

    connect(token: string) {
        this.disconnect();
        this.onStatus('connecting');

        try {
            this.ws = new WebSocket(GATEWAY_URL);
        } catch (e: any) {
            this.onStatus('error', 'Could not open WebSocket connection.');
            return;
        }

        this.ws.onmessage = (evt) => {
            let payload: any;
            try { payload = JSON.parse(evt.data as string); }
            catch { return; }

            const { op, d, s } = payload;
            if (s != null) this.sequence = s;

            switch (op) {
                case 10: // HELLO — start heartbeat (with jitter) then identify
                    this.startHeartbeat(d.heartbeat_interval);
                    this.send({
                        op: 2,
                        d: {
                            token: `Bot ${token.trim()}`,
                            intents: GUILDS_INTENT,
                            properties: { os: 'linux', browser: 'discord.builders', device: 'discord.builders' },
                            presence: {
                                since: null,
                                activities: [],
                                status: 'online',
                                afk: false,
                            },
                        },
                    });
                    break;

                case 11: // HEARTBEAT_ACK
                    this.heartbeatAckReceived = true;
                    break;

                case 1: // Server requests immediate heartbeat
                    this.send({ op: 1, d: this.sequence });
                    break;

                case 0: // DISPATCH
                    if (payload.t === 'READY') this.onStatus('connected');
                    break;

                case 9: // Invalid session
                    this.onStatus('error', 'Invalid session — check your bot token.');
                    this.disconnect();
                    break;
            }
        };

        this.ws.onclose = (evt) => {
            this.cleanup();
            switch (evt.code) {
                case 4000:
                    this.onStatus('error', 'Unknown error — reconnect and try again.');
                    break;
                case 4004:
                    this.onStatus('error', 'Authentication failed — invalid bot token.');
                    break;
                case 4013:
                    this.onStatus('error', 'Invalid intents.');
                    break;
                case 4014:
                    this.onStatus('error', 'Disallowed intents — enable "Server Members" or other privileged intents in the Discord Developer Portal under Bot → Privileged Gateway Intents.');
                    break;
                case 4011:
                    this.onStatus('error', 'Bot requires sharding to connect.');
                    break;
                case 4012:
                    this.onStatus('error', 'Invalid API version.');
                    break;
                default:
                    if (evt.wasClean) {
                        this.onStatus('disconnected');
                    } else {
                        this.onStatus('error', evt.code ? `Connection closed (code ${evt.code}).` : 'Connection lost unexpectedly.');
                    }
                    break;
            }
        };

        this.ws.onerror = () => {
            this.onStatus('error', 'WebSocket connection error — check your network or bot token.');
        };
    }

    disconnect() {
        this.cleanup();
        if (this.ws) {
            this.ws.onclose = null;
            this.ws.close(1000);
            this.ws = null;
        }
        this.sequence = null;
        this.heartbeatAckReceived = true;
    }

    private startHeartbeat(interval: number) {
        // Send first heartbeat after a random jitter (0–1 × interval) as Discord requires
        const jitter = Math.random();
        const firstDelay = Math.floor(interval * jitter);

        const jitterTimer = setTimeout(() => {
            this.send({ op: 1, d: this.sequence });
            this.heartbeatAckReceived = false;

            // Then heartbeat on the regular interval
            this.heartbeatTimer = setInterval(() => {
                if (!this.heartbeatAckReceived) {
                    // Missed ACK — connection is zombied, close and let caller reconnect
                    this.ws?.close(1001, 'Missed heartbeat ACK');
                    this.onStatus('error', 'Connection lost (missed heartbeat). Please click Start Bot to reconnect.');
                    this.cleanup();
                    return;
                }
                this.heartbeatAckReceived = false;
                this.send({ op: 1, d: this.sequence });
            }, interval);
        }, firstDelay);

        // Store the jitter timer so cleanup can clear it
        (this as any)._jitterTimer = jitterTimer;
    }

    private send(data: object) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    private cleanup() {
        if (this.heartbeatTimer !== null) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        if ((this as any)._jitterTimer !== null) {
            clearTimeout((this as any)._jitterTimer);
            (this as any)._jitterTimer = null;
        }
    }
}
