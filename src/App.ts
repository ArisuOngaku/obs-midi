import config from "config";
import console from "console";
import MidiControl from "./MidiControl";
import jzz from "jzz";
import ObsWebSocket from "obs-websocket-js";

export default class App {
    private readonly obs: ObsWebSocket = new ObsWebSocket();
    private readonly controls: MidiControl[] = [];
    private jzz: any;

    public constructor() {

    }

    public registerControl(control: MidiControl) {
        this.controls.push(control);
    }

    public async start(): Promise<void> {
        await this.initObs();
        await this.initMidi();
    }

    public async stop(): Promise<void> {
        await this.jzz.stop();
    }

    private async initObs(): Promise<void> {
        const connectionRetryListener = async () => {
            try {
                console.error('Connection closed or authentication failure. Retrying in 2s...');
                await new Promise(resolve => {
                    setTimeout(() => {
                        resolve();
                    }, 2000);
                });
                await this.connectObs();
            } catch (e) {
                console.error(e);
            }
        };
        this.obs.on('ConnectionClosed', connectionRetryListener);
        this.obs.on('AuthenticationFailure', connectionRetryListener);

        await this.connectObs();
    }

    private async connectObs(): Promise<void> {
        await this.obs.connect({
            address: config.get<string>('obs.address'),
            password: config.get<string>('obs.password'),
        });
    }

    private async initMidi(): Promise<void> {
        this.jzz = await jzz()
            .openMidiIn(config.get<string>('midi.controller'))
            .or('Cannot open MIDI In port!')
            .and(function (this: any) {
                console.log('MIDI-In:', this.name());
            })
            .connect(async (msg: any) => {
                try {
                    await this.handleMidiMessage(msg);
                } catch (e) {
                    console.error(e);
                }
            });
    }

    private async handleMidiMessage(msg: any) {
        const eventType = msg['0'];
        const id = msg['1'];
        const velocity = msg['2'];
        console.log('Midi:', eventType, id, velocity);

        for (const control of this.controls) {
            if (control.id === id && await control.handleEvent(eventType, velocity)) {
                return;
            }
        }
    }

    public getObs(): ObsWebSocket {
        return this.obs;
    }
}