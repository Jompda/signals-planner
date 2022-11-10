export default abstract class Action {
    abstract forward(): this
    abstract reverse(): this
}