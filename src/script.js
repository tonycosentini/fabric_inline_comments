var xhr = require('xhr');

// Fetch crash ID.
var crashIDRegex = /https:\/\/fabric.io\/.*\/([a-zA-Z0-9]*)/;
var crashID = crashIDRegex.exec(window.location.href)[1];

// Fetch appID;
var appIDStringRegex = /https:\/\/fabric.io\/.*\/apps\/([A-Za-z0-9.-]*)/;
var appIDString = appIDStringRegex.exec(window.location.href)[1];

var appID;

function getAppData(developerToken, callback) {
  xhr({
    uri: 'https://fabric.io/api/v2/apps?include=sdk_kit',
    headers: {
      "X-CRASHLYTICS-DEVELOPER-TOKEN": developerToken
    },
    json: true
  }, function(error, response, body) {
    for (var i in response.body) {
      var app = response.body[i];
      if (app.bundle_identifier == appIDString) {
        appID = app.id;
        callback();
        break;
      }
    }
  });
}

document.arrive("td.details", function() {
  var tdElement = this;

  // Get an access token.
  xhr({
    uri: 'https://fabric.io/api/v2/client_boot/config_data',
    json: true
  }, function(error, response, body) {
    var developerToken = response.body.developer_token;
    getAppData(developerToken, function() {
      loadCommentsForRelatedIssue(tdElement);
    });
  });
});

function loadCommentsForRelatedIssue(relatedIssueTd) {
  var crashID = crashIDRegex.exec(relatedIssueTd.firstElementChild['href'])[1];

  xhr({
    uri: "https://fabric.io/api/v3/projects/" + appID + "/issues/" + crashID + "/notes",
    json: true
  }, function(error, response, body) {
    var bold = document.createElement('strong');
    var text = document.createTextNode("Comments");
    var newline = document.createElement('br');
    bold.appendChild(text);
    relatedIssueTd.appendChild(bold);
    relatedIssueTd.appendChild(newline);

    for (var i in response.body) {
      var note = response.body[i];
        if (note != null) {
          console.log(note.body);
          console.log(note.account.email);
          console.log(note.account.name);

          var comment = document.createTextNode(note.body +   " - " + note.account.name + " / " + note.account.email);

          var newline = document.createElement('br');

          relatedIssueTd.appendChild(comment);
          relatedIssueTd.appendChild(newline);
          relatedIssueTd.appendChild(newline);
        }
    }
  });
};
