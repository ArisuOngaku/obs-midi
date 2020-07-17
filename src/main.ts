import * as console from "console";
import App from "./App";
import ButtonControl from "./ButtonControl";
import Action from "./Action";
import KnobAdvancedControl, {toVolume} from "./KnobAdvancedControl";

(async () => {
    const app = new App();

    app.registerControl(new ButtonControl(50, new class extends Action {
        async execute(velocity: number): Promise<void> {
            await app.getObs().send('SetCurrentScene', {'scene-name': 'Scene 2'});
        }
    }));
    app.registerControl(new ButtonControl(51, new class extends Action {
        async execute(velocity: number): Promise<void> {
            await app.getObs().send('SetCurrentScene', {'scene-name': 'BareMainScreen'});
        }
    }));

    app.registerControl(new ButtonControl(40, new class extends Action {
        async execute(velocity: number): Promise<void> {
            await app.getObs().send('ToggleMute', {source: 'Desktop Audio'});
        }
    }));

    app.registerControl(new ButtonControl(41, new class extends Action {
        async execute(velocity: number): Promise<void> {
            await app.getObs().send('ToggleMute', {source: 'Mic/Aux'});
        }
    }));
    app.registerControl(new KnobAdvancedControl(21, new class extends Action {
        async execute(velocity: number): Promise<void> {
            await app.getObs().send('SetVolume', {source: 'Desktop Audio', volume: toVolume(velocity)});
        }
    }));
    app.registerControl(new KnobAdvancedControl(22, new class extends Action {
        async execute(velocity: number): Promise<void> {
            await app.getObs().send('SetVolume', {source: 'Mic/Aux', volume: toVolume(velocity)});
        }
    }));

    await app.start();
})().catch(console.error);
