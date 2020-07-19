import * as console from "console";
import App from "./App";
import ObsSceneButton from "./obs/ObsSceneButton";
import ObsSourceToggleMuteButton from "./obs/ObsSourceToggleMuteButton";
import ObsSourceKnob from "./obs/ObsSourceKnob";
import config from "config";

(async () => {
    const app = new App();
    await app.start();

    await configureApp(app);

    await app.reload();
})().catch(console.error);

async function configureApp(app: App): Promise<void> {
    let obsStateTracker = app.getObsStateTracker();

    // Scenes
    const scenes = obsStateTracker.getSceneList();
    for (let i = 0; i < scenes.length && i < 8; i++) {
        app.registerControl(new ObsSceneButton(112 + i, scenes[i]));
    }

    // Sources
    const sources = config.get<string[]>('obs.audio_sources');
    for (let i = 0; i < sources.length && i < 8; i++) {
        app.registerControl(new ObsSourceToggleMuteButton(96 + i, sources[i]));
        app.registerControl(new ObsSourceKnob(21 + i, sources[i]))
    }
}