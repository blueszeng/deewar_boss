/**
 * Created by jimmychou on 15/1/8.
 */
var _u = require('underscore');

var DEFAULT_LIMIT = 100;

/**
 * Constructor
 * @param options Refer to README.md for a list of properties
 * @return {Object}
 */
module.exports = function (options) {

    var self = {
        sTableName: options.sTableName,
        sCountColumnName: options.sCountColumnName,   // Name of column to use when counting total number of rows. Defaults to "id"
        sDatabase: options.sDatabase,           // If set, then do "USE useDatabase;" prior to query
        aoColumnDefs: options.aoColumnDefs,
        aSearchColumns: options.aSearchColumns,     // If specified then use instead of aoColumnDefs to determine names of columns to search
        sSelectSql: options.sSelectSql,           // alternate select statement
        sFromSql: options.sFromSql,           // alternate select statement
        sWhereAndSql: options.sWhereAndSql,           // Custom caller SQL, added as AND where to add date range or other checks (caller must write the SQL)
        sDateColumnName: options.sDateColumnName,   // If set then only get entries within the range (can use sWhereSql instead)
        dateFrom: options.dateFrom,                 // Only retrieve content from before this date. sDateColumnName must be set.
        dateTo: options.dateTo,                     // Only retrieve content from after this date. sDateColumnName must be set.
        fnRowFormatter: options.fnRowFormatter,
        oRowFormatterParams: options.oRowFormatterParams,
        oRequestQuery: options.oRequestQuery,           // Usually passed in with buildQuery
        sAjaxDataProp: options.sAjaxDataProp || 'data',           // The name of the data prop to set on the return value (usually aData or aaData, defaults to aaData).

        dbType: options.dbType,                     // Set to postgres, otherwise uses MySQL syntax
        sJoinTable: options.sJoinTable,

        queryMap: {},
        buildQuery: buildQuery,
        parseResponse: parseResponse,
        filteredResult: filteredResult
    };

    /**
     * (private) Build an optional "USE sDatabase" query string, if sDatabase is set.
     * @return {String} "USE sDatabase; " or "" if sDatabase is not set
     */
    function buildUseStatement() {
        return self.sDatabase ? ( "USE " + self.sDatabase + ";" ) : undefined;
    }

    /**
     * (private) Build the date partial that is used in a WHERE clause
     * @return {*}
     */
    function buildDatePartial() {
        if (self.sDateColumnName && self.dateFrom || self.dateTo) {
            if (self.dateFrom && self.dateTo) {
                return self.sDateColumnName + " BETWEEN '" + self.dateFrom.format('YYYY-MM-DD HH:mm:ss') + "' AND '" + self.dateTo.format('YYYY-MM-DD HH:mm:ss') + "'";
            } else if (self.dateFrom) {
                return self.sDateColumnName + " >= '" + self.dateFrom.toISOString() + "'";
            } else if (self.dateTo) {
                return self.sDateColumnName + " <= '" + self.dateTo.toISOString() + "'";
            }
        }
        return undefined;
    }

    /**
     * (private) Build a complete SELECT statement that counts the number of entries.
     * @param requestQuery If specified then produces a statement to count the filtered list of records.
     * Otherwise the statement counts the unfiltered list of records.
     * @return {String} A complete SELECT statement
     */
    function buildCountStatement(requestQuery) {
        var result = "SELECT COUNT(";
        result += self.sSelectSql ? "*" : (self.sCountColumnName ? self.sCountColumnName : "id");
        result += ") FROM ";
        result += self.sFromSql ? self.sFromSql : self.sTableName;
        result += buildWherePartial(requestQuery);
        return result + ";";
    }

    function buildAllCountStatement() {
        var result = "SELECT COUNT(";
        result += self.sSelectSql ? "*" : (self.sCountColumnName ? self.sCountColumnName : "id");
        result += ") FROM ";
        result += self.sFromSql ? self.sFromSql : self.sTableName;
        var dateWhereSQL = buildDatePartial();
        if (dateWhereSQL){
            result += ' WHERE ' + dateWhereSQL;
        }
        return result + ";";
    }

    /**
     * (private) Build the WHERE clause
     * otherwise uses aoColumnDef mData property.
     * @param sSearchString
     * @return {String}
     */
    function buildGlobalWherePartial(sSearchString) {
        var sWheres = [];
        var sSearchQuery = buildGlobalSearchPartial(sSearchString);
        if (sSearchQuery)
            sWheres.push(sSearchQuery);
        if (self.sWhereAndSql)
            sWheres.push(self.sWhereAndSql);
        var dateSql = buildDatePartial();
        if (dateSql)
            sWheres.push(dateSql);
        if (sWheres.length)
            return " WHERE (" + sWheres.join(") AND (") + ")";
        return "";
    }

    function checkColumnSearch(requestQuery){
        var hasSearch = false;
        for (var i = 0; i < requestQuery.iColumns; i++) {
            var column = requestQuery['sSearch_' + i];
            if (column && column.length > 0) {
                hasSearch = true;
                break;
            }
        }
        return hasSearch;
    }

    function buildColumnWherePartial(requestQuery){
        var query = [];
        for (var i = 0; i < requestQuery.iColumns; i++){
            var column = requestQuery['sSearch_' + i];
            if (!column){
                continue;
            }
            var columndef = self.aoColumnDefs[i];
            if (columndef && columndef.mData && columndef.bSearchable && columndef.bSearchable == true){
                var regex = requestQuery['bRegex_' + i];
                var querystring;
                if (regex && regex == 'true'){
                    querystring = columndef.mData + " like '%" + column + "%'";
                } else {
                    querystring = columndef.mData + " = '" + column + "'";
                }
                query.push(querystring);
            }
        }
        var sSearchQuery =  query.length ? query.join(" AND ") : undefined;
        var sWheres = [];
        if (sSearchQuery)
            sWheres.push(sSearchQuery);
        if (self.sWhereAndSql)
            sWheres.push(self.sWhereAndSql);
        var dateSql = buildDatePartial();
        if (dateSql)
            sWheres.push(dateSql);
        if (sWheres.length)
            return " WHERE (" + sWheres.join(") AND (") + ")";
        return "";
    }

    function buildWherePartial(requestQuery) {
        if (requestQuery.sSearch){
            return buildGlobalWherePartial(requestQuery.sSearch);
        } else {
            return buildColumnWherePartial(requestQuery);
        }
    }

    /**
     * (private)  Builds the search portion of the WHERE clause using LIKE (or ILIKE for PostgreSQL).
     * Uses column names from the aSearchColumns, if defined, Otherwise uses
     * columns in aoColumnDefs that are marked with bSearchable true.
     * @param sSearchString The string for which we are to search
     * @return {String} A portion of a WHERE clause that does a search on all searchable row entries.
     */
    function buildGlobalSearchPartial(sSearchString) {
        var query = [];
        if (sSearchString) {
            if (self.aSearchColumns) {
                for (var sdx = 0; sdx < self.aSearchColumns.length; ++sdx) {
                    if (self.dbType === 'postgres') {
                        query.push("CAST(" + self.aSearchColumns[sdx] + " as text)" + " ILIKE '%" + sSearchString + "%'");
                    } else {
                        query.push(self.aSearchColumns[sdx] + " LIKE '%" + sSearchString + "%'");
                    }
                }
            } else if (self.aoColumnDefs) {
                for (var fdx = 0; fdx < self.aoColumnDefs.length; ++fdx) {
                    if (self.aoColumnDefs[fdx].bSearchable)
                        if (self.dbType === 'postgres') {
                            query.push("CAST(" + self.aoColumnDefs[fdx].mData + " as text)" + " ILIKE '%" + sSearchString + "%'");
                        } else {
                            query.push(self.aoColumnDefs[fdx].mData + " LIKE '%" + sSearchString + "%'");
                        }
                }
            }
        }
        return query.length ? query.join(" OR ") : undefined;
    }


    /**
     * (private) Adds an ORDER clause that uses the names of the columns in the aoColumnDefs array.
     * The column names are extracted from the column sOrder property, if present, otherwise from the mData property.
     * Note that sOrder is a custom Datatable property for the aoColumnDefs array. You might use sOrder if
     * your query were returning 8 columns that are then processed using fnRowFormatter to produce the number of
     * columns that you have defined in aoColumnDefs.
     * @param requestQuery The Datatable query string (we look at sort direction and sort columns)
     * @return {String} The ORDER clause
     */
    function buildOrderingPartial(requestQuery) {
        var query = [];
        var iSortingCols = ( requestQuery && requestQuery.iSortingCols ) ? parseInt(requestQuery.iSortingCols, 10) : 0;
        for (var fdx = 0; fdx < iSortingCols; ++fdx) {
            var key = "iSortCol_" + String(fdx);
            var value = requestQuery[key] ? parseInt(requestQuery[key], 10) : -1;
            if (value >= 0 && value < self.aoColumnDefs.length && requestQuery["bSortable_" + String(value)] === 'true') {
                var colName = self.aoColumnDefs[value].sOrder ? self.aoColumnDefs[value].sOrder : self.aoColumnDefs[value].mData;
                var sortDir = sanitize(requestQuery['sSortDir_' + String(fdx)], 8);
                sortDir = sortDir.match(/^asc/i) ? 'ASC' : 'DESC';
                if (colName && sortDir)
                    query.push(colName + " " + sortDir.toUpperCase());
            }
        }
        if (query.length)
            return " ORDER BY " + query.join(", ");
        return "";
    }

    /**
     * Build a LIMIT clause
     * @param requestQuery The Datatable query string (we look at iDisplayLength and iDisplayStart)
     * @return {String} The LIMIT clause
     */
    function buildLimitPartial(requestQuery) {
        var sLimit = "";
        if (requestQuery && requestQuery.iDisplayStart !== undefined) {
            var start = parseInt(requestQuery.iDisplayStart, 10);
            if (start >= 0) {
                var len = parseInt(requestQuery.iDisplayLength, 10);
                sLimit = (self.dbType === 'postgres') ? " OFFSET " + String(start) + " LIMIT " : " LIMIT " + String(start) + ", ";
                sLimit += ( len > 0 ) ? String(len) : String(DEFAULT_LIMIT);
            }
        }
        return sLimit;
    }

    /**
     * Build the base SELECT statement.
     * @return {String} The SELECT partial
     */
    function buildSelectPartial() {
        var query = "SELECT ";
        query += self.sSelectSql ? self.sSelectSql : "*";
        query += " FROM ";
        query += self.sFromSql ? self.sFromSql : self.sTableName;
        return query;
    }

    /**
     * Build an array of query strings based on the Datatable parameters
     * @param requestQuery The datatable parameters that are generated by the client
     * @return {Array} An array of query strings, each including a terminating semicolon.
     */
    function buildQuery(requestQuery) {
        var queries = [];
        if (typeof requestQuery !== 'object')
            return queries;
        self.queryMap = {};
        var sSearch = sanitize(requestQuery.sSearch);
        self.oRequestQuery = requestQuery;
        var useStmt = buildUseStatement();
        if (useStmt) {
            queries.push(useStmt);
            self.queryMap.use = queries.length - 1;
        }
        queries.push(buildAllCountStatement());
        self.queryMap.iTotalRecords = queries.length - 1;
        if (sSearch) {
            queries.push(buildCountStatement(requestQuery));
            self.queryMap.iTotalDisplayRecords = queries.length - 1;
        } else if (checkColumnSearch(requestQuery) == true){
            queries.push(buildCountStatement(requestQuery));
            self.queryMap.iTotalDisplayRecords = queries.length - 1;
        }
        var query = buildSelectPartial();

        query += buildWherePartial(requestQuery);
        query += buildOrderingPartial(requestQuery);
        query += buildLimitPartial(requestQuery);
        query += ";";
        queries.push(query);
        self.queryMap.select = queries.length - 1;
      //  console.log("xxx-->", queries)
        return queries;
    }

    /**
     * Parse the responses from the database and build a Datatable response object.
     * @param queryResult An array of SQL response objects, each of which must, in order, correspond with a query string
     * returned by buildQuery.
     * @return {Object} A Datatable reply that is suitable for sending in a response to the client.
     */
    function parseResponse(queryResult) {
        var oQuery = self.oRequestQuery;
        var result = { iTotalDisplayRecords: 0, iTotalRecords: 0 };
        if (oQuery && typeof oQuery.sEcho === 'string') {
            // Cast for security reasons, as per http://datatables.net/usage/server-side
            result.sEcho = parseInt(oQuery.sEcho,10);
        } else {
            result.sEcho = 0;
        }
        if (queryResult && queryResult.length > 1) {
            var objArray = queryResult[self.queryMap.select];
            var countObj = queryResult[self.queryMap.iTotalRecords];
            result.iTotalDisplayRecords = result.iTotalRecords = extractCount(countObj);
            if (self.queryMap.iTotalDisplayRecords) {
                var displayCountObj = queryResult[self.queryMap.iTotalDisplayRecords];
                result.iTotalDisplayRecords = extractCount(displayCountObj);
            }
            //var displayStart = ( oQuery && oQuery.iDisplayStart ) ? parseInt(oQuery.iDisplayStart, 10) : 0;
            var displayLength = ( oQuery && oQuery.iDisplayLength ) ? parseInt(oQuery.iDisplayLength, 10) : 10;
            if( displayLength < 0 ) {
                displayLength = DEFAULT_LIMIT;
            }
            displayLength = Math.min(displayLength, objArray.length);
            //var displayEnd = displayStart + displayLength;
            result[self.sAjaxDataProp] = [];
            //console.log( "DisplayStart %d DisplayEnd %d DisplayLength %d", displayStart, displayEnd, displayLength );
            for (var rdx = 0; rdx < displayLength; ++rdx) {
                var filteredResult = [];
                // console.log("Index = %d", rdx);
                if (self.fnRowFormatter) {
                    filteredResult = self.fnRowFormatter(objArray[rdx], self.aoColumnDefs, self.oRowFormatterParams);
                } else {
                    for (var fdx = 0; fdx < self.aoColumnDefs.length; ++fdx) {
                        var key = self.aoColumnDefs[fdx].mData;
                        filteredResult.push(objArray[rdx][key]);
                        // filteredResult[fdx] = objArray[rdx][key];
                    }
                }
                result[self.sAjaxDataProp].push(filteredResult);
            }
        }
        return result;

    }

    /**
     * (private)
     * @param obj
     * @return {*}
     */
    function extractCount(obj) {
        var values;
        if (obj && obj.length)
            values = _u.values(obj[0]);
        if (values && values.length)
            return values[0];
        return 0;
    }

    /**
     * Debug, reduced size object for display
     * @param obj
     * @return {*}
     */
    function filteredResult(obj, count) {
        if (obj) {
            var result = _u.omit(obj, self.sAjaxDataProp );
            result.aaLength = obj[self.sAjaxDataProp] ? obj[self.sAjaxDataProp].length : 0;
            result[self.sAjaxDataProp] = [];
            count = count ? Math.min(count, result.aaLength) : result.aaLength;
            for (var idx = 0; idx < count; ++idx) {
                result[self.sAjaxDataProp].push(obj[self.sAjaxDataProp][idx]);
            }
            return result;
        }
        return null;
    }

    return self;
};


function sanitize(str, len) {
    len = len || 256;
    if (!str || typeof str === 'string' && str.length < 1)
        return str;
    if (typeof str !== 'string' || str.length > len)
        return null;
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\" + char; // prepends a backslash to backslash, percent,
            // and double/single quotes
        }
    });
}
