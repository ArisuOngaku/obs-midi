import ObsWebSocket from "obs-websocket-js";
import App from "../App";

export default class ObsStateTracker {
    private readonly obs: ObsWebSocket;
    private currentScene: string = '';
    private scenes: ObsWebSocket.Scene[] = [];
    private sources: { name: string, type: string, typeId: string }[] = [];
    private sourceMuteStates: { [p: string]: boolean } = {};

    public constructor(obs: ObsWebSocket) {
        this.obs = obs;
    }

    public async init(app: App): Promise<void> {
        // Current scene
        this.obs.on('SwitchScenes', async data => {
            try {
                await this.setScene(data['scene-name']);
            } catch (e) {
                console.error(e);
            }
        });
        this.currentScene = (await this.obs.send('GetCurrentScene')).name;

        // Scene list
        this.obs.on('ScenesChanged', async data => {
            console.log('Scenes changed.');
            try {
                await this.updateScenes();
            } catch (e) {
                console.error(e);
            }
        });
        await this.updateScenes();

        // Source list
        const sourceUpdateListener = async () => {
            try {
                await this.updateSources();
            } catch (e) {
                console.error(e);
            }
        };
        this.obs.on('SourceCreated', sourceUpdateListener);
        this.obs.on('SourceDestroyed', sourceUpdateListener);
        this.obs.on('SourceRenamed', sourceUpdateListener);

        // Source mute states
        this.obs.on('SourceMuteStateChanged', data => {
            this.sourceMuteStates[data.sourceName] = data.muted;
        });

        await this.updateSources();
    }

    private async updateScenes(): Promise<void> {
        let data = await this.obs.send('GetSceneList');
        this.scenes = data.scenes;
        await this.setScene(data["current-scene"]);
        console.log('Scene switched to', this.currentScene);
    }

    private async updateSources(): Promise<void> {
        this.sources = (<any>(await this.obs.send('GetSourcesList')).sources);

        // Source mute states
        this.sourceMuteStates = {};
        console.log('Loading source mute states...');
        for (const source of this.sources) {
            console.log('>', source.name);
            this.sourceMuteStates[source.name] = (await this.obs.send('GetMute', {source: source.name})).muted;
        }
    }

    public getCurrentScene(): string {
        return this.currentScene;
    }

    private async setScene(scene: string): Promise<void> {
        if (this.currentScene !== scene) {
            this.currentScene = scene;
            console.log('Scene switched to', this.currentScene);
        }
    }

    public getSceneList(): string[] {
        return this.scenes.map(s => s.name);
    }

    public getSourcesList(): string[] {
        return this.sources.map(s => s.name);
    }

    public isSourceMuted(sceneName: string): boolean {
        return this.sourceMuteStates[sceneName];
    }
}