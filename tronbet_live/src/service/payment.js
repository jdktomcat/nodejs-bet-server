

async function withdraw(ctx) {
    let params = ctx.request.body
    console.log(params)

    ctx.body = "TODO"
}


var actions = {withdraw}
module.exports = actions