import config from "config";
import WebSocket from "ws";
import child_process from "child_process";

const metadataSeparator = '\n';
/**
 * Watch My Stream (watch-my.stream) music widget
 */
export default class WMSMusicWidget {
    private readonly webSocketAddress: string = config.get<string>('wms.music_widget.ws');
    private readonly token: string = config.get<string>('wms.music_widget.token');
    private activeSocket?: WebSocket;
    private checkInterval?: NodeJS.Timeout;
    private lastSentData?: string;
    private started: boolean = false;

    public constructor() {
    }


    public async start(): Promise<void> {
        if (this.started) return;
        this.started = true;

        if (!this.token || this.token === 'default') {
            console.warn('WMS music widget not started due to missing token.');
            return;
        }

        this.startWebSocket();

        this.checkInterval = setInterval(async () => {
            try {
                if (this.activeSocket) {
                    const metadata = (await this.getInfo()).split(metadataSeparator);
                    const data = JSON.stringify({
                        playing: metadata[0] === 'Playing',
                        author: metadata[1],
                        title: metadata[2],
                        album: metadata[3],
                        artUrl: metadata[4],
                    });
                    if (this.lastSentData !== data) {
                        console.log('WMS music widget out:', data);
                        this.activeSocket.send(data);
                        this.lastSentData = data;
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }, 1000);
    }

    public async stop(): Promise<void> {
        if (typeof this.checkInterval !== 'undefined') {
            clearInterval(this.checkInterval);
            this.checkInterval = undefined;
        }
    }

    private startWebSocket() {
        const socket = new WebSocket(this.webSocketAddress, {});

        socket.on('error', (event) => {
            console.error(event);
        });
        socket.on('close', (code, reason) => {
            this.activeSocket = undefined;
            console.log(`WMS music widget WS closed ${code} ${reason}. Retrying in 2s...`);
            setTimeout(() => this.startWebSocket(), 2000);
        });
        socket.on('open', () => {
            socket.send(JSON.stringify({
                token: this.token,
                type: 'emitter',
            }));
        });

        socket.on('message', data => {
            console.log('WMS music widget WebSocket ready!');
            this.activeSocket = socket;
        });
    }

    private async getInfo(): Promise<string> {
        const format = [
            'status',
            'artist',
            'title',
            'album',
            'mpris:artUrl',
        ].map(s => '{{' + s + '}}').join(metadataSeparator);
        return await this.runCommand(`playerctl metadata -f "${format}" | sed "s/open\\.spotify\\.com/i.scdn.co/"`);
    }

    private async runCommand(command: string): Promise<string> {
        // console.info(`> ${command}`);
        return new Promise<string>((resolve, reject) => {
            child_process.exec(command, {}, (err, stdout, stderr) => {
                if (err) {
                    console.error(stderr);
                    reject(err);
                    return;
                }

                resolve(stdout);
            });
        });
    }
}