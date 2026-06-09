function softDelete(schema) {
    schema.add({ isDeleted: { type: Boolean, default: false } });

    schema.pre(/^find/, function () {
        if (!this.getOptions().includeDeleted) {
            this.where({ isDeleted: false });
        }
    })
}

module.exports = softDelete;