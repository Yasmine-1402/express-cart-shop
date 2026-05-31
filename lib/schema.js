const path = require('path');
const fs = require('fs');
const moment = require('moment');
const glob = require('glob');
const Ajv = require('ajv');
const ObjectId = require('mongodb').ObjectId;
// Use Ajv v8 compatible options; disable strict mode for legacy schemas
const ajv = new Ajv({ allErrors: true, strict: false });

const addSchemas = () => {
    const schemaFiles = glob.sync('./lib/**/*.json');
    schemaFiles.forEach((file) => {
        const fileData = JSON.parse(fs.readFileSync(file, 'utf-8'));
        ajv.addSchema(fileData, path.basename(file, '.json'));
    });

    // Email format
    const emailRegex = /^([\w-.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
    ajv.addFormat('emailAddress', emailRegex);

    // Amount format
    const amountRegex = /^\d+\.\d\d$/;
    ajv.addFormat('amount', amountRegex);

    // Alpha string format
    const alphaRegex = new RegExp('^\\d+$');
    ajv.addFormat('alphanumeric', {
        validate: (value) => {
            if(typeof value === 'undefined' || value === 'undefined' || value === ''){
                return true;
            }
            return alphaRegex.test(value);
        }
    });

    // Datetime format
    ajv.addFormat('datetime', {
        validate: (dateTimeString) => {
            return moment(dateTimeString, 'DD/MM/YYYY HH:mm').isValid();
        }
    });

    // ObjectId
    ajv.addFormat('objectid', {
        validate: (objId) => {
            return ObjectId.isValid(objId);
        }
    });

    ajv.addKeyword('isNotEmpty', {
        validate: function validate(schema, data){
            const result = typeof data === 'string' && data.trim() !== '';
            if(!result){
                validate.errors = [{ keyword: 'isNotEmpty', message: 'Cannot be an empty string', params: { keyword: 'isNotEmpty' } }];
            }
            return result;
        },
        errors: true
    });

    try{
        // ajv-errors may not be compatible in some environments; guard its loading
        require('ajv-errors')(ajv);
    }catch(e){
        // ignore if ajv-errors cannot be applied
    }
};

const validateJson = (schema, json) => {
    const result = ajv.validate(schema, json);
    return {
        result,
        errors: ajv.errors
    };
};

module.exports = {
    addSchemas,
    validateJson
};
