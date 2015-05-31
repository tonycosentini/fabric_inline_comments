var xhr = require('xhr');

// Fetch crash ID.
var crashIdRegex = /https:\/\/fabric.io\/.*\/([a-zA-Z0-9]*)/;
var crashId = crashIdRegex.exec(window.location.href)[1];

if (!crashId) {
  exit();
}

var DeveloperTokenFetcher = new function() {
  var listeners = [];
  var developerToken;

  var notifyListeners = function() {
    for (i = 0; i < listeners.length; i++) {
      listeners[0](developerToken);
    }
  };

  return {
    addListener: function(listener) {
      if (developerToken != null) {
        listener(developerToken);
      }
      listeners.push(listener);
    },
    fetch: function () {
      xhr({
        uri: 'https://fabric.io/api/v2/client_boot/config_data',
        json: true
      }, function (error, response, body) {
        developerToken = response.body.developer_token;
        notifyListeners();
      });
    }
  };
};

var AppDataFetcher = new function() {
  var appIdStringRegex = /https:\/\/fabric.io\/.*\/apps\/([A-Za-z0-9.-]*)/;
  var appIdString = appIdStringRegex.exec(window.location.href)[1];

  var listeners = [];
  var appId;

  var notifyListeners = function() {
    for (i = 0; i < listeners.length; i++) {
      listeners[0](appId);
    }
  };

  return {
    addListener: function(listener) {
      if (appId != null) {
        listener(appId);
      }
      listeners.push(listener);
    },
    fetch: function(developerToken) {
      xhr({
        uri: 'https://fabric.io/api/v2/apps?include=sdk_kit',
        headers: {
          "X-CRASHLYTICS-DEVELOPER-TOKEN": developerToken
        },
        json: true
      }, function(error, response, body) {
        for (var i in response.body) {
          var app = response.body[i];
          if (app.bundle_identifier.toLowerCase() == appIdString) {
            appId = app.id;
            notifyListeners();
            break;
          }
        }
      });
    }
  };
};

DeveloperTokenFetcher.addListener(function (developerToken) {
  AppDataFetcher.fetch(developerToken);
});
DeveloperTokenFetcher.fetch();

document.arrive("td.details", function() {
  var tdElement = this;

  AppDataFetcher.addListener(function(appId) {
    loadCommentsForRelatedIssue(tdElement, appId);
  });
});

function loadCommentsForRelatedIssue(relatedIssueTd, appId) {
  var crashID = crashIdRegex.exec(relatedIssueTd.firstElementChild['href'])[1];

  xhr({
    uri: "https://fabric.io/api/v3/projects/" + appId + "/issues/" + crashID + "/notes",
    json: true
  }, function(error, response, body) {
    // Is it possible to do this in a cleaner way without adding jQuery?
    var newline = document.createElement('br');
    relatedIssueTd.appendChild(newline);
    var bold = document.createElement('strong');
    var text;
    if (response.body.length == 0) {
      text = document.createTextNode("No Comments");
    } else {
      text = document.createTextNode("Comments");
    }
    bold.appendChild(text);
    relatedIssueTd.appendChild(bold);
    newline = document.createElement('br');
    relatedIssueTd.appendChild(newline);
    
    for (var i in response.body) {
      var note = response.body[i];
        if (note != null) {
          var comment = document.createTextNode(note.body +   " - " + note.account.name + " / " + note.account.email);

          var newline = document.createElement('br');
          relatedIssueTd.appendChild(comment);
          relatedIssueTd.appendChild(newline);
        }
    }
  });
};
