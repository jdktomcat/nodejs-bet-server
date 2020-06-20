
function injectPromise(func, ...args) {
    return new Promise((resolve, reject) => {
        func(...args, (err, res) => {
            if(err)
                reject(err);
            else resolve(res);
        });
    });
}

module.exports.injectPromise = injectPromise;