class CraftingRecipe {
    constructor(requirement, output) {
        this.requirement = requirement;
        this.output = output;
    }

    requirement;
    output;
}
module.exports = CraftingRecipe;