const utils = {

    formatNum(num, decimals) {
        return parseFloat(parseFloat(num).toFixed(decimals));
    }

}

module.exports = utils;
