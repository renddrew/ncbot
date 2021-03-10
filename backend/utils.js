const utils = {

  formatNum(num, decimals) {
    return parseFloat(parseFloat(num).toFixed(decimals));
  },

  getPeriodStartEndAverages(periodHist, percentStartEnd) {
    const setSize = parseInt(periodHist.length * percentStartEnd);
    let startTotal = 0;
    let endTotal = 0;
    for (let i = 0; i < periodHist.length; i++) {
      if (i < setSize) {
        startTotal += periodHist[i].p;
      }
      if (i >= (periodHist.length - setSize)) {
        endTotal += periodHist[i].p;
      }
    }
    return {
      start: startTotal / setSize,
      end: endTotal / setSize
    };
  },

  calcStdDeviation(valsList) {

    const listTotal = valsList.reduce((a, b) => a + b, 0);
    const mean = listTotal / valsList.length;

    let variance = 0;
    for (let i = 0; i < valsList.length; i++) {
      variance += ((valsList[i] - mean) * (valsList[i] - mean));
    }

    variance = parseFloat(Math.sqrt(variance / (valsList.length - 1)));

    return variance > 0 ? variance : 0;
  }

}

module.exports = utils;
