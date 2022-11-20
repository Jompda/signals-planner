export default abstract class Action {
    public added: boolean
    abstract forward(): this
    abstract reverse(): this
}