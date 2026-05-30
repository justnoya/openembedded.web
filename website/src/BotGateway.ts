export type GatewayStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

type StatusCallback = (status: GatewayStatus, error?: string) => void;

const GATEWAY_URL = 'wss://gateway.discord.gg/?v=10&encoding=json';

export class BotGateway {
    private ws: WebSocket | null = null;
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
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
                case 10: // HELLO — start heartbeat then identify
                    this.startHeartbeat(d.heartbeat_interval);
                    this.send({
                        op: 2,
                        d: {
                            token: `Bot ${token.trim()}`,
                            intents: 0,
                            properties: { os: 'linux', browser: 'discord.builders', device: 'discord.builders' },
                        },
                    });
                    break;

                case 11: // HEARTBEAT_ACK
                    break;

                case 1: // Server requests heartbeat
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
            if (evt.code === 4004) {
                this.onStatus('error', 'Authentication failed — invalid bot token.');
            } else if (evt.code === 4013) {
                this.onStatus('error', 'Invalid intents.');
            } else if (evt.wasClean) {
                this.onStatus('disconnected');
            } else {
                this.onStatus('disconnected');
            }
        };

        this.ws.onerror = () => {
            this.onStatus('error', 'WebSocket connection error.');
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
    }

    private startHeartbeat(interval: number) {
        this.heartbeatTimer = setInterval(() => {
            this.send({ op: 1, d: this.sequence });
        }, interval);
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
    }
}
