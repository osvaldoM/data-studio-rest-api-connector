//make sure Lodash library is loaded, otherwise, the script fails without explaining why
const _ = LodashGS.load();

const cc = DataStudioApp.createCommunityConnector();

/**
 * Returns the Auth Type of this connector.
 * @return {object} The Auth type.
 */
function getAuthType(){
    return cc.newAuthTypeResponse()
        .setAuthType(cc.AuthType.NONE)
        .build();
}

/*
* This function generates the visual elements seen on the config screen.
* It also sets the date range to required. This ensures that Google Data Studio will always send the date range of a given widget
* in the request JSON.
*/
function getConfig(request){
    const config = cc.getConfig();

    config
        .newTextInput()
        .setId('api_url')
        .setName(
            'Enter a the url to the json resource'
        )
        .setHelpText('e.g. https://mysite/api/data.json&API_KEY=mykey')
        .setPlaceholder('https://mysite/api/data.json&API_KEY=mykey')
        .setAllowOverride(true);

    return config.build();
}

function isAdminUser(request){
    return true;
}

function isValidDate(dateString){
    const regEx = /^\d{8}$/;
    return dateString.match(regEx) != null;
}

//https://stackoverflow.com/a/7390612/4043487
function toType(obj){
    if(isValidDate('' + obj)){
        return 'date';
    }
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}

function getType(value){
    const types = cc.FieldType,
        typeMap = new Map();

    typeMap.set('number', types.NUMBER);
    typeMap.set('string', types.TEXT);
    typeMap.set('date', types.YEAR_MONTH_DAY);

    return typeMap.get(toType(value));
}

// [START get_schema]
function getFields(request){
    const fields = cc.getFields(),
        data = getDataFromAPI(request);

    if(!_.isArray(data)){
        cc.newUserError()
            .setDebugText('Error: returned data from API is not an array')
            .setText(
                'Error: returned data from API is not an array'
            )
            .throwException();
    }
    let sampleData = data[0];
    let keys = Object.keys(sampleData);

    keys.forEach(function (key, index){
        fields
            .newDimension()
            .setId(key)
            .setName(key)
            .setType(getType(sampleData[key]));
    });

    return fields;
}

// https://developers.google.com/datastudio/connector/reference#getschema
function getSchema(request){
    return {schema: getFields(request).build()};
}

function getData(request){
    let requestedFieldIds = request.fields.map(function (field){
        return field.name;
    });
    const requestedFields = getFields(request).forIds(requestedFieldIds);

    const apiResponse = getDataFromAPI(request);
    const normalizedResponse = normalizeResponse(request, apiResponse);
    const data = getFormattedData(normalizedResponse, requestedFields);
    console.log('requested fields: ', requestedFields.asArray().map(f => f.getId()), data.slice(0, 20));
    return {
        schema: requestedFields.build(),
        rows: data
    };
}

/**
 * Formats the parsed response from external data source into correct tabular
 * format and returns only the requestedFields
 *
 * @param {Object} parsedResponse The response string from external data source
 *     parsed into an object in a standard format.
 * @param {Array} requestedFields The fields requested in the getData request.
 * @returns {Array} Array containing rows of data in key-value pairs for each
 *     field.
 */
function getFormattedData(response, requestedFields){
    const requestedFieldsAsArray = requestedFields.asArray().map(field => field.getId());
    const formattedData = response.map(function (result){
        return {values: Object.values(_.pick(result, requestedFieldsAsArray)).map(f => '' + f)}
    });

    return formattedData;
}

function getDataFromAPI(request, skipCache){
    let apiResponse;

    try {
        if(!skipCache){
            const cache = new DataCache(CacheService.getScriptCache(), request.configParams.api_url);
            const cacheHit = fetchFromCache(cache);
            if(cacheHit){
                return cacheHit
            }
        }

        apiResponse = fetchDataFromApi(request);
        const json = apiResponse.getContentText();
        const data = JSON.parse(json);
        setInCache(data, cache);
        return data;
    } catch (e) {
        cc.newUserError()
            .setDebugText('Error fetching data from API. Exception details: ' + e)
            .setText(
                'The connector has encountered an unrecoverable error. Please try again later, or file an issue if this error persists.'
            )
            .throwException();
    }
}

/**
 * Gets response for UrlFetchApp.
 *
 * @param {Object} request Data request parameters.
 * @returns {string} Response text for UrlFetchApp.
 */
function fetchDataFromApi(request){
    const url = request.configParams.api_url;
    const response = UrlFetchApp.fetch(url);
    return response;
}

/**
 * Standardizes the object structure and removes strange values
 * for single vs multiple result items.
 *
 * @param {Object} request Data request parameters.
 * @param {string} response Response from the API.
 * @return {Array} Contains response items.
 */

function normalizeResponse(request, response){
    if(!_.isArray(response)){
        return [];
    }
    //filter out any item that is not an object
    return response.filter(item => _.isObject(item));
}

function fetchFromCache(cache){
    let data = null;
    try {
        const dataString = cache.get();
        if(_.isEmpty(dataString))
            return false;
        data = JSON.parse(dataString);
        console.log('Fetched successfully from cache', data.length);
    } catch (e) {
        console.log('Error when fetching from cache:', e);
    }

    return data;
}

function setInCache(data, cache){
    console.log('Setting data to cache...');
    try {
        cache.set(JSON.stringify(data));
    } catch (e) {
        console.log('Error when storing in cache', e);
    }
}
