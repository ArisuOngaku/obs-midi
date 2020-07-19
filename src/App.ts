import config from "config";
import console from "console";
import MidiControl from "./MidiControl";
import jzz from "jzz";
import ObsWebSocket from "obs-websocket-js";
import LedState from "./LedState";
import ObsStateTracker from "./obs/ObsStateTracker";
import WMSMusicWidget from "./wms/WMSMusicWidget";
import {sleep} from "./Utils";

export default class App {
    private obs: ObsWebSocket = new ObsWebSocket();
    private obsStateTracker: ObsStateTracker = new ObsStateTracker(this.obs);
    private controls: MidiControl[] = [];
    private midiIn: any;
    private pendingStates: LedState[] = [];
    private readonly wmsMusicWidget: WMSMusicWidget = new WMSMusicWidget();
    private readonly configCallback: () => Promise<void>;
    private animationHandler?: NodeJS.Timeout;
    private animating: boolean = false;
    private animationStopCallback?: () => void;
    private animationCounter: number = 0;

    public constructor(configCallback: () => Promise<void>) {
        this.configCallback = configCallback;
    }

    public registerControl(control: MidiControl) {
        this.controls.push(control);
    }

    public async init(): Promise<void> {
        await this.initialRainbowAnimation();
    }

    public async start(): Promise<void> {
        await this.enableInControl();

        this.obs = new ObsWebSocket();
        await this.initObs();

        this.obsStateTracker = new ObsStateTracker(this.obs);
        await this.obsStateTracker.init(this);

        await this.configCallback();

        await this.initMidiIn();
        await this.wmsMusicWidget.start();
    }

    public async reload(): Promise<void> {
        await this.stop();
        await this.start();
    }

    public async stop(): Promise<void> {
        if (this.midiIn) {
            await this.midiIn.close();
            this.midiIn = undefined;
        }
        await this.obs.removeAllListeners();
        await this.obs.disconnect();
    }

    private async initObs(): Promise<void> {
        let retried = false;
        this.obs.once('ConnectionClosed', async () => {
            if (retried) return;
            retried = true;
            try {
                console.error('Connection closed or authentication failure. Retrying in 2s...');
                await new Promise(resolve => {
                    setTimeout(() => {
                        resolve();
                    }, 2000);
                });
                await this.reload();
            } catch (e) {
                console.error(e);
            }
        });

        await this.connectObs();
    }

    private async connectObs(): Promise<void> {
        await this.obs.connect({
            address: config.get<string>('obs.address'),
            password: config.get<string>('obs.password'),
        });
    }

    private async initMidiIn(): Promise<void> {
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

        await this.stopAnimation();

        // Init led controls
        for (const control of this.controls) {
            await control.init(this);
        }
        await this.updateControls();
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

        await this.loadingMidiAnimation();
    }

    private async initialRainbowAnimation(): Promise<void> {
        // Led rainbow
        for (let n = 96; n < 105; n++) {
            this.led(0, n, n % 4, (n + 2) % 4, 750);
            this.led(0, n + 16, n % 4, (n + 2) % 4, 750);
            await this.tick();
        }
        await sleep(1000);
    }

    private async loadingMidiAnimation(): Promise<void> {
        await this.animate(async () => {
            let i = this.animationCounter % 18;
            let n = 96 + i + (i >= 9 ? 7 : 0);
            this.led(0, n, 1, 3, 250);
            await this.tick();
            await sleep(250);
        }, 0);
    }

    private async animate(animation: () => Promise<void>, ms: number): Promise<void> {
        await this.stopAnimation();

        const run = (first: boolean) => {
            this.animating = true;
            this.animationHandler = setTimeout(async () => {
                try {
                    await animation();
                    this.animationCounter++;
                    if (typeof this.animationHandler !== 'undefined') {
                        run(false);
                    } else {
                        this.signalAnimationEnd();
                    }
                } catch (e) {
                    console.error(e);
                    this.stopAnimation()
                        .catch(console.error);
                    this.signalAnimationEnd();
                }
            }, first ? 0 : ms);
        };
        run(true);
    }

    private signalAnimationEnd() {
        this.animating = false;
        if (this.animationStopCallback) {
            this.animationStopCallback();
            this.animationStopCallback = undefined;
        }
    }

    private async stopAnimation(): Promise<void> {
        if (typeof this.animationHandler !== 'undefined') {
            clearTimeout(this.animationHandler);
            this.animationHandler = undefined;
        }

        await new Promise(resolve => {
            if (this.animating) {
                this.animationStopCallback = resolve;
            } else {
                resolve();
            }
        });
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

