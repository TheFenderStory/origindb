'use strict';

const _ = require('lodash');
const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');
const jph = require('json-parse-helpfulerror');
const path = require('path');

function Mongo(url, objects, checksums, options) {
  function save(name) {
    const checksum = JSON.stringify(objects[name]);

    if (checksums[name] === checksum) return;

    checksums[name] = checksum;

    MongoClient.connect(url, function(err, db) {
      if (err) throw err;

      const col = db.collection('origindb');

      function cb(err) {
        if (err) throw err;
        db.close();
      }

      col.updateOne({name}, {$set: {data: checksum}}, {upsert: true}, cb);
    });
  }

  save.hasLoaded = false;

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;

    db.collection('origindb').find({}).toArray(function(err, docs) {
      if (err) throw err;

      docs.forEach(function(doc) {
        try {
          objects[doc.name] = jph.parse(doc.data);
          checksums[doc.name] = JSON.stringify(objects[doc.name]);
        } catch (e) {
          if (e instanceof SyntaxError) {
            e.message = 'Malformed JSON in file: ' + file + '\n' + e.message;
          }
          throw e;
        }
      });

      save.hasLoaded = true;

      db.close();
    });
  });

  return save;
}

module.exports = Mongo;
