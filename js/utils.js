
function parseDate(s) {
    // parse date of the form YYYY-MM-DD
    var year = parseInt(s.slice(0,4));
    var month = parseInt(s.slice(5,7));
    var day = parseInt(s.slice(8,10));
    return new Date(year,month-1,day,0,0,0,0);
}

/**
 * Format a javascript Date and return a short string eg "Mon 31 Jul"
 * @param dt
 * @returns {string}
 */
function formatDate(dt) {
    return dt.toString().slice(0,10)
}

function getDates(startDate, endDate) {
    var dates = [],
        currentDate = startDate,
        addDays = function(days) {
            var date = new Date(this.valueOf());
            date.setDate(date.getDate() + days);
            return date;
        };
    while (currentDate <= endDate) {
        dates.push(formatDate(currentDate));
        currentDate = addDays.call(currentDate, 1);
    }
    return dates;
};
