export default abstract class Action {
    public abstract async execute(velocity: number): Promise<void>;
}
