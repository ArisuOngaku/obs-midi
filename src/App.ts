import config from "config";
import console from "console";
import MidiControl from "./MidiControl";
import jzz from "jzz";
import ObsWebSocket from "obs-websocket-js";
import LedState from "./LedState";
import ObsStateTracker from "./obs/ObsStateTracker";
import WMSMusicWidget from "./wms/WMSMusicWidget";

export default class App {
    private obs: ObsWebSocket = new ObsWebSocket();
    private obsStateTracker: ObsStateTracker = new ObsStateTracker(this.obs);
    private controls: MidiControl[] = [];
    private midiIn: any;
    private pendingStates: LedState[] = [];
    private readonly wmsMusicWidget: WMSMusicWidget = new WMSMusicWidget();

    public constructor() {

    }

    public registerControl(control: MidiControl) {
        this.controls.push(control);
    }

    public async start(): Promise<void> {
        await this.initObs();
        await this.obsStateTracker.init(this);
        await this.initMidi();
        await this.wmsMusicWidget.start();
    }

    public async stop(): Promise<void> {
        await this.midiIn.close();
        await this.obs.removeAllListeners();
        await this.obs.disconnect();
    }

    public async reload(): Promise<void> {
        await this.obs.removeAllListeners();
        await this.midiIn.close();

        this.obsStateTracker = new ObsStateTracker(this.obs);
        await this.obsStateTracker.init(this);
        await this.initMidi();
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
        this.midiIn = jzz()
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
        await this.midiIn;

        await this.enableInControl();

        for (const control of this.controls) {
            await control.init(this);
        }
    }

    private async handleMidiMessage(msg: any) {
        const eventType = msg['0'];
        const id = msg['1'];
        const velocity = msg['2'];
        console.log('Midi:', eventType, id, velocity);

        for (const control of this.controls) {
            if (control.id === id && await control.handleEvent(this, eventType, velocity)) {
                return;
            }
        }
    }

    public getObs(): ObsWebSocket {
        return this.obs;
    }

    public getObsStateTracker(): ObsStateTracker {
        return this.obsStateTracker;
    }

    private async enableInControl(): Promise<void> {
        // Enable "in control"
        this.led(0, 10, 0, 1);
        this.led(0, 12, 0, 1);

        await this.tick();

        // Led rainbow
        for (let n = 96; n < 105; n++) {
            this.led(0, n, n % 4, (n + 2) % 4, 2000);
            this.led(0, n + 16, n % 4, (n + 2) % 4, 2000);
            await this.tick();
        }

        await new Promise(resolve => {
            setTimeout(resolve, 2000);
        });

        // Init led controls
        await this.updateControls();
    }

    public async updateControls(): Promise<void> {
        for (const control of this.controls) {
            await control.update(this);
        }
        await this.tick();
    }

    public led(
        channel: number,
        note: number,
        green: number,
        red: number,
        duration: number = 0
    ): void {
        this.pendingStates.push(new LedState(
            channel,
            note,
            green,
            red,
            duration
        ));
    }

    public async tick(): Promise<void> {
        let action = jzz().openMidiOut(config.get<string>('midi.output'))
            .or('Cannot open MIDI Out port!');

        for (const state of this.pendingStates) {
            let color = (state.green << 4) | state.red;

            // console.log('Out', state.channel, state.note, color, state.duration);
            // console.log('>', state.green, state.red);

            if (state.duration > 0) {
                action.note(state.channel, state.note, color, state.duration);
            } else {
                action.noteOn(state.channel, state.note, color);
            }
        }
        this.pendingStates = [];

        await action;
    }
}

