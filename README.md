# Data studio connector

This is a community connector that is able to fetch json data from a given url and send it to google data studio for processing.

This is not a complete connector as it does not address some use cases(see missing features section).

I built this for my specific needs, without generalizing it too much and decided to share it in case anyone else could benefit from it, since there is little content online about building custom google data studio connectors. 

Nonetheless, it can serve simple purposes and anyone is free to copy and adapt it to cater for their specific use case.

# TLDR;
 you can understand most of this code by completing the codelab at: https://codelabs.developers.google.com/codelabs/community-connectors/#9

## Usage
Follow step 13 of https://codelabs.developers.google.com/codelabs/community-connectors/#13 

Please note that the API must return a json array, objects are not yet supported.

## Dependencies
   - [lodash packaged for google app script(see link for usage instructions)](https://github.com/contributorpw/lodashgs)

## Missing features
- Support fetching data for custom date ranges.
- Custom post parameters
- Custom HTTP headers
- Different authentication types for using the connector
- Tests.

## License
[MIT](https://choosealicense.com/licenses/mit/)


## Helper articles:

- https://bajena3.medium.com/building-a-custom-google-data-studio-connector-from-a-z-part-2-oauth-calling-apis-caching-edb3e25b18e7
- https://developers.google.com/datastudio/connector/build
