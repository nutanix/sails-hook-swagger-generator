'use strict';
var _ = require('lodash');
var generators = require('./generators');
var yaml = require('js-yaml');
var fs = require('fs');
var openapi = require('swagger2openapi');

module.exports = function (sails, context) {
    if (sails.config[context.configKey].disabled === true) {
        return;
    }

    var specifications = sails.config[context.configKey].swagger;
    specifications.tags = generators.tags(sails.models);
    specifications.definitions = generators.definitions(sails.models);
    specifications.parameters = generators.parameters(sails.config, context);


    var generatedRoutes = generators.routes(sails.controllers, sails.config, specifications.tags);
    specifications.paths = generators.paths(generatedRoutes, specifications.tags, sails.config[context.configKey]);

    specifications.paths = Object.keys(specifications.paths).sort().reduce(function (result, key) {
        result[key] = specifications.paths[key];
        return result;
    }, {});

    /**
     * clean up of specification
     * removing unwanted params
     */
    /*specifications.tags = _.map(specifications.tags, function (tag) {        
        delete tag.identity;
        return tag;
    });*/

    delete specifications.tags

    openapi.convertStr(JSON.stringify(specifications), {}, function(err, options){
        if (err) {
            return console.log(err);
        }

        fs.writeFile(sails.config[context.configKey].swaggerJsonPath, yaml.safeDump(options.openapi), function (err) {
            if (err) {
                return console.log(err);
            }

            console.log("Swagger generated successfully");
        });
    })

    

    return specifications;

};