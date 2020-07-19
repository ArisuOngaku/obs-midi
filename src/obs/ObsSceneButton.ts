import ButtonControl from "../ButtonControl";
import App from "../App";
import LedStateUpdater from "../LedStateUpdater";
import Action from "../Action";

export default class ObsSceneButton extends ButtonControl implements Action, LedStateUpdater {
    private readonly sceneName: string;

    public constructor(id: number, sceneName: string, triggerOnUp: boolean = false) {
        super(id, triggerOnUp);
        this.sceneName = sceneName;
        this.action = this;
        this.ledId = id;
        this.ledStateUpdater = this;
    }

    public async init(app: App): Promise<void> {
        app.getObs().on('SwitchScenes', async data => {
            try {
                await this.update(app);
                await app.tick();
            } catch (e) {
                console.error(e);
            }
        });
    }

    public async updateLedState(app: App, ledId: number): Promise<void> {
        let isCurrentScene = this.isCurrentScene(app);
        app.led(0, ledId, isCurrentScene ? 3 : 0, isCurrentScene ? 0 : 3);
    }

    private isCurrentScene(app: App) {
        return app.getObsStateTracker().getCurrentScene() === this.sceneName;
    }

    public async performAction(app: App, velocity: number): Promise<void> {
        if (!this.isCurrentScene(app)) {
            app.led(0, this.ledId!, 1, 3);
            await app.tick();
        }
        await app.getObs().send('SetCurrentScene', {'scene-name': this.sceneName});
    }
}